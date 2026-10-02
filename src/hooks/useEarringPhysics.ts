import { useEffect, type RefObject } from "react";
import Matter from "matter-js";

/**
 * Hangs the earring image from `anchorPx` with a real 2D pendulum (Matter.js):
 * gravity pulls it to rest straight down, dragging it and letting go makes it
 * swing and settle naturally, the way the earring actually hangs off the ear
 * in the reference app rather than snapping to a fixed position.
 */
export function useEarringPhysics({
  containerRef,
  imgRef,
  anchorPx,
  chainLength,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  imgRef: RefObject<HTMLImageElement | null>;
  anchorPx: { x: number; y: number } | null;
  chainLength: number;
}) {
  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!anchorPx || !container || !img) return;

    const engine = Matter.Engine.create();
    engine.gravity.y = 1.1;

    const anchorBody = Matter.Bodies.circle(anchorPx.x, anchorPx.y, 2, { isStatic: true });
    const bob = Matter.Bodies.circle(anchorPx.x, anchorPx.y + chainLength, 6, {
      frictionAir: 0.025,
    });
    const constraint = Matter.Constraint.create({
      bodyA: anchorBody,
      bodyB: bob,
      length: chainLength,
      stiffness: 0.9,
      damping: 0.08,
    });
    Matter.Composite.add(engine.world, [anchorBody, bob, constraint]);

    // small nudge on mount so it visibly settles instead of appearing frozen
    Matter.Body.setVelocity(bob, { x: 1.4, y: 0 });

    let dragging = false;
    let rafId = 0;
    let lastTime = performance.now();
    let prevPoint = { x: anchorPx.x, y: anchorPx.y };
    let prevTime = lastTime;

    const toContainerPoint = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const tick = (now: number) => {
      const delta = Math.min(now - lastTime, 32);
      lastTime = now;
      if (!dragging) Matter.Engine.update(engine, delta);

      const dx = bob.position.x - anchorPx.x;
      const dy = bob.position.y - anchorPx.y;
      const angleRad = Math.atan2(dx, dy); // 0 = hanging straight down
      img.style.transform = `translateX(-50%) rotate(${angleRad}rad)`;

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      img.setPointerCapture(e.pointerId);
      const p = toContainerPoint(e.clientX, e.clientY);
      Matter.Body.setPosition(bob, p);
      Matter.Body.setVelocity(bob, { x: 0, y: 0 });
      prevPoint = p;
      prevTime = performance.now();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const p = toContainerPoint(e.clientX, e.clientY);
      const now = performance.now();
      const dt = Math.max(now - prevTime, 1);
      Matter.Body.setPosition(bob, p);
      Matter.Body.setVelocity(bob, {
        x: ((p.x - prevPoint.x) / dt) * 16,
        y: ((p.y - prevPoint.y) / dt) * 16,
      });
      prevPoint = p;
      prevTime = now;
    };
    const onPointerUp = () => {
      dragging = false;
    };

    img.addEventListener("pointerdown", onPointerDown);
    img.addEventListener("pointermove", onPointerMove);
    img.addEventListener("pointerup", onPointerUp);
    img.addEventListener("pointercancel", onPointerUp);

    return () => {
      cancelAnimationFrame(rafId);
      img.removeEventListener("pointerdown", onPointerDown);
      img.removeEventListener("pointermove", onPointerMove);
      img.removeEventListener("pointerup", onPointerUp);
      img.removeEventListener("pointercancel", onPointerUp);
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorPx?.x, anchorPx?.y, chainLength]);
}
