import EventStyled from "@/components/schedule/_components/view/event-component/event-styled";
import { useModal } from "@/providers/modal-context";
import { useToast } from "@/providers/toast-provider";
import { Event } from "@/types";
import React, { useEffect, useState } from "react";
import { X, Clock, MapPin, Edit, Trash2, Plus, Sparkles, BookOpen, AlertTriangle, FileText, Target, Beaker, GraduationCap, Calendar } from "lucide-react";
import CustomModal from "@/components/ui/custom-modal";
import AddEventModal from "@/components/schedule/_modals/add-event-modal";
import EditScopeModal from "@/components/Timetable/EditScopeModal";
import { useScheduler } from "@/providers/schedular-provider";

function getEventColor(variant: string, eventType?: string) {
  // First check by event type
  const typeColors: Record<string, string> = {
    exam: '#ef4444',      // red
    quiz: '#f97316',      // orange
    assignment: '#3b82f6', // blue
    project: '#8b5cf6',   // purple
    class: '#10b981',     // green
    lecture: '#10b981',   // green
    lab: '#06b6d4',       // cyan
    tutorial: '#14b8a6',  // teal
    study: '#22c55e',     // green
    deadline: '#ef4444',  // red
    meeting: '#6366f1',   // indigo
  };
  
  if (eventType && typeColors[eventType.toLowerCase()]) {
    return typeColors[eventType.toLowerCase()];
  }
  
  // Fall back to variant colors
  const colors: Record<string, string> = {
    primary: '#8b5cf6',   // purple
    success: '#10b981',   // green
    danger: '#ef4444',    // red
    warning: '#f59e0b',   // amber
    info: '#3b82f6',      // blue
  };
  return colors[variant] || colors.primary;
}

function getTypeIcon(type?: string) {
  const typeIcons: Record<string, any> = {
    exam: AlertTriangle,
    quiz: Beaker,
    assignment: FileText,
    project: Target,
    class: GraduationCap,
    lecture: GraduationCap,
    lab: Beaker,
    study: BookOpen,
    deadline: AlertTriangle,
    meeting: Calendar,
  };
  return typeIcons[type?.toLowerCase() || ''] || Calendar;
}

function getTypeBgColor(type?: string) {
  const typeBgColors: Record<string, string> = {
    exam: 'bg-red-100 dark:bg-red-900/30',
    quiz: 'bg-orange-100 dark:bg-orange-900/30',
    assignment: 'bg-blue-100 dark:bg-blue-900/30',
    project: 'bg-purple-100 dark:bg-purple-900/30',
    class: 'bg-emerald-100 dark:bg-emerald-900/30',
    lecture: 'bg-emerald-100 dark:bg-emerald-900/30',
    lab: 'bg-cyan-100 dark:bg-cyan-900/30',
    study: 'bg-green-100 dark:bg-green-900/30',
    deadline: 'bg-red-100 dark:bg-red-900/30',
    meeting: 'bg-indigo-100 dark:bg-indigo-900/30',
  };
  return typeBgColors[type?.toLowerCase() || ''] || 'bg-slate-100 dark:bg-slate-800';
}

export default function ShowMoreEventsModal() {
  const { data } = useModal();
  const dayEvents = data?.default?.dayEvents || [];

  const [events, setEvents] = useState<Event[]>(dayEvents);
  const { showToast } = useToast();

  useEffect(() => {
    setEvents(dayEvents);
  }, [dayEvents]);

  const { setClose, setOpen } = useModal();
  const scheduler = useScheduler();

  const [showDeleteScope, setShowDeleteScope] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

  const handleClose = () => setClose();

  const handleEdit = (ev: Event) => {
    try {
      setOpen(
        <CustomModal title={ev.title || 'Edit event'}>
          <AddEventModal />
        </CustomModal>,
        async () => ({ default: ev })
      );
      // close this modal after opening edit modal
      setClose();
    } catch (e) {
      console.error('Failed to open edit modal', e);
    }
  };

  const handleAddEvent = (date?: string | Date) => {
    try {
      const start = date ? new Date(date as any) : (events[0] ? new Date(events[0].startDate || events[0].date) : new Date());
      const startDateIso = start.toISOString();
      setOpen(
        <CustomModal title="Add Event">
          <AddEventModal />
        </CustomModal>,
        async () => ({ default: { startDate: startDateIso, endDate: startDateIso } })
      );
      setClose();
    } catch (e) {
      console.error('Failed to open add event modal', e);
    }
  };

  const handleDelete = async (id?: string, ev?: Event) => {
    if (!id) return;

    // Store event data for undo
    const eventToDelete = ev || events.find(x => x.id === id);
    if (!eventToDelete) return;

    // determine if event is a recurring series similar to EventStyled logic
    let isSeries = false;
    try {
      const evAny: any = eventToDelete;
      const tplId = evAny && (evAny.raw && (evAny.raw.template_id || evAny.raw.templateId)) || evAny.template_id || evAny.templateId || null;
      isSeries = !!(evAny && (evAny.recurrence || evAny.repeatOption || tplId));

      if (!isSeries && id) {
        try {
          const resp = await fetch(`/api/events/${encodeURIComponent(id)}`);
          if (resp.ok) {
            const payload = await resp.json().catch(() => null);
            const serverEv = payload?.event || payload || null;
            const serverTpl = serverEv && (serverEv.template_id || (serverEv.raw && (serverEv.raw.template_id || serverEv.raw.templateId)) || serverEv.templateId) || null;
            isSeries = !!(serverEv && (serverEv.recurrence || serverEv.repeatOption || serverTpl));
          }
        } catch (e) {
          // ignore network fetch failure and fallback to local decision
        }
      }
    } catch (e) {
      console.warn('Error while detecting series', e);
    }

    // If not series -> perform single delete with undo
    if (!isSeries) {
      try {
        const sched = (typeof window !== 'undefined' && (window as any).__schedulerHandlers) || (scheduler?.handlers || null);
        
        // Perform delete
        if (sched && typeof sched.handleDeleteEvent === 'function') {
          await sched.handleDeleteEvent(id);
        } else {
          await fetch(`/api/events/${encodeURIComponent(id)}`, { method: 'DELETE' });
        }
        
        // Update UI
        setEvents(prev => prev.filter(ev => ev.id !== id));
        
        // Show undo toast
        showToast(
          `Deleted "${eventToDelete.title}"`,
          'undo',
          {
            duration: 8000,
            onUndo: async () => {
              try {
                // Recreate the event
                const response = await fetch('/api/events', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(eventToDelete),
                });
                
                if (response.ok) {
                  const result = await response.json();
                  const restoredEvent = result?.event || result;
                  
                  // Update local state
                  setEvents(prev => [...prev, restoredEvent]);
                  
                  // Notify scheduler if available
                  if (sched && typeof sched.handleLocalAddEvent === 'function') {
                    sched.handleLocalAddEvent(restoredEvent);
                  }
                  
                  showToast('Event restored successfully', 'success', { duration: 3000 });
                } else {
                  showToast('Failed to restore event', 'error', { duration: 4000 });
                }
              } catch (error) {
                console.error('Undo failed:', error);
                showToast('Failed to restore event', 'error', { duration: 4000 });
              }
            }
          }
        );
        
        // close modal to avoid leaving stale list
        setClose();
      } catch (e) {
        console.warn('Delete failed', e);
        showToast('Failed to delete event', 'error', { duration: 4000 });
      }
      return;
    }

    // For recurring series, open EditScopeModal inside this modal
    setDeleteTarget(eventToDelete);
    setShowDeleteScope(true);
  };

  return (
    <div className="-mx-6 -mb-6">
      {/* Events List */}
      <div className="max-h-[60vh] overflow-y-auto">
        {events.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {events.map((event, idx) => {
              const eventType = (event as any).type || '';
              const eventColor = getEventColor((event as any).variant || 'primary', eventType);
              const TypeIcon = getTypeIcon(eventType);
              const typeBgColor = getTypeBgColor(eventType);
              const courseName = (event as any).courses?.name || (event as any).course || '';
              const courseCode = (event as any).courses?.code || '';
              
              return (
                <div
                  key={event.id || idx}
                  className="group relative hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors cursor-pointer"
                  onClick={() => handleEdit(event)}
                >
                  <div className="flex items-stretch">
                    {/* Color bar */}
                    <div 
                      className="w-1 flex-shrink-0 transition-all group-hover:w-1.5" 
                      style={{ backgroundColor: eventColor }}
                    />
                    
                    <div className="flex-1 px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        {/* Type Icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${typeBgColor} flex items-center justify-center`}>
                          <TypeIcon className="w-4 h-4" style={{ color: eventColor }} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight truncate">
                                {event.title}
                              </h4>
                              
                              {/* Meta row */}
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1">
                                {/* Time */}
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {new Date(event.startDate || event.date).toLocaleTimeString('en-US', { 
                                      hour: 'numeric', 
                                      minute: '2-digit', 
                                      hour12: true 
                                    })}
                                  </span>
                                </div>
                                
                                {/* Location */}
                                {event.location && (
                                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-[100px]">{event.location}</span>
                                  </div>
                                )}
                                
                                {/* Course */}
                                {(courseCode || courseName) && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium rounded">
                                    {courseCode || courseName}
                                  </span>
                                )}
                                
                                {/* Type badge */}
                                {eventType && (
                                  <span 
                                    className="px-1.5 py-0.5 text-[10px] font-medium rounded capitalize"
                                    style={{ 
                                      backgroundColor: `${eventColor}15`,
                                      color: eventColor 
                                    }}
                                  >
                                    {eventType}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {(event as any).meta?.schedulePattern && (
                                <span className="mr-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-medium rounded">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Smart
                                </span>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(event); }}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                aria-label="Edit event"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(event.id, event); }}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                aria-label="Delete event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center px-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
              <Calendar className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No events scheduled</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Click below to add an event</p>
          </div>
        )}
      </div>

      {/* Delete scope modal (for recurring events) */}
      <EditScopeModal
        visible={showDeleteScope}
        mode={'delete'}
        onClose={() => setShowDeleteScope(false)}
        onConfirm={async (scope) => {
          try {
            setShowDeleteScope(false);
            const id = deleteTarget?.id;
            if (!id) return;
            const sched = (typeof window !== 'undefined' && (window as any).__schedulerHandlers) || (scheduler?.handlers || null);
            
            if (scope === 'single') {
              try {
                if (sched && typeof sched.handleDeleteEvent === 'function') await sched.handleDeleteEvent(id);
                else await fetch(`/api/events/${encodeURIComponent(id)}`, { method: 'DELETE' });
                
                setEvents(prev => prev.filter(ev => ev.id !== id));
                showToast(`Deleted "${deleteTarget?.title}"`, 'success', { duration: 3000 });
              } catch (e) { 
                console.warn('Delete single failed', e);
                showToast('Failed to delete event', 'error', { duration: 4000 });
              }
              setClose();
              return;
            }
            
            // scope === 'all'
            try {
              if (sched && typeof sched.handleDeleteEvent === 'function') await sched.handleDeleteEvent(id, 'all');
              else {
                await fetch(`/api/events/${encodeURIComponent(id)}?scope=all`, { method: 'DELETE' });
              }
              showToast(`Deleted all occurrences of "${deleteTarget?.title}"`, 'success', { duration: 3000 });
            } catch (e) { 
              console.warn('Bulk delete failed', e);
              showToast('Failed to delete all occurrences', 'error', { duration: 4000 });
            }
            setClose();
          } catch (err) {
            console.warn('EditScopeModal onConfirm error', err);
            showToast('An error occurred', 'error', { duration: 4000 });
          }
        }}
      />

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleClose} 
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
          <button 
            onClick={() => handleAddEvent(events[0]?.startDate || events[0]?.date)} 
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
}
