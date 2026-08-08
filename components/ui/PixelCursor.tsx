"use client";

import { useEffect, useRef } from "react";
import { assetPath } from "@/lib/asset-path";

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "[role='button']",
  "input",
  "textarea",
  "select",
  "summary",
  "label[for]",
  "[data-cursor='pointer']",
].join(",");

const SPARK_COUNT = 6;

export default function PixelCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const sparkRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const nextSpark = useRef(0);
  const lastSpark = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const enabled = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 901px)",
    );

    if (!enabled.matches) return;

    const root = document.documentElement;
    const cursor = cursorRef.current;
    if (!cursor) return;

    root.classList.add("pixel-cursor-enabled");

    const setInteractive = (value: boolean) => {
      cursor.classList.toggle("pixel-cursor--interactive", value);
    };

    const showSpark = (x: number, y: number) => {
      const distance = Math.hypot(
        x - lastSpark.current.x,
        y - lastSpark.current.y,
      );
      if (distance < 14) return;

      lastSpark.current = { x, y };

      const spark = sparkRefs.current[nextSpark.current % SPARK_COUNT];
      nextSpark.current += 1;
      if (!spark) return;

      const n = nextSpark.current;
      const offsetX = ((n % 3) - 1) * 5;
      const offsetY = (((n + 1) % 3) - 1) * 4;

      spark.style.left = `${x + offsetX}px`;
      spark.style.top = `${y + offsetY}px`;
      spark.classList.remove("pixel-cursor__spark--active");
      void spark.offsetWidth;
      spark.classList.add("pixel-cursor__spark--active");
    };

    const onMove = (event: MouseEvent) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.classList.add("pixel-cursor--visible");

      const underMouse = document.elementFromPoint(event.clientX, event.clientY);
      const interactive =
        underMouse instanceof Element &&
        Boolean(underMouse.closest(INTERACTIVE_SELECTOR));

      setInteractive(interactive);
      showSpark(event.clientX, event.clientY);
    };

    const onLeave = () => cursor.classList.remove("pixel-cursor--visible");
    const onEnter = () => cursor.classList.add("pixel-cursor--visible");

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      root.classList.remove("pixel-cursor-enabled");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="pixel-cursor" aria-hidden="true">
        <img
          src={assetPath("/assets/cursor/pixel-cursor.png")}
          alt=""
          draggable={false}
        />
      </div>

      <div className="pixel-cursor__trail" aria-hidden="true">
        {Array.from({ length: SPARK_COUNT }).map((_, index) => (
          <span
            key={index}
            ref={(element) => {
              sparkRefs.current[index] = element;
            }}
            className={`pixel-cursor__spark pixel-cursor__spark--${index % 3}`}
          />
        ))}
      </div>
    </>
  );
}
