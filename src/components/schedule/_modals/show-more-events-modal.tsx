import EventStyled from "@/components/schedule/_components/view/event-component/event-styled";
import { useModal } from "@/providers/modal-context";
import { useToast } from "@/providers/toast-provider";
import { Event } from "@/types";
import React, { useEffect, useState } from "react";
import { X, Clock, MapPin, Edit, Trash2, Plus, Sparkles } from "lucide-react";
import CustomModal from "@/components/ui/custom-modal";
import AddEventModal from "@/components/schedule/_modals/add-event-modal";
import EditScopeModal from "@/components/Timetable/EditScopeModal";
import { useScheduler } from "@/providers/schedular-provider";

function getEventColor(variant: string) {
  const colors: Record<string, string> = {
    primary: '#8b5cf6',   // purple
    success: '#10b981',   // green
    danger: '#ef4444',    // red
    warning: '#f59e0b',   // amber
    info: '#3b82f6',      // blue
  };
  return colors[variant] || colors.primary;
}

export default function ShowMoreEventsModal() {
  const { data } = useModal();
  console.log(data);
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
    <div className="space-y-4 p-5">
      {/* header removed — modal begins with event list */}

      {/* Events List with enhanced styling */}
      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
        {events.map((event, idx) => (
          <div
            key={event.id || idx}
            className="group relative bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg p-3.5 transition-colors duration-150 cursor-pointer"
            style={{ borderLeft: `3px solid ${getEventColor((event as any).variant || 'primary')}` }}
            onClick={() => handleEdit(event)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{event.title}</h4>
                  {(event as any).meta?.schedulePattern && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded border border-indigo-200 dark:border-indigo-500/20">
                      <Sparkles className="w-3 h-3" />
                      Smart
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(event.startDate || event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons - Always visible on mobile, hover on desktop */}
              <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(event); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label="Edit event"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(event.id, event); }}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  aria-label="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {events.length === 0 && (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
              <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">No events for this day</p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Click "Add Event" to create one</p>
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
                // best effort: call API with scope param
                await fetch(`/api/events/${encodeURIComponent(id)}?scope=all`, { method: 'DELETE' });
              }
              showToast(`Deleted all occurrences of "${deleteTarget?.title}"`, 'success', { duration: 3000 });
            } catch (e) { 
              console.warn('Bulk delete failed', e);
              showToast('Failed to delete all occurrences', 'error', { duration: 4000 });
            }
            // close and let provider refresh list
            setClose();
          } catch (err) {
            console.warn('EditScopeModal onConfirm error', err);
            showToast('An error occurred', 'error', { duration: 4000 });
          }
        }}
      />

      {/* Footer - Simplified styling */}
      <div className="flex justify-end gap-2.5 pt-3.5 border-t border-gray-200 dark:border-gray-800">
        <button 
          onClick={handleClose} 
          className="px-4 py-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg transition-colors font-medium text-sm"
        >
          Close
        </button>
        <button 
          onClick={() => handleAddEvent(events[0]?.startDate || events[0]?.date)} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>
    </div>
  );
}
