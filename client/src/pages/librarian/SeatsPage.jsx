import { Armchair, Phone, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

export function SeatsPage() {
  const { assignSeat, libraryData } = useAuth();
  const seats = libraryData?.seats || [];

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeSeat, setActiveSeat] = useState(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [seatError, setSeatError] = useState("");
  const [seatSubmitting, setSeatSubmitting] = useState(false);

  const filteredSeats = useMemo(() => {
    return seats.filter((seat) => {
      if (filter === "occupied" && seat.status !== "occupied") return false;
      if (filter === "empty" && seat.status === "occupied") return false;
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const haystack = `${seat.label} ${seat.number} ${seat.student?.name || ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [seats, filter, search]);

  const occupiedCount = seats.filter((s) => s.status === "occupied").length;
  const emptyCount = seats.length - occupiedCount;

  function openSeat(seat) {
    setActiveSeat(seat);
    setPhoneInput("");
    setSeatError("");
  }

  function closeSeat() {
    setActiveSeat(null);
    setPhoneInput("");
    setSeatError("");
    setSeatSubmitting(false);
  }

  async function handleAssignSeat(phoneValue) {
    if (!activeSeat) return;
    setSeatSubmitting(true);
    setSeatError("");
    try {
      await assignSeat(activeSeat.id, phoneValue);
      closeSeat();
    } catch (error) {
      setSeatError(error?.message || "Unable to update seat");
      setSeatSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Seats</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tap any seat to assign or change its student.
            </p>
          </div>
          <div className="flex gap-2">
            <Stat label="Total" value={seats.length} color="bg-slate-100 text-slate-700" />
            <Stat label="Occupied" value={occupiedCount} color="bg-rose-100 text-rose-700" />
            <Stat label="Empty" value={emptyCount} color="bg-emerald-100 text-emerald-700" />
          </div>
        </div>

        {/* Filter + Search */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex rounded-2xl bg-slate-100 p-1">
            {[
              { key: "all", label: "All" },
              { key: "occupied", label: "Occupied" },
              { key: "empty", label: "Empty" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                  filter === tab.key
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 focus-within:border-emerald-400">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search seat or student"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Seat Cards */}
      {filteredSeats.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSeats.map((seat) => {
            const occupied = seat.status === "occupied";
            return (
              <button
                key={seat.id}
                type="button"
                onClick={() => openSeat(seat)}
                className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${
                  occupied
                    ? "border-rose-200 bg-gradient-to-br from-rose-50 to-white"
                    : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        occupied ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      <Armchair className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900">{seat.label}</h2>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest ${
                      occupied ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {occupied ? "Occupied" : "Empty"}
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-700">
                  {occupied ? seat.student?.name : "Available for assignment"}
                </p>
                <p className="mt-1 text-xs text-slate-400 group-hover:text-emerald-600">
                  Tap to {occupied ? "reassign or clear" : "assign student"}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-400">No seats match your filter</p>
        </div>
      )}

      {/* Assign Seat Modal */}
      {activeSeat ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={closeSeat}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`relative p-6 ${
                activeSeat.status === "occupied"
                  ? "bg-gradient-to-br from-rose-500 to-pink-500"
                  : "bg-gradient-to-br from-emerald-500 to-teal-500"
              } text-white`}
            >
              <button
                type="button"
                onClick={closeSeat}
                className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/20 p-3">
                  <Armchair className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/80">
                    {activeSeat.status === "occupied" ? "Occupied" : "Empty"}
                  </p>
                  <h3 className="text-2xl font-extrabold leading-tight">{activeSeat.label}</h3>
                </div>
              </div>
              {activeSeat.status === "occupied" && (
                <div className="mt-4 rounded-2xl bg-white/15 px-3 py-2 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Currently assigned to</p>
                  <p className="text-sm font-bold">{activeSeat.student?.name || "Unknown"}</p>
                </div>
              )}
            </div>

            <form
              className="p-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleAssignSeat(phoneInput);
              }}
            >
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {activeSeat.status === "occupied" ? "Reassign to student" : "Assign to student"}
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-400 focus-within:bg-white">
                <Phone className="h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Student phone number"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Enter the student's registered phone number</p>
              {seatError ? (
                <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                  {seatError}
                </div>
              ) : null}

              <div className="mt-5 flex gap-2">
                <button
                  type="submit"
                  disabled={seatSubmitting || !phoneInput.trim()}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:shadow-none"
                >
                  {seatSubmitting ? "Assigning..." : activeSeat.status === "occupied" ? "Reassign Seat" : "Assign Seat"}
                </button>
                {activeSeat.status === "occupied" ? (
                  <button
                    type="button"
                    disabled={seatSubmitting}
                    onClick={() => handleAssignSeat("")}
                    className="flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                    title="Clear seat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className={`flex items-center gap-2 rounded-2xl px-3 py-1.5 ${color}`}>
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-lg font-extrabold">{value}</span>
    </div>
  );
}