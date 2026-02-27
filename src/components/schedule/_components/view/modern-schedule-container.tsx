"use client";

import React, { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Calendar, CalendarDays, Grid3X3, Plus, Keyboard, Sparkles, Lightbulb, X } from "lucide-react";
import { useModal } from "@/providers/modal-context";
import { useScheduler } from "@/providers/schedular-provider";
import { Event, CustomEventModal as CustomEventModalType } from "@/types";
import UnifiedEventModal from "../../_modals/unified-event-modal";

// Dynamic imports for views
import dynamic from "next/dynamic";

const ModernDayView = dynamic(() => import("./day/modern-day-view"), { 
  ssr: false,
  loading: () => <ViewSkeleton />
});
const ModernWeekView = dynamic(() => import("./week/modern-week-view"), { 
  ssr: false,
  loading: () => <ViewSkeleton />
});
const ModernMonthView = dynamic(() => import("./month/modern-month-view"), { 
  ssr: false,
  loading: () => <ViewSkeleton />
});

// Premium loading skeleton
function ViewSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/50 p-6 animate-pulse shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-200 to-violet-200 dark:from-purple-800 dark:to-violet-800 rounded-xl" />
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-48" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/50 rounded-xl" style={{ opacity: 1 - i * 0.1 }} />
        ))}
      </div>
    </div>
  );
}

type ViewType = "day" | "week" | "month";

interface ModernScheduleContainerProps {
  initialView?: ViewType;
  CustomEventModal?: CustomEventModalType;
  onEventClick?: (event: Event) => void;
  onViewChange?: (view: ViewType) => void;
}

const VIEW_OPTIONS: Array<{ key: ViewType; label: string; icon: React.ReactNode; shortcut: string }> = [
  { key: "day", label: "Day", icon: <Calendar className="w-4 h-4" />, shortcut: "D" },
  { key: "week", label: "Week", icon: <CalendarDays className="w-4 h-4" />, shortcut: "W" },
  { key: "month", label: "Month", icon: <Grid3X3 className="w-4 h-4" />, shortcut: "M" },
];

export default function ModernScheduleContainer({
  initialView = "week",
  CustomEventModal,
  onEventClick,
  onViewChange,
}: ModernScheduleContainerProps) {
  const { setOpen, setClose } = useModal();
  const [activeView, setActiveView] = useState<ViewType>(initialView);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Try to get scheduler handlers if available
  let handlers: any = {};
  try {
    const sched = useScheduler();
    handlers = sched?.handlers || {};
  } catch (e) {
    handlers = {};
  }

  // Handle view change
  const handleViewChange = useCallback(
    (view: ViewType) => {
      setActiveView(view);
      onViewChange?.(view);
    },
    [onViewChange]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "d":
          handleViewChange("day");
          break;
        case "w":
          handleViewChange("week");
          break;
        case "m":
          handleViewChange("month");
          break;
        case "n":
          // New event - open full create modal
          setShowCreateModal(true);
          break;
        case "t":
          // Go to today
          window.dispatchEvent(new CustomEvent("scheduler:goToToday"));
          break;
        case "?":
          setShowShortcuts((s) => !s);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleViewChange]);

  // Handle event click - open edit modal
  const handleEventClick = useCallback(
    (event: Event) => {
      if (onEventClick) {
        onEventClick(event);
      } else {
        // Default: open event details/edit modal
        // This would be implemented to show event details
        console.log("Event clicked:", event);
      }
    },
    [onEventClick]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar - Premium */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-1">
        {/* View Switcher - Premium */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 shadow-inner">
          {VIEW_OPTIONS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleViewChange(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300",
                activeView === key
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-500/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
              )}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Keyboard shortcuts hint */}
          <button
            onClick={() => setShowShortcuts((s) => !s)}
            className={cn(
              "hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200",
              "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
              showShortcuts && "bg-slate-100 dark:bg-slate-800"
            )}
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">?</kbd>
          </button>

          {/* Add Event Button - Premium gradient */}
          <button
            onClick={() => setShowCreateModal(true)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
              "bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700",
              "text-white shadow-lg shadow-purple-500/30",
              "hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] hover:-translate-y-0.5",
              "active:scale-[0.98] active:translate-y-0"
            )}
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-white/20 rounded">
              N
            </kbd>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Panel - Premium */}
      {showShortcuts && (
        <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/50 shadow-xl animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Keyboard className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Keyboard Shortcuts
              </h3>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
            {[
              { key: "D", label: "Day view" },
              { key: "W", label: "Week view" },
              { key: "M", label: "Month view" },
              { key: "N", label: "New event" },
              { key: "T", label: "Go to today" },
              { key: "?", label: "Toggle shortcuts" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <kbd className="px-2 py-1 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg font-mono text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm">
                  {key}
                </kbd>
                <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Content */}
      <div className="min-h-[500px]">
        {activeView === "day" && (
          <ModernDayView
            CustomEventModal={CustomEventModal}
            isSchedulePage={true}
          />
        )}
        {activeView === "week" && (
          <ModernWeekView
            CustomEventModal={CustomEventModal}
            isSchedulePage={true}
          />
        )}
        {activeView === "month" && (
          <ModernMonthView
            CustomEventModal={CustomEventModal}
            isSchedulePage={true}
          />
        )}
      </div>

      {/* Tips - Premium with icon */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Click any time slot to quickly add an event • Press{" "}
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono font-semibold">
            ?
          </kbd>{" "}
          for keyboard shortcuts
        </p>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <UnifiedEventModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSave={async (eventData) => {
            try {
              if (handlers?.handleAddEvent) {
                await handlers.handleAddEvent(eventData);
              } else {
                // Direct API call
                const response = await fetch("/api/events", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: 'include',
                  body: JSON.stringify({
                    ...eventData,
                    courseId: eventData?.course_id || eventData?.courseId || null,
                  }),
                });
                if (!response.ok) throw new Error("Failed to create event");
              }
              setShowCreateModal(false);
              // Notify views to refresh
              window.dispatchEvent(new CustomEvent("scheduler:eventsChanged"));
            } catch (error) {
              console.error("Failed to create event:", error);
            }
          }}
        />
      )}
    </div>
  );
}
