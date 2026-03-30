import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, Meta, Links, ScrollRestoration, Scripts, useNavigate, Link } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useState, useEffect, useMemo } from "react";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const stylesheet = "/assets/app-DrD-r-ii.css";
const links = () => [{
  rel: "stylesheet",
  href: stylesheet
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      className: "bg-gray-50 text-gray-900 min-h-screen",
      children: [/* @__PURE__ */ jsx("header", {
        className: "border-b border-gray-200 bg-white",
        children: /* @__PURE__ */ jsx("div", {
          className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
          children: /* @__PURE__ */ jsx("div", {
            className: "flex h-16 items-center justify-between",
            children: /* @__PURE__ */ jsx("h1", {
              className: "text-xl font-semibold",
              children: "Meeting Mind"
            })
          })
        })
      }), /* @__PURE__ */ jsx("main", {
        className: "w-full px-4 sm:px-6 lg:px-8 py-8",
        children
      }), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const API_BASE = "http://localhost:3001";
function MeetingDashboard({ startInCreateMode = false }) {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState(startInCreateMode ? "new" : "view");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  useEffect(() => {
    void loadMeetings();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3e3);
    return () => clearTimeout(timer);
  }, [toast]);
  const selected = useMemo(
    () => meetings.find((m) => m.id === selectedId) ?? null,
    [meetings, selectedId]
  );
  async function loadMeetings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/meetings`);
      if (!res.ok) throw new Error("Failed to fetch meetings");
      const data = await res.json();
      setMeetings(data);
      if (!startInCreateMode && data.length > 0) {
        setSelectedId((prev) => prev ?? data[0].id);
      }
    } catch {
      setError("Failed to load meetings.");
      setToast({ type: "error", message: "Could not load meetings." });
    } finally {
      setLoading(false);
    }
  }
  function openNewMeeting() {
    setMode("new");
    setSelectedId(null);
    navigate("/new");
  }
  function onSelectMeeting(id) {
    setSelectedId(id);
    setMode("view");
    navigate("/");
  }
  async function onCreateMeeting(payload) {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data == null ? void 0 : data.message) ?? "Create failed");
      const created = data;
      setMeetings((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setMode("view");
      setToast({ type: "success", message: "Meeting created successfully." });
      navigate("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create meeting.";
      setToast({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  }
  async function onUpdateMeeting(id, payload) {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/meetings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data == null ? void 0 : data.message) ?? "Save failed");
      const updated = data;
      setMeetings((prev) => prev.map((m) => m.id === updated.id ? updated : m));
      setSelectedId(updated.id);
      setMode("view");
      setToast({ type: "success", message: "Meeting updated successfully." });
      navigate("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save meeting.";
      setToast({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    toast && /* @__PURE__ */ jsx(
      "div",
      {
        className: `fixed right-5 top-5 z-50 rounded-md px-4 py-3 text-sm text-white shadow-lg ${toast.type === "success" ? "bg-blue-600" : "bg-rose-600"}`,
        children: toast.message
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-slate-200 bg-white shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 px-5 py-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Workspace" }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold tracking-tight text-slate-900", children: "Meeting Mind" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: openNewMeeting,
            className: "inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600",
            children: "New Meeting"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row", children: [
        /* @__PURE__ */ jsx("section", { className: "w-full border-b border-slate-200 md:w-[64%] md:border-b-0 md:border-r md:border-slate-200", children: loading ? /* @__PURE__ */ jsx(TableSkeleton, {}) : error ? /* @__PURE__ */ jsx("div", { className: "p-5 text-sm text-rose-700", children: error }) : meetings.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-10 text-center text-sm text-slate-500", children: "No meetings yet. Create your first one." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Title" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Summary" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Action Items" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Decisions" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Open Questions" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100", children: meetings.map((meeting) => {
            const selectedRow = meeting.id === selectedId && mode !== "new";
            return /* @__PURE__ */ jsxs(
              "tr",
              {
                className: `cursor-pointer transition ${selectedRow ? "bg-blue-50" : "hover:bg-blue-50/60"}`,
                onClick: () => onSelectMeeting(meeting.id),
                children: [
                  /* @__PURE__ */ jsx("td", { className: "max-w-[180px] truncate px-4 py-3 font-medium text-slate-800", children: meeting.title }),
                  /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-4 py-3 text-slate-600", children: new Date(meeting.date).toLocaleDateString() }),
                  /* @__PURE__ */ jsx("td", { className: "max-w-[260px] truncate px-4 py-3 text-slate-600", children: meeting.analysis.summary }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-600", children: meeting.analysis.actionItems.length }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-600", children: meeting.analysis.decisions.length }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-600", children: meeting.analysis.openQuestions.length }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: "rounded bg-blue-100 px-2 py-1 text-xs text-blue-700", children: "Live" }) })
                ]
              },
              meeting.id
            );
          }) })
        ] }) }) }),
        /* @__PURE__ */ jsx("aside", { className: "w-full md:w-[36%]", children: /* @__PURE__ */ jsx("div", { className: "h-full min-h-[420px] bg-white p-5", children: mode === "new" ? /* @__PURE__ */ jsx(
          MeetingEditForm,
          {
            title: "Create Meeting",
            initial: {
              title: "",
              date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
              transcript: ""
            },
            saving,
            submitLabel: "Create Meeting",
            onCancel: () => {
              setMode("view");
              if (selectedId) navigate("/");
            },
            onSubmit: onCreateMeeting
          }
        ) : selected ? mode === "edit" ? /* @__PURE__ */ jsx(
          MeetingEditForm,
          {
            title: "Edit Meeting",
            initial: {
              title: selected.title,
              date: selected.date.slice(0, 10),
              transcript: selected.transcript
            },
            saving,
            submitLabel: "Save Changes",
            onCancel: () => setMode("view"),
            onSubmit: (payload) => onUpdateMeeting(selected.id, payload)
          }
        ) : /* @__PURE__ */ jsx(
          MeetingDetailPanel,
          {
            meeting: selected,
            onEdit: () => setMode("edit"),
            onCopy: () => setToast({
              type: "success",
              message: "Action item copied."
            })
          }
        ) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsx(
          EmptyState,
          {
            title: "No meeting selected",
            description: "Select a row from the table to view full meeting details."
          }
        ) }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: /* @__PURE__ */ jsx(Link, { to: "/new", className: "hover:text-blue-600", children: "Or create from dedicated /new route" }) })
  ] });
}
function MeetingDetailPanel({
  meeting,
  onEdit,
  onCopy
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900", children: meeting.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-500", children: new Date(meeting.date).toLocaleDateString() })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onEdit,
          className: "rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-600",
          children: "Edit"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h4", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Summary" }),
      /* @__PURE__ */ jsx("p", { className: "rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700", children: meeting.analysis.summary })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h4", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Action Items" }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: meeting.analysis.actionItems.map((item, idx) => /* @__PURE__ */ jsxs(
        "li",
        {
          className: "flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-800", children: item.description }),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: `mt-1 inline-block rounded px-2 py-1 text-xs ${item.assignee !== "Unassigned" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`,
                  children: item.assignee
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  navigator.clipboard.writeText(`${item.description} (Assignee: ${item.assignee})`).then(onCopy).catch(() => void 0);
                },
                className: "rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50",
                children: "Copy"
              }
            )
          ]
        },
        `${item.description}-${idx}`
      )) })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h4", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Decisions" }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: meeting.analysis.decisions.map((decision, idx) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-slate-700", children: [
        /* @__PURE__ */ jsx("span", { className: "text-emerald-600", children: "✔" }),
        /* @__PURE__ */ jsx("span", { children: decision })
      ] }, `${decision}-${idx}`)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h4", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Open Questions" }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: meeting.analysis.openQuestions.map((question, idx) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-slate-700", children: [
        /* @__PURE__ */ jsx("span", { className: "text-amber-600", children: "?" }),
        /* @__PURE__ */ jsx("span", { children: question })
      ] }, `${question}-${idx}`)) })
    ] })
  ] });
}
function MeetingEditForm({
  title,
  initial,
  saving,
  submitLabel,
  onSubmit,
  onCancel
}) {
  const [form, setForm] = useState(initial);
  useEffect(() => {
    setForm(initial);
  }, [initial]);
  return /* @__PURE__ */ jsxs(
    "form",
    {
      className: "space-y-4",
      onSubmit: (e) => {
        e.preventDefault();
        void onSubmit(form);
      },
      children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900", children: title }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700", children: "Title" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              className: "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100",
              value: form.title,
              onChange: (e) => setForm((prev) => ({ ...prev, title: e.target.value })),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700", children: "Date" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              className: "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100",
              value: form.date.slice(0, 10),
              onChange: (e) => setForm((prev) => ({ ...prev, date: e.target.value })),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-slate-700", children: "Transcript" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              className: "min-h-[210px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100",
              value: form.transcript,
              onChange: (e) => setForm((prev) => ({ ...prev, transcript: e.target.value })),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: saving,
              className: "rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-60",
              children: saving ? "Saving..." : submitLabel
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onCancel,
              className: "rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50",
              children: "Cancel"
            }
          )
        ] })
      ]
    }
  );
}
function TableSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: "animate-pulse p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-4 h-8 w-40 rounded bg-slate-100" }),
    [1, 2, 3, 4, 5].map((k) => /* @__PURE__ */ jsx("div", { className: "mb-2 h-10 rounded bg-slate-50" }, k))
  ] });
}
function EmptyState({ title, description }) {
  return /* @__PURE__ */ jsxs("div", { className: "max-w-xs text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500", children: "i" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-700", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-500", children: description })
  ] });
}
const dashboard = UNSAFE_withComponentProps(function DashboardRoute() {
  return /* @__PURE__ */ jsx(MeetingDashboard, {});
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: dashboard
}, Symbol.toStringTag, { value: "Module" }));
const home = UNSAFE_withComponentProps(function Home() {
  return /* @__PURE__ */ jsxs("div", {
    className: "py-20 text-center",
    children: [/* @__PURE__ */ jsx("h2", {
      className: "text-3xl font-bold tracking-tight text-slate-900",
      children: "Meeting Mind"
    }), /* @__PURE__ */ jsxs("p", {
      className: "mt-3 text-slate-600",
      children: ["Intro page. The default dashboard now lives at ", /* @__PURE__ */ jsx("code", {
        children: "/"
      }), "."]
    })]
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home
}, Symbol.toStringTag, { value: "Module" }));
const _new = UNSAFE_withComponentProps(function NewMeetingRoute() {
  return /* @__PURE__ */ jsx(MeetingDashboard, {
    startInCreateMode: true
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _new
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-B1witNhI.js", "imports": ["/assets/chunk-UVKPFVEO-C-kWeDpd.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-BWoiSiSK.js", "imports": ["/assets/chunk-UVKPFVEO-C-kWeDpd.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard": { "id": "routes/dashboard", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/dashboard-CuQ3D0X2.js", "imports": ["/assets/chunk-UVKPFVEO-C-kWeDpd.js", "/assets/MeetingDashboard-CUJ3z3m5.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": "intro", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/home-BHN-sZI3.js", "imports": ["/assets/chunk-UVKPFVEO-C-kWeDpd.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/new": { "id": "routes/new", "parentId": "root", "path": "new", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/new-Dzp0Jvl6.js", "imports": ["/assets/chunk-UVKPFVEO-C-kWeDpd.js", "/assets/MeetingDashboard-CUJ3z3m5.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-0f580606.js", "version": "0f580606", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_passThroughRequests": false, "unstable_subResourceIntegrity": false, "unstable_trailingSlashAwareDataRequests": false, "unstable_previewServerPrerendering": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/dashboard": {
    id: "routes/dashboard",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: "intro",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/new": {
    id: "routes/new",
    parentId: "root",
    path: "new",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
