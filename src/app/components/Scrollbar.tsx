/**
 * Chunky line-tic-tac scrollbar: cupped end caps (not arrows) and a rounded
 * grey thumb. Native overflow stays on the viewport; this rail is the look.
 */
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import "./Scrollbar.css";

const MIN_THUMB_PX = 40;
const MAX_THUMB_PX = 68;
const PAGE_FACTOR = 0.85;

type Metrics = {
  overflow: boolean;
  thumbPx: number;
  thumbOffset: number;
  valueNow: number;
};

const EMPTY: Metrics = { overflow: false, thumbPx: MIN_THUMB_PX, thumbOffset: 0, valueNow: 0 };

function readMetrics(view: HTMLElement, trackPx: number): Metrics {
  const maxScroll = view.scrollHeight - view.clientHeight;
  if (maxScroll <= 1) return EMPTY;
  if (trackPx <= 0) {
    return { overflow: true, thumbPx: MIN_THUMB_PX, thumbOffset: 0, valueNow: 0 };
  }
  const ratio = view.clientHeight / view.scrollHeight;
  const thumbPx = Math.min(
    trackPx,
    MAX_THUMB_PX,
    Math.max(MIN_THUMB_PX, Math.round(trackPx * ratio)),
  );
  const travel = Math.max(1, trackPx - thumbPx);
  const thumbOffset = Math.round((view.scrollTop / maxScroll) * travel);
  return {
    overflow: true,
    thumbPx,
    thumbOffset,
    valueNow: Math.round((view.scrollTop / maxScroll) * 100),
  };
}

function ScrollCap({ end }: { end: "start" | "end" }) {
  const d =
    end === "start"
      ? "M2.4 11.4 V6.4 A7.6 5.8 0 0 1 17.6 6.4 V11.4"
      : "M2.4 0.6 V5.6 A7.6 5.8 0 0 0 17.6 5.6 V0.6";
  return (
    <svg viewBox="0 0 20 12" width="20" height="13" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Scrollbar({
  children,
  className,
  viewportClassName,
  viewportId,
  inert,
  "aria-hidden": ariaHidden,
}: {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
  viewportId?: string;
  inert?: boolean;
  "aria-hidden"?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startY: number;
    startTop: number;
    travel: number;
    maxScroll: number;
  } | null>(null);
  const [metrics, setMetrics] = useState<Metrics>(EMPTY);
  const [dragging, setDragging] = useState(false);

  const measure = useCallback(() => {
    const view = viewportRef.current;
    const track = trackRef.current;
    if (!view) {
      setMetrics(EMPTY);
      return;
    }
    setMetrics(readMetrics(view, track?.clientHeight ?? 0));
  }, []);

  useLayoutEffect(() => {
    const view = viewportRef.current;
    if (!view) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(view);
    if (view.firstElementChild) ro.observe(view.firstElementChild);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, children]);

  const pageBy = (dir: -1 | 1) => {
    const view = viewportRef.current;
    if (!view) return;
    view.scrollTop += dir * view.clientHeight * PAGE_FACTOR;
  };

  const onThumbPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const view = viewportRef.current;
    const track = trackRef.current;
    if (!view || !track) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startY: e.clientY,
      startTop: view.scrollTop,
      travel: Math.max(1, track.clientHeight - metrics.thumbPx),
      maxScroll: view.scrollHeight - view.clientHeight,
    };
    setDragging(true);
  };

  const onThumbPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const view = viewportRef.current;
    if (!drag || !view) return;
    const delta = ((e.clientY - drag.startY) / drag.travel) * drag.maxScroll;
    view.scrollTop = drag.startTop + delta;
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      setDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const onTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const view = viewportRef.current;
    const track = trackRef.current;
    if (!view || !track) return;
    const y = e.clientY - track.getBoundingClientRect().top;
    const thumbCenter = metrics.thumbOffset + metrics.thumbPx / 2;
    pageBy(y < thumbCenter ? -1 : 1);
  };

  const onRailWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    viewportRef.current?.scrollBy({ top: e.deltaY });
  };

  const atStart = metrics.valueNow <= 0;
  const atEnd = metrics.valueNow >= 100;

  return (
    <div
      className={["scrollbar-host", className].filter(Boolean).join(" ")}
      data-scrollbar="vertical"
      data-overflow={metrics.overflow ? "true" : "false"}
    >
      <div
        ref={viewportRef}
        id={viewportId}
        className={["scrollbar-viewport", viewportClassName].filter(Boolean).join(" ")}
        inert={inert || undefined}
        aria-hidden={ariaHidden}
        onScroll={measure}
      >
        {children}
      </div>
      <div
        className={["scrollbar-rail", dragging ? "is-dragging" : undefined]
          .filter(Boolean)
          .join(" ")}
        data-scrollbar-rail=""
        data-visible={metrics.overflow ? "true" : "false"}
        aria-hidden={!metrics.overflow}
        onWheel={onRailWheel}
      >
        <button
          type="button"
          className="scrollbar-cap"
          aria-label="Scroll up"
          tabIndex={-1}
          disabled={atStart}
          onClick={() => pageBy(-1)}
        >
          <ScrollCap end="start" />
        </button>
        <div ref={trackRef} className="scrollbar-track" onPointerDown={onTrackPointerDown}>
          <div
            className="scrollbar-thumb"
            role="scrollbar"
            aria-controls={viewportId}
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={metrics.valueNow}
            style={{ height: metrics.thumbPx, top: metrics.thumbOffset }}
            onPointerDown={onThumbPointerDown}
            onPointerMove={onThumbPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        </div>
        <button
          type="button"
          className="scrollbar-cap"
          aria-label="Scroll down"
          tabIndex={-1}
          disabled={atEnd}
          onClick={() => pageBy(1)}
        >
          <ScrollCap end="end" />
        </button>
      </div>
    </div>
  );
}
