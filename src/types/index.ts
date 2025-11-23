import { Dispatch, SVGProps } from "react";
import { z } from "zod";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// SchedulerTypes.ts

const PRIORITY_VALUES = [
  "low",
  "medium",
  "high",
  "urgent-important",
  "not-urgent-important",
  "urgent-not-important",
  "not-urgent-not-important",
] as const;

export type PriorityValue = (typeof PRIORITY_VALUES)[number];

export interface Event {
  id: string;
  title: string;
  startDate: string | Date;
  endDate: string | Date;
  type?: string;
  description?: string;
  location?: string;
  room?: string; // legacy field
  instructor?: string; // Instructor/professor name for classes
  color?: string;
  colorKey?: string;
  color_key?: string;
  variant?: string;
  completed?: boolean;
  archived?: boolean;
  course_id?: string | null;
  courseId?: string | null;
  user_id?: string;
  userId?: string;
  date?: string | Date;
  time?: string;
  end_date?: string | Date;
  
  // Reminder system
  reminders?: string[]; // Array of reminder times: ['1week', '2days', '1day', '1hour', 'morning']
  remindersFired?: string[]; // Track which reminders have already been shown
  customReminders?: Array<{id: string, datetime: string, label?: string}>; // Custom flexible reminders
  
  // Eisenhower Matrix priority system
  urgent?: boolean; // Is this task urgent?
  important?: boolean; // Is this task important?
  // Derived quadrants: Q1 (urgent+important), Q2 (important only), Q3 (urgent only), Q4 (neither)
  
  // Legacy priority (deprecated in favor of Eisenhower Matrix)
  priority?: PriorityValue;
  
  // Recurring event fields
  template_id?: string | null;
  templateId?: string | null;
  
  // Raw data storage (may contain additional fields)
  raw?: {
    template_id?: string;
    templateId?: string;
    color?: string;
    color_key?: string;
    colorKey?: string;
    [key: string]: any;
  };
  
  // Relations
  courses?: any;
  
  // Timestamps
  created_at?: string | Date;
  updated_at?: string | Date;
  
  // Allow additional properties
  [key: string]: any;
}

// Define the state interface for the scheduler
export interface SchedulerState {
  events: Event[];
}

// Define actions for reducer
export type Action =
  | { type: "ADD_EVENT"; payload: Event }
  | { type: "REMOVE_EVENT"; payload: { id: string } }
  | { type: "UPDATE_EVENT"; payload: Event }
  | { type: "SET_EVENTS"; payload: Event[] };


  

// Define handlers interface
export interface Handlers {
  handleEventStyling: (
    event: Event,
    dayEvents: Event[],
    periodOptions?: { 
      eventsInSamePeriod?: number; 
      periodIndex?: number; 
      adjustForPeriod?: boolean;
    }
  ) => {
    height: string;
    left: string;
    maxWidth: string;
    minWidth: string;
    top: string;
    zIndex: number;
  };
  handleAddEvent: (event: Event) => void;
  handleUpdateEvent: (event: Event, id: string, scope?: string) => void;
  // (Deprecated) handleUpdateEventScoped removed; use handleUpdateEvent with optional scope
  // local-only helpers: update provider state without performing network persistence
  handleLocalAddEvent?: (event: Event) => void;
  handleLocalUpdateEvent?: (event: Event) => void;
  // Accept optional scope (e.g. 'single' | 'all') — may be async when performing network operations
  handleDeleteEvent: (id: string, scope?: string) => Promise<any> | void;
}

// Define getters interface
export interface Getters {
  getDaysInMonth: (
    month: number,
    year: number
  ) => { day: number; events: Event[] }[];
  getEventsForDay: (day: number, currentDate: Date) => Event[];
  getDaysInWeek: (week: number, year: number) => Date[];
  getWeekNumber: (date: Date) => number;
  getDayName: (day: number) => string;
}

// Define the context value interface
export interface SchedulerContextType {
  events: SchedulerState;
  dispatch: Dispatch<Action>;
  getters: Getters;
  handlers: Handlers;
  weekStartsOn: startOfWeek;
  // Recurrence options provided by pages (optional)
  recurrenceOptions?: Array<{
    id: string;
    label: string;
    rruleTemplate?: string | null;
    [key: string]: any;
  }>;
}

// Define the variant options
export const variants = [
  "success",
  "primary",
  "default",
  "warning",
  "danger",
] as const;

export type Variant = (typeof variants)[number];

// Define Zod schema for form validation
export const eventSchema = z.object({
  title: z.string().nonempty("Event name is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.date().optional(), // Optional for tasks in inbox
  endDate: z.date().optional(),   // Optional for tasks in inbox
  startTime: z.string().optional(), // For schedule page simplified view
  endTime: z.string().optional(),   // For schedule page simplified view
  variant: z.enum(["primary", "danger", "success", "warning", "default"]),
  color: z.string().nonempty("Color selection is required"),
  type: z.string().optional(),
  reminders: z.array(z.string()).optional(), // ['1week', '2days', '1day', '1hour', 'morning']
  priority: z.enum(PRIORITY_VALUES).optional(), // Priority level
});

export type EventFormData = z.infer<typeof eventSchema>;

export type Views = {
  mobileViews?: string[];
  views?: string[];
};

export type startOfWeek = "sunday" | "monday";

export interface CustomEventModal {
  CustomAddEventModal?: {
    title?: string;
    CustomForm?: React.FC<{ register: any; errors: any }>;
  };
}

export interface CustomComponents {
  customButtons?: {
    CustomAddEventButton?: React.ReactNode;
    CustomPrevButton?: React.ReactNode;
    CustomNextButton?: React.ReactNode;
  };

  customTabs?: {
    CustomDayTab?: React.ReactNode;
    CustomWeekTab?: React.ReactNode;
    CustomMonthTab?: React.ReactNode;
  };
  CustomEventComponent?: React.FC<Event>; // Using custom event type
  CustomEventModal?: CustomEventModal;
}

export interface ButtonClassNames {
  prev?: string;
  next?: string;
  addEvent?: string;
}

export interface TabClassNames {
  view?: string;
}

export interface TabsClassNames {
  cursor?: string;
  panel?: string;
  tab?: string;
  tabContent?: string;
  tabList?: string;
  wrapper?: string;
}

export interface ViewClassNames {
  dayView?: string;
  weekView?: string;
  monthView?: string;
}

export interface ClassNames {
  event?: string;
  buttons?: ButtonClassNames;
  tabs?: TabsClassNames;
  views?: ViewClassNames;
}
