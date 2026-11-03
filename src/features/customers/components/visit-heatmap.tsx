"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES, CUSTOMER_STALE_TIME } from "@/lib/constants";
import { ApiResponse } from "@/types";
import { cn } from "@/lib/utils";

type VisitDay = { date: string; count: number };
type VisitHistory = {
  days: VisitDay[];
  total: number;
  timezone: string;
  currentYear: number;
};

const SHADES = [
  "bg-surface-border/70",
  "bg-brand/30",
  "bg-brand/50",
  "bg-brand/75",
  "bg-brand",
];

function intensity(count: number) {
  return count === 0 ? 0 : Math.min(count, 4);
}

function yearWeeks(year: number) {
  const first = new Date(Date.UTC(year, 0, 1));
  first.setUTCDate(first.getUTCDate() - first.getUTCDay());
  const last = new Date(Date.UTC(year, 11, 31));
  last.setUTCDate(last.getUTCDate() + 6 - last.getUTCDay());
  const weeks: { date: string; inYear: boolean }[][] = [];
  for (let start = first.getTime(); start <= last.getTime(); start += 7 * 86400000) {
    weeks.push(Array.from({ length: 7 }, (_, day) => {
      const date = new Date(start + day * 86400000);
      return { date: date.toISOString().slice(0, 10), inYear: date.getUTCFullYear() === year };
    }));
  }
  return weeks;
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function shortDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function calendarDimensions(weekCount: number, viewportWidth: number) {
  const popupWidth = Math.min(760, viewportWidth - 16);
  const contentWidth = popupWidth - 26; // border and p-3 on both sides
  const gap = viewportWidth < 600 ? 1 : 2;
  const cell = Math.min(12, (contentWidth - (weekCount - 1) * gap) / weekCount);
  return { cell, gap, width: weekCount * cell + (weekCount - 1) * gap };
}

export function popupPlacement(
  trigger: { left: number; top: number; bottom: number },
  popup: { width: number; height: number },
  viewport: { width: number; height: number },
) {
  const scale = Math.min(
    1,
    Math.max(0.01, (viewport.width - 16) / popup.width),
    Math.max(0.01, (viewport.height - 16) / popup.height),
  );
  const scaledWidth = popup.width * scale;
  const scaledHeight = popup.height * scale;
  const left = Math.max(8, Math.min(trigger.left, viewport.width - scaledWidth - 8));
  const below = trigger.bottom + 8;
  const preferredTop = below + scaledHeight <= viewport.height - 8
    ? below : trigger.top - scaledHeight - 8;
  const top = Math.max(8, Math.min(preferredTop, viewport.height - scaledHeight - 8));
  return { top, left, scale };
}

/** Calendar display shared by the visit popup; dates are local-day keys from the API. */
export function VisitHeatmap({ history, customerName, viewportWidth = 760 }: {
  history: VisitHistory; customerName: string | null; viewportWidth?: number;
}) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const year = selectedYear ?? history.currentYear;
  const weeks = yearWeeks(year);
  const { cell, gap, width } = calendarDimensions(weeks.length, viewportWidth);
  const counts = new Map(history.days.map((day) => [day.date, day.count]));
  const yearDays = history.days.filter((day) => day.date.startsWith(`${year}-`));
  const yearTotal = yearDays.reduce((sum, day) => sum + day.count, 0);
  const lastVisit = yearDays.at(-1);
  const busiestDay = yearDays.reduce<VisitDay | null>(
    (busiest, day) => !busiest || day.count >= busiest.count ? day : busiest,
    null,
  );
  const firstYear = history.days.length
    ? Number(history.days[0].date.slice(0, 4))
    : history.currentYear;
  const lastYear = Math.max(history.currentYear, Number(history.days.at(-1)?.date.slice(0, 4) ?? 0));
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [pointedDate, setPointedDate] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const firstDate = `${year}-01-01`;
  const shownDate = pointedDate ?? activeDate;
  const displayedCount = shownDate ? counts.get(shownDate) ?? 0 : 0;
  const monthLabels = Array.from({ length: 12 }, (_, month) => {
    const date = new Date(Date.UTC(year, month, 1));
    const weekIndex = Math.floor(
      (date.getTime() - new Date(`${weeks[0][0].date}T00:00:00Z`).getTime()) / (7 * 86400000)
    );
    return {
      label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(date),
      left: weekIndex * (cell + gap),
    };
  });

  const moveFocus = (date: string, delta: number) => {
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + delta);
    if (next.getUTCFullYear() !== year) return;
    const key = next.toISOString().slice(0, 10);
    setActiveDate(key);
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>(`[data-date="${key}"]`)?.focus();
    });
  };

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white" title={customerName || "Guest"}>
            Visit Calendar <span className="text-brand">·</span> {customerName || "Guest"}
          </div>
          <div className="text-xs text-surface-muted">All-time: {history.total} completed visits · {history.timezone}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs">
          <button type="button" disabled={year <= firstYear} onClick={() => { setSelectedYear(year - 1); setActiveDate(null); setPointedDate(null); }}
            aria-label="Previous year" className="rounded px-2 py-1 text-white hover:bg-surface-hover disabled:opacity-40">‹</button>
          <span className="min-w-10 rounded border border-brand/40 bg-brand/15 px-1 py-0.5 text-center font-semibold text-brand" aria-label={`Selected year ${year}`}>{year}</span>
          <button type="button" disabled={year >= lastYear} onClick={() => { setSelectedYear(year + 1); setActiveDate(null); setPointedDate(null); }}
            aria-label="Next year" className="rounded px-2 py-1 text-white hover:bg-surface-hover disabled:opacity-40">›</button>
        </div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {[
          { label: "Total Visits", value: yearTotal.toString() },
          { label: "Active Days", value: yearDays.length.toString() },
          { label: "Last Visit", value: lastVisit ? shortDate(lastVisit.date) : "—" },
          { label: "Busiest Day", value: busiestDay ? `${shortDate(busiestDay.date)} · ${busiestDay.count}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="min-w-0 rounded-lg border border-surface-border bg-surface px-2.5 py-1.5">
            <div className="text-[10px] text-surface-muted">{label}</div>
            <div className="truncate text-xs font-semibold text-white" title={value}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ width }}>
          <div className="relative h-4 text-[9px] text-surface-muted sm:text-[10px]">
            {monthLabels.map(({ label, left }, index) => (
              <span key={index} className="absolute" style={{ left }}>
                {viewportWidth < 400 ? label.slice(0, 2) : label}
              </span>
            ))}
          </div>
          <div ref={gridRef} className="flex" style={{ gap }} aria-label={`Visits in ${year}; use arrow keys to move between dates`}>
            {weeks.map((week, index) => (
              <div key={index} className="flex flex-col" style={{ gap }}>
                {week.map(({ date, inYear }) => {
                  const count = counts.get(date) ?? 0;
                  return inYear ? (
                    <button key={date} type="button" data-date={date}
                      aria-label={`${dateLabel(date)}: ${count} ${count === 1 ? "visit" : "visits"}`}
                      title={`${dateLabel(date)}: ${count} ${count === 1 ? "visit" : "visits"}`}
                      tabIndex={(activeDate ?? firstDate) === date ? 0 : -1}
                      onMouseEnter={() => setPointedDate(date)}
                      onMouseLeave={() => setPointedDate(null)}
                      onFocus={() => setActiveDate(date)}
                      onKeyDown={(event) => {
                        const delta = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 }[event.key];
                        if (delta) { event.preventDefault(); moveFocus(date, delta); }
                      }}
                      className={cn("rounded-[2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand", SHADES[intensity(count)])}
                      style={{ width: cell, height: cell }} />
                  ) : <span key={date} style={{ width: cell, height: cell }} />;
                })}
              </div>
            ))}
          </div>
      </div>
      <div className="mt-2 flex min-h-4 items-center justify-between gap-2 text-[11px] text-surface-muted">
        <span aria-live="polite">{shownDate ? `${dateLabel(shownDate)}: ${displayedCount} ${displayedCount === 1 ? "visit" : "visits"}` : "Hover or focus a date for its count"}</span>
        <div className="flex shrink-0 items-center gap-1" aria-label="Visit intensity: fewer to more">
          <span>Less</span>
          {SHADES.map((shade, index) => <span key={index} className={cn("h-2.5 w-2.5 rounded-[2px]", shade)} />)}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export function CustomerVisitPopup({ customerId, customerName, totalVisits }: {
  customerId: string; customerName: string | null; totalVisits: number;
}) {
  const [open, setOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    () => typeof window === "undefined" ? 760 : window.innerWidth
  );
  const [position, setPosition] = useState<{ top: number; left: number; scale: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<VisitHistory>>({
    queryKey: ["customer-visits", customerId],
    queryFn: async () => {
      const response = await fetch(`${API_ROUTES.customers}/${customerId}/visits`);
      if (!response.ok) throw new Error("Failed to load visit history");
      return response.json();
    },
    enabled: open,
    staleTime: CUSTOMER_STALE_TIME,
  });

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const popup = popupRef.current;
      if (!trigger || !popup) return;
      setViewportWidth(window.innerWidth);
      setPosition(popupPlacement(
        trigger,
        { width: popup.offsetWidth, height: popup.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
      ));
    };
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    if (popupRef.current) observer.observe(popupRef.current);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, data, isLoading, isError]);

  useLayoutEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!triggerRef.current?.contains(event.target as Node) && !popupRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      cancelClose();
    };
  }, [open]);

  return (
    <>
      <button ref={triggerRef} type="button" aria-label={`Show visit calendar for ${customerName || "Guest"}`}
        aria-expanded={open} aria-haspopup="dialog"
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        onMouseLeave={scheduleClose}
        onFocus={() => { cancelClose(); setOpen(true); }}
        onBlur={scheduleClose}
        onClick={() => { cancelClose(); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Tab" && !event.shiftKey && open) {
            const firstControl = popupRef.current?.querySelector<HTMLElement>("button:not([disabled])") ?? popupRef.current;
            if (firstControl) { event.preventDefault(); firstControl.focus(); }
          }
        }}
        className="rounded px-1 font-mono text-white underline decoration-brand/50 underline-offset-4 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
        {totalVisits}
      </button>
      {open && createPortal(
        <div ref={popupRef} role="dialog" tabIndex={-1} aria-label={`Visit calendar for ${customerName || "Guest"}`}
          onMouseEnter={cancelClose} onMouseLeave={scheduleClose}
          onFocus={cancelClose}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) scheduleClose();
          }}
          className="fixed z-[100] rounded-xl border border-surface-border bg-surface-card p-3 shadow-2xl shadow-black/50"
          style={{ top: position?.top ?? 8, left: position?.left ?? 8, width: "min(760px, calc(100vw - 16px))", visibility: position ? "visible" : "hidden", transform: `scale(${position?.scale ?? 1})`, transformOrigin: "top left" }}>
          {isLoading ? <p role="status" className="py-8 text-center text-xs text-surface-muted">Loading visit calendar…</p>
            : isError || !data?.success ? (
              <div role="alert" className="py-5 text-center text-xs text-surface-muted">
                Could not load visits. <button type="button" onClick={() => refetch()} className="text-brand underline">Retry</button>
              </div>
            ) : <VisitHeatmap history={data.data} customerName={customerName} viewportWidth={viewportWidth} />}
        </div>,
        document.body
      )}
    </>
  );
}
