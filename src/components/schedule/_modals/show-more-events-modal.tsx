import EventStyled from "@/components/schedule/_components/view/event-component/event-styled";
import { useModal } from "@/providers/modal-context";
import { Event } from "@/types";
import React, { useEffect, useState } from "react";
import { X, Clock, MapPin, Edit, Trash2, Plus } from "lucide-react";
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

  useEffect(() => {
    setEvents(dayEvents);
  }, [dayEvents]);

  const { setClose, setOpen } = useModal();
  const scheduler = (() => {
    try { return useScheduler(); } catch (e) { return null; }
  })();

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

    // determine if event is a recurring series similar to EventStyled logic
    let isSeries = false;
    try {
      const evAny: any = ev || events.find(x => x.id === id) || {};
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

    // If not series -> perform single delete
    if (!isSeries) {
      try {
        const sched = (typeof window !== 'undefined' && (window as any).__schedulerHandlers) || (scheduler?.handlers || null);
        if (sched && typeof sched.handleDeleteEvent === 'function') {
          await sched.handleDeleteEvent(id);
        } else {
          await fetch(`/api/events/${encodeURIComponent(id)}`, { method: 'DELETE' });
        }
      } catch (e) {
        console.warn('Delete failed', e);
      }
      setEvents(prev => prev.filter(ev => ev.id !== id));
      // close modal to avoid leaving stale list
      setClose();
      return;
    }

    // For recurring series, open EditScopeModal inside this modal
    setDeleteTarget(events.find(x => x.id === id) || ev || null);
    setShowDeleteScope(true);
  };

  return (
    <div className="space-y-3 p-4">
      {/* header removed — modal begins with event list */}

      {/* Events List */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {events.map((event, idx) => (
          <div
            key={event.id || idx}
            className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg p-4 transition-all duration-200 cursor-pointer"
            style={{ borderLeft: `4px solid ${getEventColor((event as any).variant || 'primary')}` }}
            onClick={() => handleEdit(event)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-base mb-1 truncate">{event.title}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(event.startDate || event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(event); }}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                  aria-label="Edit event"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(event.id, event); }}
                  className="absolute right-1 top-1 w-5 h-5 rounded bg-red-500/80 hover:bg-red-600 dark:bg-red-600/80 dark:hover:bg-red-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
                  aria-label="Delete event"
                >
                  <X className="w-3 h-3" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
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
              } catch (e) { console.warn('Delete single failed', e); }
              setEvents(prev => prev.filter(ev => ev.id !== id));
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
            } catch (e) { console.warn('Bulk delete failed', e); }
            // close and let provider refresh list
            setClose();
          } catch (err) {
            console.warn('EditScopeModal onConfirm error', err)
          }
        }}
      />

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
        <button onClick={handleClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium">Close</button>
        <button onClick={() => handleAddEvent(events[0]?.startDate || events[0]?.date)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>
    </div>
  );
}
