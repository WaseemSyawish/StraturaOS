import React, { useRef, useState, useEffect, useCallback } from "react";
import { useScheduler } from "@/providers/schedular-provider";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion, HTMLMotionProps } from "framer-motion";
import { useModal } from "@/providers/modal-context";
import AddEventModal from "@/components/schedule/_modals/add-event-modal";
import ShowMoreEventsModal from "@/components/schedule/_modals/show-more-events-modal";
import EventStyled from "../event-component/event-styled";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Maximize2, ChevronLeft, Maximize } from "lucide-react";
import clsx from "clsx";
import { cn } from "@/lib/utils";
import { parseDatePreserveLocal } from '@/lib/dateHelpers';
import { Event, CustomEventModal } from "@/types";
import CustomModal from "@/components/ui/custom-modal";

const MotionDiv = motion.div as unknown as React.ComponentType<
  HTMLMotionProps<"div"> & { className?: string }
>;

const hours = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return `${hour}:00 ${ampm}`;
});

const pageTransitionVariants = {
  enter: (direction: number) => ({
    opacity: 0,
  }),
  center: {
    opacity: 1,
  },
  exit: (direction: number) => ({
    opacity: 0,
    transition: {
      opacity: { duration: 0.2 },
    },
  }),
};

export default function WeeklyView({
  prevButton,
  nextButton,
  CustomEventComponent,
  CustomEventModal,
  classNames,
  isSchedulePage,
}: {
  prevButton?: React.ReactNode;
  nextButton?: React.ReactNode;
  CustomEventComponent?: React.FC<Event>;
  CustomEventModal?: CustomEventModal;
  classNames?: { prev?: string; next?: string; addEvent?: string };
  isSchedulePage?: boolean;
}) {
  const { getters, handlers } = useScheduler();
  const hoursColumnRef = useRef<HTMLDivElement>(null);
  const [detailedHour, setDetailedHour] = useState<string | null>(null);
  const [timelinePosition, setTimelinePosition] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [direction, setDirection] = useState<number>(0);
  const { setOpen } = useModal();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);

  const daysOfWeek = getters?.getDaysInWeek(
    getters?.getWeekNumber(currentDate),
    currentDate.getFullYear()
  );

  // Update current time every minute for live indicator
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Calculate position based on current time
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      const ROW_PX_PER_HOUR = 64;
      const position = (totalMinutes / 60) * ROW_PX_PER_HOUR;
      setCurrentTimePosition(position);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Check if current time is in the displayed week
  const isCurrentWeek = React.useMemo(() => {
    const now = new Date();
    const weekStart = daysOfWeek[0];
    const weekEnd = new Date(daysOfWeek[6]);
    weekEnd.setHours(23, 59, 59, 999);
    return now >= weekStart && now <= weekEnd;
  }, [daysOfWeek]);

  const currentDayIndex = React.useMemo(() => {
    if (!isCurrentWeek) return -1;
    const now = new Date();
    return daysOfWeek.findIndex(day => 
      day.getDate() === now.getDate() && 
      day.getMonth() === now.getMonth() &&
      day.getFullYear() === now.getFullYear()
    );
  }, [isCurrentWeek, daysOfWeek]);

  const rAFRef = useRef<number | null>(null);
  const lastMouseEventRef = useRef<MouseEvent | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!hoursColumnRef.current) return;
    lastMouseEventRef.current = e.nativeEvent;

    if (rAFRef.current == null) {
      rAFRef.current = requestAnimationFrame(() => {
        try {
          const ev = lastMouseEventRef.current;
          if (!ev || !hoursColumnRef.current) return;
          const rect = hoursColumnRef.current.getBoundingClientRect();
          const y = ev.clientY - rect.top;
          const hourHeight = rect.height / 24;
          const hour = Math.max(0, Math.min(23, Math.floor(y / hourHeight)));
          const minuteFraction = (y % hourHeight) / hourHeight;
          const minutes = Math.floor(minuteFraction * 60);

          const hour12 = hour % 12 || 12;
          const ampm = hour < 12 ? "AM" : "PM";
          setDetailedHour(`${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`);

          const position = Math.max(0, Math.min(rect.height, Math.round(y)));
          setTimelinePosition(position);
        } finally {
          if (rAFRef.current != null) { cancelAnimationFrame(rAFRef.current); rAFRef.current = null; }
        }
      });
    }
  }, []);

  React.useEffect(() => {
    return () => { if (rAFRef.current != null) { cancelAnimationFrame(rAFRef.current); rAFRef.current = null; } };
  }, []);

  function handleAddEvent(event?: Event) {
    const startDate = event?.startDate || new Date();
    const endDate = event?.endDate || new Date();

    setOpen(
      <CustomModal title="Add Event">
        <AddEventModal
          CustomAddEventModal={
            CustomEventModal?.CustomAddEventModal?.CustomForm
          }
          isSchedulePage={isSchedulePage}
        />
      </CustomModal>,
      async () => {
        return {
          ...event,
          startDate,
          endDate,
        };
      }
    );
  }

  const handleNextWeek = useCallback(() => {
    setDirection(1);
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(currentDate.getDate() + 7);
    setCurrentDate(nextWeek);
  }, [currentDate]);

  const handlePrevWeek = useCallback(() => {
    setDirection(-1);
    const prevWeek = new Date(currentDate);
    prevWeek.setDate(currentDate.getDate() - 7);
    setCurrentDate(prevWeek);
  }, [currentDate]);

  function handleAddEventWeek(dayIndex: number, detailedHour: string) {
    if (!detailedHour) {
      console.error("Detailed hour not provided.");
      return;
    }

    const [timePart, ampm] = detailedHour.split(" ");
    const [hourStr, minuteStr] = timePart.split(":");
    let hours = parseInt(hourStr);
    const minutes = parseInt(minuteStr);
    
    if (ampm === "PM" && hours < 12) {
      hours += 12;
    } else if (ampm === "AM" && hours === 12) {
      hours = 0;
    }

    const chosenDay = daysOfWeek[dayIndex % 7].getDate();

    if (chosenDay < 1 || chosenDay > 31) {
      console.error("Invalid day selected:", chosenDay);
      return;
    }

    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      chosenDay,
      hours,
      minutes
    );

    // Use full add event modal with pre-filled date/time
    setOpen(
      <CustomModal title="Add Event">
        <AddEventModal
          isSchedulePage={isSchedulePage}
        />
      </CustomModal>
    );
  }

  const computeMinaStyle = React.useCallback((event: Event, allDayEvents: Event[] | undefined) => {
    const ROW_PX_PER_HOUR = 64;
    const ensureDate = (d: any) => (d instanceof Date ? d : (parseDatePreserveLocal(d) || new Date(String(d))));

    const thisStart = ensureDate(event.startDate);
    const thisEnd = ensureDate(event.endDate);
    const thisStartMin = thisStart.getHours() * 60 + thisStart.getMinutes();
    const thisEndMin = thisEnd.getHours() * 60 + thisEnd.getMinutes();
    const thisDuration = Math.max(1, thisEndMin - thisStartMin);

    const rawTop = (thisStartMin / 60) * ROW_PX_PER_HOUR;
    const rawHeight = (thisDuration / 60) * ROW_PX_PER_HOUR;
    const topPx = Math.max(0, Math.floor(rawTop));
    const heightPx = Math.max(20, Math.ceil(rawHeight) + 1);

    // Separate tasks from timed events
    const isTask = (ev: any) => ev.type === 'task' || ev.type === 'assignment' || ev.type === 'deadline';
    
    // Handle tasks differently - show as compact pills on the right side
    if (isTask(event)) {
      return {
        height: '24px',
        top: `${topPx}px`,
        zIndex: 100,
        left: '78%',
        width: '20%',
      };
    }

    // For regular events, find truly concurrent events (same time slot)
    const items = (allDayEvents || [])
      .filter((ev) => ev && ev.startDate && ev.endDate && !isTask(ev))
      .map((ev) => {
        const s = ensureDate(ev.startDate);
        const e = ensureDate(ev.endDate);
        const startMinutes = s.getHours() * 60 + s.getMinutes();
        const endMinutes = e.getHours() * 60 + e.getMinutes();
        const duration = Math.max(1, endMinutes - startMinutes);
        return { ev, startMinutes, endMinutes, duration };
      })
      .sort((a, b) => a.startMinutes - b.startMinutes || b.duration - a.duration);

    // Build columns for truly overlapping events
    const columns: Array<Array<any>> = [];
    items.forEach((it) => {
      let placed = false;
      for (let ci = 0; ci < columns.length; ci++) {
        const col = columns[ci];
        const last = col[col.length - 1];
        // Only place in existing column if times don't overlap
        if (it.startMinutes >= last.endMinutes) {
          col.push(it);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([it]);
      }
    });

    // Find which column this event belongs to
    let colIndex = 0;
    for (let ci = 0; ci < columns.length; ci++) {
      const idx = columns[ci].findIndex((it) => it.ev.id === event.id);
      if (idx !== -1) {
        colIndex = ci;
        break;
      }
    }

    // The actual number of columns is just the columns array length (max concurrent events)
    const totalCols = Math.min(2, columns.length); // Max 2 columns side-by-side
    const actualColIndex = Math.min(colIndex, totalCols - 1);

    if (totalCols === 1) {
      // No overlap - full width
      return {
        height: `${heightPx}px`,
        top: `${topPx}px`,
        zIndex: 1,
        left: '0%',
        width: '98%',
      };
    }

    // For 2 overlapping events - clean side-by-side with good width
    if (totalCols === 2) {
      const width = '48.5%'; // 48.5% each = 97% total with 1% gap
      const leftPos = actualColIndex === 0 ? '0%' : '49.5%';
      return {
        height: `${heightPx}px`,
        top: `${topPx}px`,
        zIndex: actualColIndex + 1,
        left: leftPos,
        width: width,
      };
    }

    // For 3+ overlaps (fallback, but max is 2)
    const widthPercent = Math.max(48, (98 / totalCols) - 1);
    const leftPercent = actualColIndex * (98 / totalCols);
    
    return {
      height: `${heightPx}px`,
      top: `${topPx}px`,
      zIndex: actualColIndex + 1,
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  }, []);

  return (
    <div className="bg-gray-50/50 dark:bg-slate-900/50 rounded-xl p-2 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Week {getters.getWeekNumber(currentDate)}
        </h1>

        <div className="flex ml-0 sm:ml-auto gap-2">
          {prevButton ? (
            <div onClick={handlePrevWeek}>{prevButton}</div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                classNames?.prev,
                'text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-500 transition-all duration-200 shadow-sm px-2 sm:px-4'
              )}
              onClick={handlePrevWeek}
            >
              <ArrowLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Prev</span>
            </Button>
          )}
          {nextButton ? (
            <div onClick={handleNextWeek}>{nextButton}</div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                classNames?.next,
                'text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-500 transition-all duration-200 shadow-sm px-2 sm:px-4'
              )}
              onClick={handleNextWeek}
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="w-4 h-4 sm:ml-1" />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false} custom={direction} mode="wait">
        <MotionDiv
          key={currentDate.toISOString()}
          custom={direction}
          variants={pageTransitionVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ opacity: { duration: 0.2 } }}
          className="relative rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md overflow-x-auto"
        >
          <div className="flex min-w-[700px]">
            {/* Hours Column */}
            <div className="flex flex-col bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 sticky left-0 z-10">
              <div className="h-[60px] sm:h-[80px] px-2 sm:px-3 py-2 border-b border-gray-200 dark:border-slate-700"></div>
              {hours.map((hour, index) => (
                <div
                  key={`hour-${index}`}
                  className="px-1 sm:px-3 py-2 h-[48px] sm:h-[64px] flex items-center text-left text-[10px] sm:text-xs font-medium text-gray-600 dark:text-slate-400"
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="flex-grow">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                {daysOfWeek.map((day, idx) => {
                  const isToday =
                    new Date().getDate() === day.getDate() &&
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear();
                  
                  const dayEvents = getters.getEventsForDay(day.getDate(), currentDate);
                  const eventCount = dayEvents?.filter((e: any) => !e.isDateOnly)?.length || 0;

                  const handleDayHeaderClick = () => {
                    const selectedDay = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day.getDate()
                    );
                    const dateTitle = selectedDay.toDateString();
                    
                    // Show events modal (same as month view behavior)
                    setOpen(
                      <CustomModal title={dateTitle}>
                        <ShowMoreEventsModal />
                      </CustomModal>,
                      async () => ({
                        dayEvents,
                      })
                    );
                  };

                  return (
                    <div
                      key={idx}
                      onClick={handleDayHeaderClick}
                      className="relative group h-[60px] sm:h-[80px] flex flex-col items-center justify-center border-r border-gray-200 dark:border-slate-700 last:border-r-0 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors min-w-[80px] cursor-pointer"
                    >
                      <div className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                        {getters.getDayName(day.getDay()).slice(0, 3)}
                      </div>
                      <div
                        className={cn(
                          "text-lg sm:text-2xl font-bold mt-1",
                          isToday
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-gray-900 dark:text-white"
                        )}
                      >
                        {day.getDate()}
                      </div>

                      {/* Event count indicator */}
                      {eventCount > 0 && (
                        <div
                          className="absolute top-1 right-1 transition-all hover:scale-125"
                        >
                          <div className="text-[10px] font-medium text-purple-600 dark:text-purple-400 hover:underline">
                            {eventCount} {eventCount === 1 ? 'event' : 'events'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div
                ref={hoursColumnRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setDetailedHour(null)}
                className="relative grid grid-cols-7"
              >
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayEvents = getters.getEventsForDay(
                    daysOfWeek[dayIndex % 7].getDate(),
                    currentDate
                  );

                  return (
                    <div
                      key={`day-${dayIndex}`}
                      className="relative border-r border-gray-200 dark:border-slate-700 last:border-r-0 bg-white dark:bg-slate-800 min-w-[80px]"
                    >
                      {/* Hour cells */}
                      {Array.from({ length: 24 }, (_, hourIndex) => (
                        <div
                          key={`day-${dayIndex}-hour-${hourIndex}`}
                          onClick={() => handleAddEventWeek(dayIndex, detailedHour as string)}
                          className={cn(
                            "h-[48px] sm:h-[64px] border-b transition duration-200 cursor-pointer relative",
                            "border-gray-100 dark:border-slate-700/50",
                            "hover:bg-purple-50 dark:hover:bg-purple-900/10"
                          )}
                        >
                          <div className="absolute bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 opacity-0 transition left-0 top-0 duration-250 hover:opacity-100 w-full h-full pointer-events-none">
                            + Add
                          </div>
                        </div>
                      ))}

                      {/* Events - FIXED RENDERING */}
                      <div className="absolute inset-0 pointer-events-none">
                        <AnimatePresence initial={false}>
                          {dayEvents?.filter((e: any) => !e.isDateOnly).map((event) => {
                            const timedEvents = dayEvents.filter((e: any) => !e.isDateOnly);
                            const style = computeMinaStyle(event, timedEvents);
                            const manyEvents = (dayEvents?.length || 0) > 30;

                            const eventElement = (
                              <div
                                style={{
                                  position: 'absolute',
                                  height: style.height,
                                  top: style.top,
                                  left: style.left,
                                  width: style.width,
                                  zIndex: style.zIndex,
                                  pointerEvents: 'auto',
                                  paddingLeft: '2px',
                                  paddingRight: '2px',
                                }}
                              >
                                <EventStyled
                                  event={{
                                    ...event,
                                    CustomEventComponent,
                                    minmized: true,
                                  }}
                                  CustomEventModal={CustomEventModal}
                                />
                              </div>
                            );

                            if (manyEvents) {
                              return <React.Fragment key={event.id}>{eventElement}</React.Fragment>;
                            }

                            return (
                              <MotionDiv
                                key={event.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                style={{ position: 'relative' }}
                              >
                                {eventElement}
                              </MotionDiv>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current Time Indicator - Live */}
          {isCurrentWeek && (
            <div
              className="absolute left-[60px] w-[calc(100%-60px)] h-[2px] bg-red-500 dark:bg-red-400 pointer-events-none z-50 transition-all duration-1000"
              style={{ top: `${currentTimePosition + 80}px` }}
            >
              <div className="absolute left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full shadow-lg" />
              <Badge
                variant="outline"
                className="absolute -translate-y-1/2 bg-white dark:bg-slate-800 border-red-400 dark:border-red-500 text-red-600 dark:text-red-400 font-semibold z-50 left-[-55px] text-xs shadow-md"
              >
                {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </Badge>
            </div>
          )}

          {/* Hover Timeline indicator */}
          {detailedHour && (
            <div
              className="absolute left-[60px] w-[calc(100%-60px)] h-[2px] bg-purple-500 dark:bg-purple-400 rounded-full pointer-events-none z-40 shadow-sm"
              style={{ top: `${timelinePosition + 80}px` }}
            >
              <Badge
                variant="outline"
                className="absolute -translate-y-1/2 bg-white dark:bg-slate-800 border-purple-400 dark:border-purple-500 text-purple-700 dark:text-purple-300 font-medium z-50 left-[-55px] text-xs shadow-md"
              >
                {detailedHour}
              </Badge>
            </div>
          )}
        </MotionDiv>
      </AnimatePresence>
    </div>
  );
}