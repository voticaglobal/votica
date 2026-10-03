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
 * Physics is purely visual (per the spec: never a stand-in for confirmed
 * weight/strength/manufacturability). A real 2D constraint chain (Matter.js),
 * not independent per-node CSS keyframe loops — each node hangs from its
 * actual attachment point (not its image center) and children follow their
 * parent's rotation because the constraint reads an offset point on the
 * parent's own body, which Matter rotates with the body automatically.
 */
export function usePartComboPhysics({
  containerRef,
  anchorPx,
  nodes,
  getNodeEl,
  enabled,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  anchorPx: { x: number; y: number } | null;
  nodes: ComboPhysicsNode[];
  getNodeEl: (uid: string) => HTMLElement | null;
  enabled: boolean;
}) {
  const selectedUidRef = useRef<string | null>(null);
  const reshakeFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!anchorPx || !container || nodes.length === 0) return;

    if (!enabled) {
      // Edit mode / reduced-motion / offscreen: render the stable rest pose
      // (straight down from each node's parent point) and do nothing else.
      let cursor = anchorPx;
      for (const node of nodes) {
        const el = getNodeEl(node.uid);
        if (!el) continue;
        const restX = cursor.x - node.selfAttachOffsetPx.x;
        const restY = cursor.y - node.selfAttachOffsetPx.y + node.radiusPx * 0.6;
        el.style.transform = `translate(${restX}px, ${restY}px) rotate(0deg)`;
        cursor = {
          x: restX + (node.parentChildOffsetPx?.x ?? 0),
          y: restY + node.radiusPx * 1.2,
        };
      }
      return;
    }

    const engine = Matter.Engine.create();
    engine.gravity.y = 1.1;

    const anchorBody = Matter.Bodies.circle(anchorPx.x, anchorPx.y, 2, { isStatic: true });
    const bodies = new Map<string, Matter.Body>();
    const composites: Matter.Body[] = [anchorBody];
    const constraints: Matter.Constraint[] = [];

    let cursorGuess = anchorPx;
    for (const node of nodes) {
      const body = Matter.Bodies.circle(cursorGuess.x, cursorGuess.y + node.radiusPx * 2, node.radiusPx, {
        frictionAir: 0.028,
      });
      bodies.set(node.uid, body);
      composites.push(body);

      const parentBody = node.parentUid ? bodies.get(node.parentUid) : undefined;
      constraints.push(
        Matter.Constraint.create({
          bodyA: parentBody ?? anchorBody,
          pointA: parentBody ? node.parentChildOffsetPx! : { x: 0, y: 0 },
          bodyB: body,
          pointB: node.selfAttachOffsetPx,
          length: 2,
          stiffness: 0.85,
          damping: 0.12,
        }),
      );
      cursorGuess = { x: body.position.x, y: body.position.y };
    }

    Matter.Composite.add(engine.world, [...composites, ...constraints]);
    // Small initial nudge so the chain visibly settles instead of looking frozen.
    const firstBody = bodies.get(nodes[0].uid);
    if (firstBody) Matter.Body.setVelocity(firstBody, { x: 1.2, y: 0 });

    reshakeFnRef.current = () => {
      const target = bodies.get(nodes[0].uid);
      if (target) Matter.Body.setVelocity(target, { x: 3.5, y: -1 });
    };

    let rafId = 0;
    let lastTime = performance.now();
    let dragging = false;

    const toContainerPoint = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const applyTransforms = () => {
      for (const node of nodes) {
        const el = getNodeEl(node.uid);
        const body = bodies.get(node.uid);
        if (!el || !body) continue;
        el.style.transform = `translate(${body.position.x}px, ${body.position.y}px) rotate(${body.angle}rad)`;
      }
    };

    const tick = (now: number) => {
      const delta = Math.min(now - lastTime, 32);
      lastTime = now;
      if (!dragging) Matter.Engine.update(engine, delta);
      applyTransforms();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    let dragBody: Matter.Body | null = null;
    let prevPoint = { x: 0, y: 0 };
    let prevTime = 0;

    const onPointerDown = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest("[data-combo-node]");
      const uid = target?.getAttribute("data-combo-node");
      const body = uid ? bodies.get(uid) : undefined;
      if (!body) return;
      dragging = true;
      dragBody = body;
      selectedUidRef.current = uid ?? null;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const p = toContainerPoint(e.clientX, e.clientY);
      Matter.Body.setPosition(body, p);
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
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
      dragging = false;
      dragBody = null;
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);

    // Pause the simulation (not just visually, but the rAF loop itself) when
    // the tab is hidden or the canvas scrolls offscreen — no wasted CPU/battery.
    let paused = false;
    const pause = () => {
      if (paused) return;
      paused = true;
      cancelAnimationFrame(rafId);
    };
    const resume = () => {
      if (!paused) return;
      paused = false;
      lastTime = performance.now();
      rafId = requestAnimationFrame(tick);
    };
    const onVisibility = () => (document.hidden ? pause() : resume());
    document.addEventListener("visibilitychange", onVisibility);
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? resume() : pause()), { threshold: 0 });
    io.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorPx?.x, anchorPx?.y, nodes, enabled]);

  return { reshake: () => reshakeFnRef.current() };
}
