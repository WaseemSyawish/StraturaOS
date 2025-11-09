"use client";

import React, { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { cn } from "@/lib/utils";
import { parseDatePreserveLocal } from '@/lib/dateHelpers';

import { useScheduler } from "@/providers/schedular-provider";
import { useModal } from "@/providers/modal-context";
import AddEventModal from "@/components/schedule/_modals/add-event-modal";
import ShowMoreEventsModal from "@/components/schedule/_modals/show-more-events-modal";
import EventStyled from "../event-component/event-styled";
import { Event, CustomEventModal } from "@/types";
import CustomModal from "@/components/ui/custom-modal";

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
      opacity: { duration: 0.2, ease: "easeInOut" },
    },
  }),
};

export default function MonthView({
  prevButton,
  nextButton,
  CustomEventComponent,
  CustomEventModal,
  classNames,
}: {
  prevButton?: React.ReactNode;
  nextButton?: React.ReactNode;
  CustomEventComponent?: React.FC<Event>;
  CustomEventModal?: CustomEventModal;
  classNames?: { prev?: string; next?: string; addEvent?: string };
}) {
  const { getters, weekStartsOn } = useScheduler();
  const { setOpen } = useModal();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState<number>(0);

  const daysInMonth = getters.getDaysInMonth(
    currentDate.getMonth(),
    currentDate.getFullYear()
  );

  const handlePrevMonth = useCallback(() => {
    setDirection(-1);
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    setCurrentDate(newDate);
  }, [currentDate]);

  const handleNextMonth = useCallback(() => {
    setDirection(1);
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    setCurrentDate(newDate);
  }, [currentDate]);

  function handleAddEvent(selectedDay: number) {
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDay,
      0,
      0,
      0
    );

    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDay,
      23,
      59,
      59
    );

    setOpen(
      <CustomModal title="Add Event">
        <AddEventModal
          CustomAddEventModal={
            CustomEventModal?.CustomAddEventModal?.CustomForm
          }
        />
      </CustomModal>,
      async () => {
        return {
          startDate,
          endDate,
          title: "",
          id: "",
          variant: "primary",
        };
      }
    );
  }

  function handleShowMoreEvents(dayEvents: Event[]) {
    const title = dayEvents && dayEvents[0]
      ? ((parseDatePreserveLocal(dayEvents[0].startDate) || new Date(String(dayEvents[0].startDate))).toDateString())
      : "";

    setOpen(
      <CustomModal title={title}>
        <ShowMoreEventsModal />
      </CustomModal>,
      async () => {
        return {
          dayEvents,
        };
      }
    );
  }

  const daysOfWeek =
    weekStartsOn === "monday"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  const startOffset =
    (firstDayOfMonth.getDay() - (weekStartsOn === "monday" ? 1 : 0) + 7) % 7;

  const prevMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    1
  );
  const lastDateOfPrevMonth = new Date(
    prevMonth.getFullYear(),
    prevMonth.getMonth() + 1,
    0
  ).getDate();

  return (
    <div className="bg-default-50 dark:bg-slate-900 -mx-6 p-6 rounded-b-lg">
      <div className="flex flex-col mb-4 pt-2 max-w-[1200px] mx-auto">
        <h2 className="text-3xl my-3 tracking-tighter font-bold text-slate-900 dark:text-white">
          {currentDate.toLocaleString("default", { month: "long" })}{" "}
          {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-3">
          {prevButton ? (
            <div onClick={handlePrevMonth}>{prevButton}</div>
          ) : (
            <Button
              variant="outline"
              className={cn(classNames?.prev, 'text-slate-900')}
              onClick={handlePrevMonth}
            >
              <ArrowLeft />
              Prev
            </Button>
          )}
          {nextButton ? (
            <div onClick={handleNextMonth}>{nextButton}</div>
          ) : (
            <Button
              variant="outline"
              className={cn(classNames?.next, 'text-slate-900')}
              onClick={handleNextMonth}
            >
              Next
              <ArrowRight />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentDate.toISOString()}
          custom={direction}
          variants={pageTransitionVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ opacity: { duration: 0.2 } }}
        >
          <div className="grid grid-cols-7 gap-2 sm:gap-3 mt-6 max-w-[1500px] mx-auto">
            {daysOfWeek.map((day, idx) => (
              <div
                key={idx}
                className="text-left py-6 text-2xl tracking-tighter font-medium text-black dark:text-white"
              >
                {day}
              </div>
            ))}

            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`offset-${idx}`} className="h-[150px] opacity-50">
                <div className="font-semibold relative text-2xl mb-1">
                  {lastDateOfPrevMonth - startOffset + idx + 1}
                </div>
              </div>
            ))}

            {daysInMonth.map((dayObj) => {
              const dayEvents = getters.getEventsForDay(dayObj.day, currentDate);
              const isToday =
                new Date().getDate() === dayObj.day &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={dayObj.day}
                  // If the day already has events, click should show the details (show more)
                  // otherwise open the add-event modal. This prevents accidental create modal when
                  // interacting with existing events or the +N badge.
                  onClick={() => (dayEvents && dayEvents.length > 0) ? handleShowMoreEvents(dayEvents) : handleAddEvent(dayObj.day)}
                  className="w-full"
                >
                  <div className="hover:z-50 border-none h-[150px] rounded group flex flex-col transition-transform duration-200 hover:scale-[1.02]">
                    <Card className="shadow-sm cursor-pointer overflow-hidden relative flex flex-col justify-between p-3 border h-full rounded-lg bg-background dark:bg-slate-800 dark:border-slate-700 transition-shadow duration-200 hover:shadow-md">
                      <div
                        className={clsx(
                          "font-semibold relative text-2xl transition-colors duration-200 inline-block",
                          dayEvents.length > 0
                            ? "text-primary-600 dark:text-primary-400"  // Add dark mode color
                            : "text-black dark:text-muted-foreground",
                          isToday && "bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded-full px-2 py-1"
                        )}
                        style={{ marginBottom: 6 }}
                      >
                        {dayObj.day}
                      </div>

                      <div className="flex-grow flex flex-col justify-center items-center gap-1 w-full mt-0">
                        <div className="flex-1" />
                        {dayEvents?.length > 0 && (
                          <div
                            className="w-full max-w-[90%] mt-0"
                            style={{ marginBottom: 6 }}
                          >
                            <div className="flex justify-center">
                              <EventStyled
                                event={{
                                  ...dayEvents[0],
                                  CustomEventComponent,
                                  minmized: true,
                                }}
                                CustomEventModal={CustomEventModal}
                              />
                            </div>
                          </div>
                        )}
                        {dayEvents.length > 1 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowMoreEvents(dayEvents);
                            }}
                            className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-gradient-to-br from-indigo-500/90 to-purple-500/90 dark:from-indigo-600/90 dark:to-purple-600/90 backdrop-blur-sm border border-indigo-400/50 dark:border-indigo-500/50 text-white text-xs font-bold cursor-pointer hover:from-indigo-600 hover:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-xl"
                            title={`View all ${dayEvents.length} events`}
                          >
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                              {dayEvents.length - 1}
                            </span>
                          </div>
                        )}
                        <div style={{ height: 6 }} />
                      </div>

                      {dayEvents.length === 0 && (
                        <div className="absolute inset-0 bg-black/4 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none rounded-lg">
                          <span className="text-black/70 dark:text-white/80 tracking-tighter text-lg font-semibold">
                            Add Event
                          </span>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}