import {
  Armchair,
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageSquare,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function DashboardPage() {
  const { libraryData, refreshLibraryData, resolveSeatChangeRequest, session, subscribeToLibraryEvents } = useAuth();
  const navigate = useNavigate();
  const [resolving, setResolving] = useState(null);
  const [newRequestIds, setNewRequestIds] = useState(new Set());

  const stats = libraryData?.stats || {};
  const seatChangeRequests = libraryData?.seatChangeRequests || [];

  const attentionCount =
    seatChangeRequests.length +
    (stats.pendingPayments > 0 ? 1 : 0) +
    (stats.pendingDocuments > 0 ? 1 : 0);

  useEffect(() => {
    return subscribeToLibraryEvents({
      onSeatChangeRequest: async (payload) => {
        setNewRequestIds((prev) => new Set([...prev, String(payload?.requestId)]));
        await refreshLibraryData();
      },
    });
  }, [refreshLibraryData, subscribeToLibraryEvents]);

  async function handleResolve(requestId, action) {
    setResolving(requestId);
    try {
      await resolveSeatChangeRequest(requestId, action);
      setNewRequestIds((prev) => {
        const n = new Set(prev);
        n.delete(String(requestId));
        return n;
      });
    } finally {
      setResolving(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Dashboard
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
            {libraryData?.library?.name || "Library"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Only the items that need action, plus quick links for the tasks you use most.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Signed in
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {session?.name || "Library staff"}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Needs Your Attention</h2>
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white">
            {attentionCount}
          </span>
        </div>

        {attentionCount > 0 ? (
          <div className="space-y-2.5">
            {stats.pendingPayments > 0 && (
              <button
                onClick={() => navigate("/librarian/students")}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <Wallet className="h-4 w-4 text-amber-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {stats.pendingPayments} pending payment{stats.pendingPayments !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-slate-500">Open students and follow up on unpaid accounts.</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            )}

            {stats.pendingDocuments > 0 && (
              <button
                onClick={() => navigate("/librarian/students")}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <FileText className="h-4 w-4 text-amber-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {stats.pendingDocuments} document{stats.pendingDocuments !== 1 ? "s" : ""} to verify
                  </p>
                  <p className="text-xs text-slate-500">Review uploaded documents from students.</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            )}

            {seatChangeRequests.map((req) => (
              <div
                key={req.id}
                className={`rounded-2xl border p-4 ${
                  newRequestIds.has(String(req.id))
                    ? "border-amber-300 bg-amber-50/70"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                    <Armchair className="h-4 w-4 text-amber-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{req.studentName}</p>
                      {newRequestIds.has(String(req.id)) && (
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Seat {req.currentSeatNumber || "—"} to seat {req.requestedSeatNumber}
                      {req.reason ? <span className="text-slate-400"> · {req.reason}</span> : null}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 pl-0 sm:pl-[3.25rem]">
                  <button
                    disabled={resolving === req.id}
                    onClick={() => handleResolve(req.id, "approve")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {resolving === req.id ? "Working..." : "Approve"}
                  </button>
                  <button
                    disabled={resolving === req.id}
                    onClick={() => handleResolve(req.id, "reject")}
                    className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-8 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" />
            <p className="mt-3 text-sm font-semibold text-emerald-800">Nothing needs your attention right now.</p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
          <p className="mt-1 text-sm text-slate-500">Open the section you want in one tap.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { icon: UserPlus, label: "Add Student", path: "/librarian/registration" },
            { icon: Users, label: "Students", path: "/librarian/students" },
            { icon: Armchair, label: "Seats", path: "/librarian/seats" },
            { icon: FileText, label: "Documents", path: "/librarian/documents" },
            { icon: Wallet, label: "Payments", path: "/librarian/payments" },
            { icon: MessageSquare, label: "Chat", path: "/librarian/chat" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex min-h-24 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <action.icon className="h-[18px] w-[18px]" />
              </div>
              <span className="text-sm font-semibold text-slate-800">{action.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
