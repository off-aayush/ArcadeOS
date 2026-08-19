"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  isAfter,
  isWithinInterval,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRange {
  startDate: string; // "yyyy-MM-dd"
  endDate: string;   // "yyyy-MM-dd"
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Optional preset buttons */
  presets?: { label: string; range: () => DateRange }[];
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}
function fromStr(s: string): Date {
  // parse as local date (avoid UTC offset issues)
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function DateRangePicker({ value, onChange, presets }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => fromStr(value.startDate));
  // picking: "start" on first click, "end" on second
  const [picking, setPicking] = useState<"start" | "end">("start");
  const [hovered, setHovered] = useState<Date | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPicking("start");
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const start = fromStr(value.startDate);
  const end = fromStr(value.endDate);

  // The days grid for the current view month
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Leading empty cells so the grid starts on the right weekday
  const leadingBlanks = Array.from({ length: getDay(monthStart) });

  function handleDayClick(day: Date) {
    if (picking === "start") {
      // Start fresh
      onChange({ startDate: toStr(day), endDate: toStr(day) });
      setPicking("end");
    } else {
      // If the user clicks before the current start, restart
      if (isBefore(day, start)) {
        onChange({ startDate: toStr(day), endDate: toStr(day) });
        setPicking("end");
      } else {
        onChange({ startDate: value.startDate, endDate: toStr(day) });
        setPicking("start");
        setOpen(false); // close after full range selected
      }
    }
  }

  function isStart(day: Date) {
    return isSameDay(day, start);
  }
  function isEnd(day: Date) {
    return isSameDay(day, end) && !isSameDay(start, end);
  }
  function isInRange(day: Date) {
    if (picking === "end" && hovered && isAfter(hovered, start)) {
      return isWithinInterval(day, { start, end: hovered }) && !isSameDay(day, start);
    }
    if (!isSameDay(start, end)) {
      return isWithinInterval(day, { start, end }) && !isSameDay(day, start) && !isSameDay(day, end);
    }
    return false;
  }

  const triggerLabel = isSameDay(start, end)
    ? format(start, "dd MMM yyyy")
    : `${format(start, "dd MMM")} → ${format(end, "dd MMM yyyy")}`;

  return (
    <div ref={containerRef} className="relative z-[60]">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen((o) => !o); setPicking("start"); }}
        className="flex w-full items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-2 text-left text-xs text-white hover:border-brand/60 transition-colors"
      >
        <CalendarDays className="h-3.5 w-3.5 text-brand shrink-0" />
        <span className="flex-1 truncate font-medium">{triggerLabel}</span>
        <span className="text-[10px] text-surface-muted shrink-0">
          {picking === "end" && open ? "pick end →" : ""}
        </span>
      </button>

      {/* Calendar Popover */}
      {open && (
        <div className="absolute z-[100] right-0 top-full mt-2 w-74 rounded-xl border border-surface-border bg-surface-card shadow-2xl shadow-black/50 p-4">

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-surface-muted hover:bg-surface hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-white">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-surface-muted hover:bg-surface hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-center text-[10px] font-semibold text-surface-muted py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {leadingBlanks.map((_, i) => <div key={`blank-${i}`} />)}
            {days.map((day) => {
              const _isStart = isStart(day);
              const _isEnd = isEnd(day);
              const _inRange = isInRange(day);
              const isSingleDay = isSameDay(start, end) && _isStart;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => picking === "end" && setHovered(day)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    "relative h-8 w-full text-xs transition-colors",
                    // Range fill (middle days)
                    _inRange && "bg-brand/20 text-white",
                    // Start day
                    _isStart && !isSingleDay && "bg-brand/20 rounded-l-full text-white",
                    // End day
                    _isEnd && "bg-brand/20 rounded-r-full text-white",
                    // The circle highlight for start/end
                    !_inRange && !_isStart && !_isEnd && "rounded-full text-surface-muted hover:bg-surface hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "relative z-10 flex h-7 w-7 mx-auto items-center justify-center rounded-full text-xs font-medium",
                      (_isStart || isSingleDay) && "bg-brand text-white shadow-sm shadow-brand/40",
                      _isEnd && "bg-brand text-white shadow-sm shadow-brand/40",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Presets */}
          {presets && presets.length > 0 && (
            <div className="mt-3 pt-3 border-t border-surface-border/60 flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    const r = p.range();
                    onChange(r);
                    setViewMonth(fromStr(r.startDate));
                    setOpen(false);
                    setPicking("start");
                  }}
                  className="rounded-md border border-surface-border bg-surface px-2.5 py-1 text-[11px] text-surface-muted hover:border-brand/50 hover:text-brand transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Hint */}
          <p className="mt-2 text-center text-[10px] text-surface-muted/60">
            {picking === "start" ? "Click a day to set start date" : "Now click the end date"}
          </p>
        </div>
      )}
    </div>
  );
}
