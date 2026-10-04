import { useEffect, useRef, type RefObject } from "react";
import Matter from "matter-js";

export type ComboPhysicsNode = {
  uid: string;
  /** Offset (px) from this node's own visual center to its own attachment point — where IT hangs from its parent. */
  selfAttachOffsetPx: { x: number; y: number };
  /** Offset (px) from the PARENT's visual center to the child point this node uses. Null when parentUid is null (attaches to the fixed world anchor instead). */
  parentChildOffsetPx: { x: number; y: number } | null;
  parentUid: string | null;
  /** Drives the physics body's size/inertia — roughly the part's own display radius. */
  radiusPx: number;
};

/**
 * off:  stable rest pose, no simulation (reduced motion, motion off, page load).
 * kick: edit mode — after a part is added or removed, the chain swings briefly and settles; no dragging.
 * live: preview mode — the chain keeps swinging and the bottom part can be pulled and released.
 */
export type ComboPhysicsMode = "off" | "kick" | "live";

const KICK_DURATION_MS = 2600;
const PULL_ANGLE_RAD = 0.5;
const MAX_STEP_MS = 32;

type Vec = { x: number; y: number };

function pivotOf(node: ComboPhysicsNode, centers: Map<string, Vec>, anchor: Vec): Vec {
  const parentCenter = node.parentUid ? centers.get(node.parentUid) : undefined;
  if (!parentCenter || !node.parentChildOffsetPx) return anchor;
  return { x: parentCenter.x + node.parentChildOffsetPx.x, y: parentCenter.y + node.parentChildOffsetPx.y };
}

/** Body centers for the hanging rest pose: every pivot coincides with its parent's child point exactly. */
function restCenters(anchor: Vec, nodes: ComboPhysicsNode[]): Map<string, Vec> {
  const centers = new Map<string, Vec>();
  for (const node of nodes) {
    const pivot = pivotOf(node, centers, anchor);
    centers.set(node.uid, {
      x: pivot.x - node.selfAttachOffsetPx.x,
      y: pivot.y - node.selfAttachOffsetPx.y,
    });
  }
  return centers;
}

function writeTransform(el: HTMLElement, x: number, y: number, angle: number) {
  el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
}

/**
 * Physics is purely visual (never a stand-in for confirmed weight, strength, or
 * manufacturability). Each part is a rigid body pinned to its parent's
 * attachment point by a Matter.js constraint; children inherit the parent's
 * rotation because the constraint reads a local offset on the parent body.
 */
export function usePartComboPhysics({
  containerRef,
  anchorPx,
  nodes,
  getNodeEl,
  mode,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  anchorPx: { x: number; y: number } | null;
  nodes: ComboPhysicsNode[];
  getNodeEl: (uid: string) => HTMLElement | null;
  mode: ComboPhysicsMode;
}) {
  const reshakeFnRef = useRef<() => void>(() => {});
  const seenSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const signature = nodes.map((n) => n.uid).join("|");
    const previousSignature = seenSignatureRef.current;
    seenSignatureRef.current = signature;
    const partsChanged = previousSignature !== null && previousSignature !== signature;
    if (!anchorPx || !container || nodes.length === 0) return;

    const anchor = anchorPx;
    const centers = restCenters(anchor, nodes);

    const writeRest = () => {
      for (const node of nodes) {
        const el = getNodeEl(node.uid);
        const c = centers.get(node.uid);
        if (el && c) writeTransform(el, c.x, c.y, 0);
      }
    };

    if (mode === "off" || (mode === "kick" && !partsChanged)) {
      writeRest();
      return;
    }

    const interactive = mode === "live";
    const engine = Matter.Engine.create();

    const anchorBody = Matter.Bodies.circle(anchor.x, anchor.y, 2, {
      isStatic: true,
      collisionFilter: { group: -1 },
    });
    const ordered: { node: ComboPhysicsNode; body: Matter.Body }[] = [];
    const bodies = new Map<string, Matter.Body>();
    const constraints: Matter.Constraint[] = [];

    for (const node of nodes) {
      const c = centers.get(node.uid)!;
      const body = Matter.Bodies.circle(c.x, c.y, node.radiusPx, {
        frictionAir: 0.04,
        collisionFilter: { group: -1 },
      });
      const parentBody = node.parentUid ? bodies.get(node.parentUid) : undefined;
      constraints.push(
        Matter.Constraint.create({
          bodyA: parentBody ?? anchorBody,
          pointA: parentBody && node.parentChildOffsetPx ? node.parentChildOffsetPx : { x: 0, y: 0 },
          bodyB: body,
          pointB: node.selfAttachOffsetPx,
          length: 0,
          stiffness: 0.9,
        }),
      );
      bodies.set(node.uid, body);
      ordered.push({ node, body });
    }
    Matter.Composite.add(engine.world, [anchorBody, ...ordered.map((o) => o.body), ...constraints]);

    // Pull the bottom-most part sideways around its own pivot, then let go: the
    // pivot stays on the attachment point while the part swings back.
    const tail = ordered[ordered.length - 1];
    const tailPivot = pivotOf(tail.node, centers, anchor);
    const tailCenter = centers.get(tail.node.uid)!;
    const cos = Math.cos(PULL_ANGLE_RAD);
    const sin = Math.sin(PULL_ANGLE_RAD);
    const dx = tailCenter.x - tailPivot.x;
    const dy = tailCenter.y - tailPivot.y;
    Matter.Body.setAngle(tail.body, PULL_ANGLE_RAD);
    Matter.Body.setPosition(tail.body, {
      x: tailPivot.x + dx * cos - dy * sin,
      y: tailPivot.y + dx * sin + dy * cos,
    });

    const applyTransforms = () => {
      for (const { node, body } of ordered) {
        const el = getNodeEl(node.uid);
        if (el) writeTransform(el, body.position.x, body.position.y, body.angle);
      }
    };
    applyTransforms();

    const startedAt = performance.now();
    let lastTime = startedAt;
    let rafId = 0;
    let running = false;
    let dragging = false;
    let dragBody: Matter.Body | null = null;
    let prevPoint = { x: 0, y: 0 };
    let prevTime = 0;

    const toContainerPoint = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const tick = (now: number) => {
      const delta = Math.min(now - lastTime, MAX_STEP_MS);
      lastTime = now;
      if (!dragging) Matter.Engine.update(engine, delta);
      applyTransforms();
      if (mode === "kick" && now - startedAt > KICK_DURATION_MS) {
        running = false;
        writeRest();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTime = performance.now();
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const hit = ordered.find(({ node }) => getNodeEl(node.uid)?.contains(target));
      if (!hit) return;
      dragging = true;
      dragBody = hit.body;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const p = toContainerPoint(e.clientX, e.clientY);
      Matter.Body.setPosition(hit.body, p);
      Matter.Body.setVelocity(hit.body, { x: 0, y: 0 });
      prevPoint = p;
      prevTime = performance.now();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || !dragBody) return;
      const p = toContainerPoint(e.clientX, e.clientY);
      const now = performance.now();
      const dt = Math.max(now - prevTime, 1);
      Matter.Body.setPosition(dragBody, p);
      Matter.Body.setVelocity(dragBody, { x: ((p.x - prevPoint.x) / dt) * 16, y: ((p.y - prevPoint.y) / dt) * 16 });
      prevPoint = p;
      prevTime = now;
    };
    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      dragBody = null;
    };

    if (interactive) {
      container.addEventListener("pointerdown", onPointerDown);
      container.addEventListener("pointermove", onPointerMove);
      container.addEventListener("pointerup", onPointerUp);
      container.addEventListener("pointercancel", onPointerUp);
    }

    reshakeFnRef.current = () => {
      Matter.Body.setVelocity(tail.body, { x: 4, y: 0 });
      start();
    };

    // Pause the simulation when the tab is hidden or the canvas scrolls offscreen.
    let offscreen = false;
    let hidden = document.hidden;
    const syncRunning = () => {
      const kickDone = mode === "kick" && performance.now() - startedAt > KICK_DURATION_MS;
      if (hidden || offscreen || kickDone) stop();
      else start();
    };
    const onVisibility = () => {
      hidden = document.hidden;
      syncRunning();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const io = new IntersectionObserver(
      ([entry]) => {
        offscreen = !entry.isIntersecting;
        syncRunning();
      },
      { threshold: 0 },
    );
    io.observe(container);

    syncRunning();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      if (interactive) {
        container.removeEventListener("pointerdown", onPointerDown);
        container.removeEventListener("pointermove", onPointerMove);
        container.removeEventListener("pointerup", onPointerUp);
        container.removeEventListener("pointercancel", onPointerUp);
      }
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorPx?.x, anchorPx?.y, nodes, mode]);

  return { reshake: () => reshakeFnRef.current() };
}
