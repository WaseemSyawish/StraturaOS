"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
// Note: framer-motion is imported directly where needed. Avoid using next/dynamic for the whole module
// since it returns a module, not a component, which breaks TypeScript's dynamic typing expectations.
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, CalendarDaysIcon } from "@/components/icons/simple-icons";
import { Plus } from "lucide-react";
import { ModernViewSwitcher } from "./modern-controls";
import { useModal } from "@/providers/modal-context";
import { ClassNames, CustomComponents, Views } from "@/types/index";
import { cn } from "@/lib/utils";
import CustomModal from "@/components/ui/custom-modal";
// react-icons can be moderately large; import only used icons via dynamic if necessary
const BsCalendarMonth = dynamic(() => import("react-icons/bs").then((m) => m.BsCalendarMonth), { ssr: false });
const BsCalendarWeek = dynamic(() => import("react-icons/bs").then((m) => m.BsCalendarWeek), { ssr: false });

// Dynamic component imports
const DailyView = dynamic(() => import('./day/daily-view'), { ssr: false });
const MonthView = dynamic(() => import('./month/month-view'), { ssr: false });
const WeeklyView = dynamic(() => import('./week/week-view'), { ssr: false });

// Animation settings for Framer Motion (used when Motion is loaded)
const animationConfig = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, type: "spring", stiffness: 250 },
};

export default function SchedulerViewFilteration({
  views = {
    views: ["day", "week", "month"],
    mobileViews: ["day"],
  },
  stopDayEventSummary = false,
  CustomComponents,
  classNames,
  initialView,
}: {
  views?: Views;
  stopDayEventSummary?: boolean;
  CustomComponents?: CustomComponents;
  classNames?: ClassNames;
  initialView?: string;
}) {
  const { setOpen } = useModal();
  const [activeView, setActiveView] = useState<string>(initialView ?? "day");
  const [clientSide, setClientSide] = useState(false);

  // reduce console noise in dev compilations

  useEffect(() => {
    setClientSide(true);
  }, []);

  const [isMobile, setIsMobile] = useState(
    clientSide ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    if (!clientSide) return;
    setIsMobile(window.innerWidth <= 768);
    function handleResize() {
      if (window && window.innerWidth <= 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    }

    window && window.addEventListener("resize", handleResize);

    return () => window && window.removeEventListener("resize", handleResize);
  }, [clientSide]);

  function handleAddEvent(selectedDay?: number) {
    // Use full add event modal
    handleAddEventFull(selectedDay);
  }

  function handleAddEventFull(selectedDay?: number) {
    // Full add event modal for advanced options
    const startDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      selectedDay ?? new Date().getDate(),
      0,
      0,
      0,
      0
    );

    // Open the modal with the content. Import the AddEventModal dynamically
    (async () => {
      try {
        const mod = await import("../../_modals/add-event-modal");
        const anyMod: any = mod;
        const AddEventModalLazy = anyMod?.default || anyMod;
        setOpen(
          <CustomModal title="Add Event">
            <AddEventModalLazy
              CustomAddEventModal={
                CustomComponents?.CustomEventModal?.CustomAddEventModal?.CustomForm
              }
              isSchedulePage={true}
            />
          </CustomModal>
        );
      } catch (e) {
        // fallback: open a simple modal so the UI still responds
        setOpen(
          <CustomModal title="Add Event">
            <div className="p-4">Unable to load add-event form right now.</div>
          </CustomModal>
        );
        console.error("Failed to load AddEventModal dynamically", e);
      }
    })();
  }

  const viewsSelector = isMobile ? views?.mobileViews : views?.views;

  // Set initial active view
  useEffect(() => {
    if (viewsSelector?.length) {
      if (initialView && viewsSelector.includes(initialView)) {
        setActiveView(initialView);
      } else {
        setActiveView(viewsSelector[0]);
      }
    }
  }, [viewsSelector, initialView]);

  // Listen for the shimbed TabsTrigger events
  useEffect(() => {
    function onTabsChange(e: any) {
      if (!e || !e.detail) return;
      if (viewsSelector?.includes(e.detail)) setActiveView(e.detail);
    }
    window.addEventListener('tabs:change', onTabsChange as any);
    return () => window.removeEventListener('tabs:change', onTabsChange as any);
  }, [viewsSelector]);

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full">
        <div className="dayly-weekly-monthly-selection relative w-full">
          <Tabs
            value={activeView}
            onValueChange={setActiveView}
            className={cn("w-full", classNames?.tabs)}
          >
            <div className="flex justify-between items-center mb-4">
                <div>
                <ModernViewSwitcher currentView={activeView as any} onViewChange={(v: any) => setActiveView(v)} allowedViews={viewsSelector as any} />
              </div>

              {/* Action Buttons */}
              <div className="ml-auto flex items-center gap-2">
                {CustomComponents?.customButtons?.CustomAddEventButton ? (
                  <div onClick={() => handleAddEvent()}>
                    {CustomComponents?.customButtons.CustomAddEventButton}
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setActiveView("day");
                        try {
                          window.dispatchEvent(new CustomEvent('scheduler:goToDate', { detail: { date: new Date().toISOString() } }));
                        } catch (e) {}
                      }}
                      variant="outline"
                      className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Today
                    </Button>
                    <Button
                      onClick={() => handleAddEvent()}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Event
                    </Button>
                  </>
                )}
              </div>
            </div>

            {viewsSelector?.includes("day") && (
              <TabsContent value="day">
                {/* Use Motion if available; dynamic import keeps this out of initial bundle */}
                <div>
                  <DailyView
                    stopDayEventSummary={stopDayEventSummary}
                    classNames={classNames?.buttons}
                    prevButton={CustomComponents?.customButtons?.CustomPrevButton}
                    nextButton={CustomComponents?.customButtons?.CustomNextButton}
                    CustomEventComponent={CustomComponents?.CustomEventComponent}
                    CustomEventModal={CustomComponents?.CustomEventModal}
                    isSchedulePage={true}
                  />
                </div>
              </TabsContent>
            )}

            {viewsSelector?.includes("week") && (
              <TabsContent value="week">
                <div>
                  <WeeklyView
                    classNames={classNames?.buttons}
                    prevButton={CustomComponents?.customButtons?.CustomPrevButton}
                    nextButton={CustomComponents?.customButtons?.CustomNextButton}
                    CustomEventComponent={CustomComponents?.CustomEventComponent}
                    CustomEventModal={CustomComponents?.CustomEventModal}
                    isSchedulePage={true}
                  />
                </div>
              </TabsContent>
            )}

            {viewsSelector?.includes("month") && (
              <TabsContent value="month">
                <div>
                  <MonthView
                    classNames={classNames?.buttons}
                    prevButton={CustomComponents?.customButtons?.CustomPrevButton}
                    nextButton={CustomComponents?.customButtons?.CustomNextButton}
                    CustomEventComponent={CustomComponents?.CustomEventComponent}
                    CustomEventModal={CustomComponents?.CustomEventModal}
                    isSchedulePage={true}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
