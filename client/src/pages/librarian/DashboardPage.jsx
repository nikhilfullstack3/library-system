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
import { useTheme } from "../../context/ThemeContext";

export function DashboardPage() {
  const { libraryData, refreshLibraryData, resolveSeatChangeRequest, subscribeToLibraryEvents } = useAuth();
  const { isMidnightJelly } = useTheme();
  const navigate = useNavigate();
  const [resolving, setResolving] = useState(null);
  const [newRequestIds, setNewRequestIds] = useState(new Set());

  const stats = libraryData?.stats || {};
  const seatChangeRequests = libraryData?.seatChangeRequests || [];
  const totalSeats = stats.totalSeats || (stats.occupiedSeats || 0) + (stats.emptySeats || 0) || 0;
  const occupancyPercent = totalSeats > 0 ? Math.round(((stats.occupiedSeats || 0) / totalSeats) * 100) : 0;

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
      {/* Header */}
      <div
        className={`flex flex-col gap-4 rounded-3xl border p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between ${
          isMidnightJelly
            ? "border-white/10 bg-white/10 shadow-[0_24px_80px_rgba(14,10,28,0.38)]"
            : "border-slate-200 bg-white"
        }`}
      >
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isMidnightJelly ? "text-violet-200/60" : "text-slate-400"}`}>
            Dashboard
          </p>
          <h1 className={`mt-2 text-2xl font-extrabold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>
            {libraryData?.library?.name || "Library"}
          </h1>
          <p className={`mt-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
            Only the items that need action, plus quick links for the tasks you use most.
          </p>
        </div>
      </div>

      {/* LIVE NOW pulse card */}
      <section className={`rounded-3xl border p-6 shadow-sm ${isMidnightJelly ? "border-emerald-400/20 bg-emerald-400/5 shadow-[0_24px_80px_rgba(14,10,28,0.38)]" : "border-emerald-200 bg-emerald-50"}`}>
        <div className="mb-4 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <p className={`text-[11px] font-extrabold uppercase tracking-[0.18em] ${isMidnightJelly ? "text-emerald-300" : "text-emerald-700"}`}>
            Live Now
          </p>
        </div>

        <div className="flex items-end gap-8">
          <div>
            <p className={`text-5xl font-extrabold leading-none ${isMidnightJelly ? "text-white" : "text-slate-900"}`}>
              {stats.currentStudents || 0}
            </p>
            <p className={`mt-1 text-sm ${isMidnightJelly ? "text-emerald-300/80" : "text-emerald-700"}`}>students inside</p>
          </div>
          <div>
            <p className={`text-3xl font-extrabold leading-none ${isMidnightJelly ? "text-white" : "text-slate-900"}`}>
              {stats.occupiedSeats || 0}
              <span className={`text-xl font-bold ${isMidnightJelly ? "text-white/40" : "text-slate-400"}`}>/{totalSeats}</span>
            </p>
            <p className={`mt-1 text-sm ${isMidnightJelly ? "text-emerald-300/80" : "text-emerald-700"}`}>seats filled</p>
          </div>
        </div>

        <div className={`mt-4 h-2 overflow-hidden rounded-full ${isMidnightJelly ? "bg-white/10" : "bg-emerald-200/60"}`}>
          <div
            className={`h-full rounded-full transition-all duration-700 ${isMidnightJelly ? "bg-emerald-400" : "bg-emerald-500"}`}
            style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
          />
        </div>
        <p className={`mt-2 text-xs ${isMidnightJelly ? "text-white/40" : "text-emerald-600/70"}`}>
          {occupancyPercent}% occupancy · {stats.emptySeats || 0} seats available
        </p>
      </section>

      {/* Needs Your Attention */}
      <section className={`rounded-3xl border p-6 shadow-sm ${isMidnightJelly ? "border-white/10 bg-white/10 shadow-[0_24px_80px_rgba(14,10,28,0.38)]" : "border-slate-200 bg-white"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-base font-bold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Needs Your Attention</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white ${isMidnightJelly ? "bg-gradient-to-r from-fuchsia-500 to-violet-500" : "bg-amber-500"}`}>
            {attentionCount}
          </span>
        </div>

        {attentionCount > 0 ? (
          <div className="space-y-2.5">
            {stats.pendingPayments > 0 && (
              <button
                onClick={() => navigate("/librarian/students")}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  isMidnightJelly
                    ? "border-white/10 bg-white/5 hover:border-fuchsia-300/40 hover:bg-fuchsia-500/10"
                    : "border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isMidnightJelly ? "bg-fuchsia-500/14" : "bg-amber-100"}`}>
                  <Wallet className={`h-4 w-4 ${isMidnightJelly ? "text-fuchsia-200" : "text-amber-700"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>
                    {stats.pendingPayments} pending payment{stats.pendingPayments !== 1 ? "s" : ""}
                  </p>
                  <p className={`text-xs ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Open students and follow up on unpaid accounts.</p>
                </div>
                <ChevronRight className={`h-4 w-4 shrink-0 ${isMidnightJelly ? "text-violet-100/50" : "text-slate-400"}`} />
              </button>
            )}

            {stats.pendingDocuments > 0 && (
              <button
                onClick={() => navigate("/librarian/students")}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  isMidnightJelly
                    ? "border-white/10 bg-white/5 hover:border-cyan-300/40 hover:bg-cyan-400/10"
                    : "border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isMidnightJelly ? "bg-cyan-400/14" : "bg-amber-100"}`}>
                  <FileText className={`h-4 w-4 ${isMidnightJelly ? "text-cyan-200" : "text-amber-700"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>
                    {stats.pendingDocuments} document{stats.pendingDocuments !== 1 ? "s" : ""} to verify
                  </p>
                  <p className={`text-xs ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Review uploaded documents from students.</p>
                </div>
                <ChevronRight className={`h-4 w-4 shrink-0 ${isMidnightJelly ? "text-violet-100/50" : "text-slate-400"}`} />
              </button>
            )}

            {seatChangeRequests.map((req) => (
              <div
                key={req.id}
                className={`rounded-2xl border p-4 ${
                  newRequestIds.has(String(req.id))
                    ? isMidnightJelly
                      ? "border-fuchsia-300/35 bg-fuchsia-500/10"
                      : "border-amber-300 bg-amber-50/70"
                    : isMidnightJelly
                      ? "border-white/10 bg-white/5"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isMidnightJelly ? "bg-violet-400/14" : "bg-amber-100"}`}>
                    <Armchair className={`h-4 w-4 ${isMidnightJelly ? "text-violet-200" : "text-amber-700"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>{req.studentName}</p>
                      {newRequestIds.has(String(req.id)) && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isMidnightJelly ? "bg-fuchsia-400/20 text-fuchsia-100" : "bg-amber-200 text-amber-800"}`}>
                          New
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>
                      Seat {req.currentSeatNumber || "—"} to seat {req.requestedSeatNumber}
                      {req.reason ? <span className={isMidnightJelly ? "text-violet-100/50" : "text-slate-400"}> · {req.reason}</span> : null}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 pl-0 sm:pl-[3.25rem]">
                  <button
                    disabled={resolving === req.id}
                    onClick={() => handleResolve(req.id, "approve")}
                    className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 ${
                      isMidnightJelly
                        ? "bg-gradient-to-r from-violet-500 to-cyan-400 hover:brightness-110"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {resolving === req.id ? "Working..." : "Approve"}
                  </button>
                  <button
                    disabled={resolving === req.id}
                    onClick={() => handleResolve(req.id, "reject")}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${
                      isMidnightJelly
                        ? "border-rose-300/20 bg-white/10 text-rose-200 hover:bg-rose-400/10"
                        : "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-2xl border px-4 py-8 text-center ${isMidnightJelly ? "border-cyan-300/20 bg-cyan-400/8" : "border-emerald-200 bg-emerald-50"}`}>
            <CheckCircle2 className={`mx-auto h-7 w-7 ${isMidnightJelly ? "text-cyan-200" : "text-emerald-500"}`} />
            <p className={`mt-3 text-sm font-semibold ${isMidnightJelly ? "text-cyan-100" : "text-emerald-800"}`}>Nothing needs your attention right now.</p>
          </div>
        )}
      </section>

      <section className={`rounded-3xl border p-6 shadow-sm ${isMidnightJelly ? "border-white/10 bg-white/10 shadow-[0_24px_80px_rgba(14,10,28,0.38)]" : "border-slate-200 bg-white"}`}>
        <div className="mb-4">
          <h2 className={`text-base font-bold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Quick Actions</h2>
          <p className={`mt-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Open the section you want in one tap.</p>
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
              className={`flex min-h-24 flex-col items-start justify-between rounded-2xl border p-4 text-left transition ${
                isMidnightJelly
                  ? "border-white/10 bg-white/5 hover:border-violet-300/35 hover:bg-violet-500/10"
                  : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${isMidnightJelly ? "bg-white/10 text-cyan-200" : "bg-white text-emerald-700"}`}>
                <action.icon className="h-[18px] w-[18px]" />
              </div>
              <span className={`text-sm font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-800"}`}>{action.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
