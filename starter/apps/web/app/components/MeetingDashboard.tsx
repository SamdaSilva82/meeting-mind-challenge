import type { CreateMeetingRequest, MeetingRecord } from '@meeting-mind/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

type Mode = 'view' | 'edit' | 'new';
type Toast = { type: 'success' | 'error'; message: string } | null;

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function MeetingDashboard({ startInCreateMode = false }: { startInCreateMode?: boolean }) {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(startInCreateMode ? 'new' : 'view');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    void loadMeetings();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const selected = useMemo(
    () => meetings.find((m) => m.id === selectedId) ?? null,
    [meetings, selectedId],
  );

  async function loadMeetings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/meetings`);
      if (!res.ok) throw new Error('Failed to fetch meetings');
      const data = (await res.json()) as MeetingRecord[];
      setMeetings(data);
      if (!startInCreateMode && data.length > 0) {
        setSelectedId((prev) => prev ?? data[0].id);
      }
    } catch {
      setError('Failed to load meetings.');
      setToast({ type: 'error', message: 'Could not load meetings.' });
    } finally {
      setLoading(false);
    }
  }

  function openNewMeeting() {
    setMode('new');
    setSelectedId(null);
    navigate('/new');
  }

  function onSelectMeeting(id: string) {
    setSelectedId(id);
    setMode('view');
    navigate('/');
  }

  async function onCreateMeeting(payload: CreateMeetingRequest) {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Create failed');
      const created = data as MeetingRecord;
      setMeetings((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setMode('view');
      setToast({ type: 'success', message: 'Meeting created successfully.' });
      navigate('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create meeting.';
      setToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  }

  async function onUpdateMeeting(id: string, payload: CreateMeetingRequest) {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Save failed');
      const updated = data as MeetingRecord;
      setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setSelectedId(updated.id);
      setMode('view');
      setToast({ type: 'success', message: 'Meeting updated successfully.' });
      navigate('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not save meeting.';
      setToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 rounded-md px-4 py-3 text-sm text-white shadow-lg ${
            toast.type === 'success' ? 'bg-blue-600' : 'bg-rose-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Workspace</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Meeting Mind
            </h2>
          </div>
          <button
            type="button"
            onClick={openNewMeeting}
            className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            New Meeting
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          <section className="w-full border-b border-slate-200 md:w-[64%] md:border-b-0 md:border-r md:border-slate-200">
            {loading ? (
              <TableSkeleton />
            ) : error ? (
              <div className="p-5 text-sm text-rose-700">{error}</div>
            ) : meetings.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No meetings yet. Create your first one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Summary</th>
                      <th className="px-4 py-3">Action Items</th>
                      <th className="px-4 py-3">Decisions</th>
                      <th className="px-4 py-3">Open Questions</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {meetings.map((meeting) => {
                      const selectedRow = meeting.id === selectedId && mode !== 'new';
                      return (
                        <tr
                          key={meeting.id}
                          className={`cursor-pointer transition ${
                            selectedRow
                              ? 'bg-blue-50'
                              : 'hover:bg-blue-50/60'
                          }`}
                          onClick={() => onSelectMeeting(meeting.id)}
                        >
                          <td className="max-w-[180px] truncate px-4 py-3 font-medium text-slate-800">
                            {meeting.title}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {new Date(meeting.date).toLocaleDateString()}
                          </td>
                          <td className="max-w-[260px] truncate px-4 py-3 text-slate-600">
                            {meeting.analysis.summary}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {meeting.analysis.actionItems.length}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {meeting.analysis.decisions.length}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {meeting.analysis.openQuestions.length}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                              Live
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="w-full md:w-[36%]">
            <div className="h-full min-h-[420px] bg-white p-5">
              {mode === 'new' ? (
                <MeetingEditForm
                  title="Create Meeting"
                  initial={{
                    title: '',
                    date: new Date().toISOString().slice(0, 10),
                    transcript: '',
                  }}
                  saving={saving}
                  submitLabel="Create Meeting"
                  onCancel={() => {
                    setMode('view');
                    if (selectedId) navigate('/');
                  }}
                  onSubmit={onCreateMeeting}
                />
              ) : selected ? (
                mode === 'edit' ? (
                  <MeetingEditForm
                    title="Edit Meeting"
                    initial={{
                      title: selected.title,
                      date: selected.date.slice(0, 10),
                      transcript: selected.transcript,
                    }}
                    saving={saving}
                    submitLabel="Save Changes"
                    onCancel={() => setMode('view')}
                    onSubmit={(payload) => onUpdateMeeting(selected.id, payload)}
                  />
                ) : (
                  <MeetingDetailPanel
                    meeting={selected}
                    onEdit={() => setMode('edit')}
                    onCopy={() =>
                      setToast({
                        type: 'success',
                        message: 'Action item copied.',
                      })
                    }
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    title="No meeting selected"
                    description="Select a row from the table to view full meeting details."
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        <Link to="/new" className="hover:text-blue-600">
          Or create from dedicated /new route
        </Link>
      </div>
    </div>
  );
}

function MeetingDetailPanel({
  meeting,
  onEdit,
  onCopy,
}: {
  meeting: MeetingRecord;
  onEdit: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{meeting.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {new Date(meeting.date).toLocaleDateString()}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
        >
          Edit
        </button>
      </div>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Summary
        </h4>
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          {meeting.analysis.summary}
        </p>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Action Items
        </h4>
        <ul className="space-y-2">
          {meeting.analysis.actionItems.map((item, idx) => (
            <li
              key={`${item.description}-${idx}`}
              className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-800">{item.description}</p>
                <span
                  className={`mt-1 inline-block rounded px-2 py-1 text-xs ${
                    item.assignee !== 'Unassigned'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.assignee}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard
                    .writeText(`${item.description} (Assignee: ${item.assignee})`)
                    .then(onCopy)
                    .catch(() => undefined);
                }}
                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Copy
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Decisions
        </h4>
        <ul className="space-y-2">
          {meeting.analysis.decisions.map((decision, idx) => (
            <li key={`${decision}-${idx}`} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-emerald-600">✔</span>
              <span>{decision}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Open Questions
        </h4>
        <ul className="space-y-2">
          {meeting.analysis.openQuestions.map((question, idx) => (
            <li key={`${question}-${idx}`} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-amber-600">?</span>
              <span>{question}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MeetingEditForm({
  title,
  initial,
  saving,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  title: string;
  initial: CreateMeetingRequest;
  saving: boolean;
  submitLabel: string;
  onSubmit: (payload: CreateMeetingRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateMeetingRequest>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(form);
      }}
    >
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
        <input
          type="date"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={form.date.slice(0, 10)}
          onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Transcript</label>
        <textarea
          className="min-h-[210px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={form.transcript}
          onChange={(e) => setForm((prev) => ({ ...prev, transcript: e.target.value }))}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-60"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse p-4">
      <div className="mb-4 h-8 w-40 rounded bg-slate-100" />
      {[1, 2, 3, 4, 5].map((k) => (
        <div key={k} className="mb-2 h-10 rounded bg-slate-50" />
      ))}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-xs text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        i
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
