import { Armchair, CalendarCheck, MessageCircle, Home, Moon, Paperclip, Send, Sun, UserRound, X, Clock, CheckCircle2, AlertCircle, ScanLine, Camera, LogIn, LogOut as LogOutIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { API_ORIGIN } from "../../lib/api";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const SHIFT_END_WARNING_MS = 30 * 60 * 1000;

function formatChatTime(value) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFileSize(size) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getSenderLabel(message) {
  return message.senderRole === "admin" ? `${message.senderName} (Admin)` : message.senderName;
}

function resolveAssetUrl(url = "") {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url}`;
}

function renderLinkedMessage(text) {
  return text.split(URL_PATTERN).map((part, index) => {
    if (part.match(URL_PATTERN)) {
      return (
        <a className="underline underline-offset-4" href={part} key={`${part}-${index}`} rel="noreferrer" target="_blank">
          {part}
        </a>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getShiftEndDate(student) {
  if (!student?.shiftEndTime || student.fullDay) return null;
  const match = String(student.shiftEndTime).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3].toUpperCase() === "PM") hours += 12;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getAttendanceDisplay(student) {
  if (!student?.currentlyInLibrary || !student?.activeSessionStartedAt) {
    return student?.shiftTiming || student?.shift || "-";
  }
  const elapsedMs = Math.max(0, (student?._now || Date.now()) - new Date(student.activeSessionStartedAt).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function getShiftWarning(student) {
  if (!student?.currentlyInLibrary) return null;
  const shiftEndDate = getShiftEndDate(student);
  if (!shiftEndDate) return null;
  const remainingMs = shiftEndDate.getTime() - Date.now();
  if (remainingMs <= 0) return "Your shift has ended. Please check out now.";
  if (remainingMs > SHIFT_END_WARNING_MS) return null;
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Your shift will end in ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s.`;
}

function LiveShiftWarning({ mj, student }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!student?.currentlyInLibrary) {
      return undefined;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [student?.currentlyInLibrary, student?.shiftEndTime, student?.fullDay]);

  if (!student?.currentlyInLibrary) {
    return null;
  }

  const shiftEndDate = getShiftEndDate(student);
  if (!shiftEndDate) {
    return null;
  }

  const remainingMs = shiftEndDate.getTime() - now;
  let text = null;

  if (remainingMs <= 0) {
    text = "Your shift has ended. Please check out now.";
  } else if (remainingMs <= SHIFT_END_WARNING_MS) {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    text = `Your shift will end in ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s.`;
  }

  if (!text) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
      mj ? "border-rose-800 bg-rose-900/30 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"
    }`}>
      <AlertCircle className="h-4 w-4 shrink-0" />
      {text}
    </div>
  );
}

function LiveAttendanceValue({ student }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!student?.currentlyInLibrary || !student?.activeSessionStartedAt) {
      return undefined;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [student?.activeSessionStartedAt, student?.currentlyInLibrary]);

  return (
    <p className="mt-2 font-mono text-base font-bold text-white/90">
      {getAttendanceDisplay({ ...student, _now: now })}
    </p>
  );
}

export function StudentDashboardPage() {
  const { fetchChatMessages, logout, refreshStudentData, requestSeatChange, scanAttendanceQr, sendChatMessage, session, studentData, subscribeToLibraryEvents } = useAuth();
  const { isMidnightJelly, toggleMidnightJelly } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [chatMessages, setChatMessages] = useState(studentData?.chatMessages || []);
  const [chatInput, setChatInput] = useState("");
  const [chatAttachment, setChatAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [seatNumberInput, setSeatNumberInput] = useState("");
  const [seatReason, setSeatReason] = useState("");
  const [seatSubmitting, setSeatSubmitting] = useState(false);
  const [seatError, setSeatError] = useState("");
  const [seatSuccess, setSeatSuccess] = useState(false);
  // QR scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const chatBottomRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    setChatMessages(studentData?.chatMessages || []);
  }, [studentData]);

  useEffect(() => {
    if (activeTab === "chat") {
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      setUnreadCount(0);
    }
  }, [activeTab, chatMessages]);

  useEffect(() => {
    if (activeTab !== "chat" && chatMessages.length > prevMessageCountRef.current) {
      setUnreadCount((c) => c + (chatMessages.length - prevMessageCountRef.current));
    }
    prevMessageCountRef.current = chatMessages.length;
  }, [chatMessages, activeTab]);

  const loadMessages = useCallback(async () => {
    if (!session?.studentId) return;
    const messages = await fetchChatMessages();
    setChatMessages(messages);
    await refreshStudentData(session.studentId);
  }, [fetchChatMessages, refreshStudentData, session]);

  useEffect(() => {
    if (!session?.studentId) return;
    loadMessages().catch(() => {});
  }, [loadMessages, session?.studentId]);

  useEffect(() => {
    if (!session?.studentId) return () => {};
    return subscribeToLibraryEvents({
      onAccessUpdate: async () => {
        const messages = await fetchChatMessages();
        setChatMessages(messages);
      },
      onMessage: async () => { await loadMessages(); },
      onSeatChangeResolved: async (payload) => {
        if (String(payload?.studentId) === String(session?.studentId)) {
          await refreshStudentData(session.studentId);
          setSeatSuccess(false);
        }
      },
    });
  }, [loadMessages, refreshStudentData, session?.studentId, subscribeToLibraryEvents]);

  async function handleSeatChangeRequest(e) {
    e.preventDefault();
    if (!seatNumberInput.trim()) return;
    setSeatSubmitting(true);
    setSeatError("");
    try {
      await requestSeatChange(seatNumberInput.trim(), seatReason);
      setSeatSuccess(true);
      setSeatModalOpen(false);
      setSeatNumberInput("");
      setSeatReason("");
      await refreshStudentData(session.studentId);
    } catch (err) {
      setSeatError(err?.message || "Unable to submit request");
    } finally {
      setSeatSubmitting(false);
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    if ((!chatInput.trim() && !chatAttachment) || !studentData?.student.chatEnabled) return;
    setSending(true);
    try {
      if (chatAttachment?.size > MAX_ATTACHMENT_SIZE) {
        window.alert(`Please upload a file smaller than ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`);
        return;
      }
      await sendChatMessage({
        message: chatInput.trim() || (chatAttachment?.name ? `Shared ${chatAttachment.name}` : ""),
        tag: "",
        attachment: chatAttachment,
      });
      const messages = await fetchChatMessages();
      setChatMessages(messages);
      await refreshStudentData(session.studentId);
      setChatInput("");
      setChatAttachment(null);
    } finally {
      setSending(false);
    }
  }

  function stopCamera() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function openScanner() {
    setScannerError("");
    setScanResult(null);
    setScanning(false);
    setScannerOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          requestAnimationFrame(tickScan);
        }
      }, 100);
    } catch {
      setScannerError("Camera access denied. Please allow camera permission and try again.");
    }
  }

  function closeScanner() {
    stopCamera();
    setScannerOpen(false);
    setScannerError("");
    setScanResult(null);
    setScanning(false);
  }

  function tickScan() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(tickScan);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
    if (code?.data) {
      handleQrDetected(code.data);
    } else {
      animFrameRef.current = requestAnimationFrame(tickScan);
    }
  }

  async function handleQrDetected(token) {
    stopCamera();
    setScanning(true);
    setScannerError("");
    try {
      const result = await scanAttendanceQr(token);
      setScanResult({ mode: result.mode, message: result.message });
      await refreshStudentData(session.studentId);
    } catch (err) {
      setScannerError(err?.message || "QR code not recognised. Please try again.");
      setScanning(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          animFrameRef.current = requestAnimationFrame(tickScan);
        }
      } catch { /* camera restart failed */ }
    }
  }

  useEffect(() => () => stopCamera(), []);

  const student = studentData?.student;
  const mj = isMidnightJelly;

  return (
    // Full-height flex column layout — no scroll on root, content scrolls internally
    <div className={`flex h-dvh flex-col ${mj ? "bg-[#0d0d1a]" : "bg-slate-50"}`}>

      {/* ── FIXED HEADER + TABS ── */}
      <div className={`shrink-0 border-b px-4 pb-3 pt-4 sm:px-6 ${mj ? "border-slate-800" : "border-slate-200"}`}>
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className={`truncate text-base font-extrabold ${mj ? "text-white" : "text-slate-900"}`}>
                {session?.name || "Student"}
              </h1>
              <p className={`truncate text-xs font-medium ${mj ? "text-slate-400" : "text-slate-500"}`}>
                {studentData?.library?.name || "Library"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {/* Dark mode toggle */}
              <button
                onClick={toggleMidnightJelly}
                title={mj ? "Switch to light mode" : "Switch to dark mode"}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                  mj
                    ? "bg-slate-700 text-amber-400 hover:bg-slate-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {mj ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Button
                className={`h-8 px-2.5 text-xs font-bold ${mj ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-300 text-slate-700 hover:bg-white"}`}
                onClick={() => navigate("/student/profile")}
                variant="outline"
              >
                <UserRound className="mr-1 h-3.5 w-3.5" />
                Profile
              </Button>
              <Button
                className={`h-8 px-2.5 text-xs font-bold ${mj ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-300 text-slate-700 hover:bg-white"}`}
                onClick={logout}
                variant="outline"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className={`flex rounded-2xl p-1 ${mj ? "bg-slate-800" : "bg-slate-200/70"}`}>
            <button
              onClick={() => setActiveTab("home")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-all ${
                activeTab === "home"
                  ? mj ? "bg-slate-700 text-emerald-400 shadow-sm" : "bg-white text-emerald-700 shadow-sm"
                  : mj ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-all ${
                activeTab === "chat"
                  ? mj ? "bg-slate-700 text-emerald-400 shadow-sm" : "bg-white text-emerald-700 shadow-sm"
                  : mj ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              Chat
              {unreadCount > 0 && activeTab !== "chat" ? (
                <span className="absolute right-3 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT AREA ── */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-2xl px-4 sm:px-6">

          {/* ── HOME TAB ── */}
          {activeTab === "home" ? (
            <div className="h-full overflow-y-auto">
              <div className="space-y-4 pb-8 pt-4">

                {/* Shift warning */}
                <LiveShiftWarning mj={mj} student={student} />

                {/* Seat change pending banner */}
                {studentData?.pendingSeatChangeRequest ? (
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${
                    mj ? "border-amber-800 bg-amber-900/20 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}>
                    <span className="font-semibold">Seat change pending:</span> You requested Seat {studentData.pendingSeatChangeRequest.requestedSeatNumber}. Waiting for librarian approval.
                  </div>
                ) : null}

                {/* Status Card */}
                <div className={`rounded-3xl p-6 text-white ${
                  student?.currentlyInLibrary
                    ? "bg-emerald-600 shadow-xl shadow-emerald-600/30"
                    : mj ? "bg-slate-700 shadow-xl shadow-black/30" : "bg-slate-700 shadow-xl shadow-slate-700/20"
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/80">
                        {student?.currentlyInLibrary ? "Currently Inside" : "Currently Outside"}
                      </p>
                      <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                        {student?.currentlyInLibrary ? "Checked In" : "Checked Out"}
                      </p>
                      {student?.currentlyInLibrary ? <LiveAttendanceValue student={student} /> : null}
                    </div>
                    <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
                      <Clock className="h-7 w-7" />
                    </div>
                  </div>
                </div>

                {/* Check In / Out Button */}
                <button
                  onClick={openScanner}
                  className={`flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-lg transition active:scale-[0.98] ${
                    student?.currentlyInLibrary
                      ? "bg-linear-to-r from-rose-500 to-pink-500 shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600"
                      : "bg-linear-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
                  }`}
                >
                  {student?.currentlyInLibrary ? <LogOutIcon className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                  {student?.currentlyInLibrary ? "Check Out — Scan QR" : "Check In — Scan QR"}
                  <ScanLine className="h-4 w-4 opacity-70" />
                </button>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard
                    label="Seat Number"
                    value={student?.seatNumber ? `Seat ${student.seatNumber}` : "Not assigned"}
                    icon={Armchair}
                    accent={student?.seatNumber ? "text-emerald-600" : "text-slate-400"}
                    iconBg={student?.seatNumber ? "bg-emerald-100" : "bg-slate-100"}
                    mj={mj}
                  />
                  <InfoCard
                    label="Shift"
                    value={student?.shiftTiming || student?.shift || "Full Day"}
                    icon={Clock}
                    accent="text-sky-600"
                    iconBg="bg-sky-100"
                    mj={mj}
                  />
                  <InfoCard
                    label="Attendance"
                    value={student?.totalAttendance != null ? `${student.totalAttendance} days` : "—"}
                    icon={CalendarCheck}
                    accent="text-violet-600"
                    iconBg="bg-violet-100"
                    mj={mj}
                  />
                  <InfoCard
                    label="Fee Status"
                    value={student?.feeStatus || "—"}
                    icon={CheckCircle2}
                    accent={student?.feeStatus === "paid" ? "text-emerald-600" : "text-amber-600"}
                    iconBg={student?.feeStatus === "paid" ? "bg-emerald-100" : "bg-amber-100"}
                    mj={mj}
                  />
                </div>

                {/* Seat change button */}
                {student?.seatNumber ? (
                  <button
                    onClick={() => { setSeatModalOpen(true); setSeatNumberInput(""); setSeatError(""); setSeatSuccess(false); }}
                    className={`w-full rounded-2xl border-2 px-4 py-3 text-sm font-bold transition hover:opacity-90 active:scale-[0.98] ${
                      mj
                        ? "border-emerald-700 bg-slate-800 text-emerald-400"
                        : "border-emerald-300 bg-white text-emerald-700 shadow-sm hover:bg-emerald-50"
                    }`}
                  >
                    <Armchair className="mr-2 inline h-4 w-4" />
                    {studentData?.pendingSeatChangeRequest ? "Seat Change Pending…" : "Request Seat Change"}
                  </button>
                ) : null}

                {seatSuccess ? (
                  <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    mj ? "border-emerald-800 bg-emerald-900/20 text-emerald-400" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}>
                    Seat change request submitted! Waiting for librarian approval.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* ── CHAT TAB ── */}
          {activeTab === "chat" ? (
            <div className="flex h-full flex-col overflow-hidden pt-3 pb-3">
              <div className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border ${
                mj
                  ? "border-white/10 bg-white/10 shadow-[0_24px_80px_rgba(14,10,28,0.38)]"
                  : "border-slate-200/70 bg-white/80 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]"
              }`}>
                {/* Chat Header */}
                <div className={`shrink-0 flex items-center justify-between border-b px-5 py-4 ${mj ? "border-white/10 bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-400/10" : "border-slate-200/60 bg-gradient-to-r from-emerald-50/60 via-white to-teal-50/60"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-md ${mj ? "bg-linear-to-br from-violet-500 to-cyan-400 shadow-violet-500/25" : "bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25"}`}>
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className={`font-display text-base font-extrabold tracking-tight ${mj ? "text-violet-50" : "text-slate-900"}`}>Library Chat</h2>
                      <p className={`text-xs font-medium ${mj ? "text-violet-100/70" : "text-slate-500"}`}>
                        {chatMessages.length} {chatMessages.length === 1 ? "message" : "messages"}
                      </p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${mj ? "bg-cyan-400/10 text-cyan-100" : "bg-emerald-50 text-emerald-700"}`}>
                    <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${mj ? "bg-cyan-300" : "bg-emerald-500"}`} />
                    Live
                  </span>
                </div>

                {/* Messages */}
                <div className={`min-h-0 flex-1 overflow-y-auto p-4 ${mj ? "bg-gradient-to-b from-[#140f24]/40 to-[#0a0913]/40" : "bg-gradient-to-b from-slate-50/60 to-white/40"}`}>
                  {chatMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-3xl ${mj ? "bg-violet-500/10" : "bg-emerald-50"}`}>
                        <MessageCircle className={`h-7 w-7 ${mj ? "text-violet-200" : "text-emerald-500"}`} />
                      </div>
                      <p className={`mt-4 text-sm font-bold ${mj ? "text-violet-50" : "text-slate-700"}`}>No messages yet</p>
                      <p className={`mt-1 text-xs ${mj ? "text-violet-100/60" : "text-slate-400"}`}>Start the conversation by sending a message below</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((message) => {
                        const isOwnMessage = message.senderName === session?.name;
                        const isAdminMessage = message.senderRole === "admin";
                        return (
                          <div key={message.id} className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                            {!isOwnMessage && (
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white shadow-sm ${
                                isAdminMessage
                                  ? mj ? "bg-linear-to-br from-fuchsia-500 to-violet-500" : "bg-linear-to-br from-amber-500 to-orange-600"
                                  : mj ? "bg-linear-to-br from-slate-600 to-slate-800" : "bg-linear-to-br from-slate-500 to-slate-700"
                              }`}>
                                {getInitials(message.senderName)}
                              </div>
                            )}
                            <div className={`max-w-[82%] sm:max-w-[75%] flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                              {!isOwnMessage && (
                                <p className={`mb-1 px-2 text-[10px] font-extrabold uppercase tracking-wider ${
                                  isAdminMessage ? (mj ? "text-fuchsia-200" : "text-amber-600") : (mj ? "text-violet-100/55" : "text-slate-500")
                                }`}>
                                  {getSenderLabel(message)}
                                </p>
                              )}
                              <div className={`rounded-3xl px-4 py-2.5 shadow-sm ${
                                isOwnMessage
                                  ? mj
                                    ? "rounded-br-md bg-linear-to-br from-violet-500 to-cyan-400 text-white shadow-violet-500/20"
                                    : "rounded-br-md bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20"
                                  : mj
                                    ? "rounded-bl-md border border-white/10 bg-white/10 text-violet-50"
                                    : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                              }`}>
                                {message.message ? (
                                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                    {renderLinkedMessage(message.message)}
                                  </p>
                                ) : null}
                                {message.attachmentUrl ? (
                                  <div className={message.message ? "mt-2" : ""}>
                                    {message.attachmentType === "image" ? (
                                      <a href={resolveAssetUrl(message.attachmentUrl)} rel="noreferrer" target="_blank">
                                        <img
                                          alt={message.attachmentName || "Chat attachment"}
                                          className="max-h-56 w-full rounded-2xl border border-white/20 object-cover"
                                          src={resolveAssetUrl(message.attachmentUrl)}
                                        />
                                      </a>
                                    ) : (
                                      <a
                                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                                          isOwnMessage
                                            ? "bg-white/20 text-white hover:bg-white/30"
                                            : mj
                                              ? "border border-white/10 bg-white/10 text-cyan-100 hover:bg-white/15"
                                              : "border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        }`}
                                        href={resolveAssetUrl(message.attachmentUrl)}
                                        rel="noreferrer"
                                        target="_blank"
                                      >
                                        <Paperclip className="h-3.5 w-3.5" />
                                        {message.attachmentName || "Open attachment"}
                                      </a>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                              <span className={`mt-1 px-2 text-[10px] font-medium ${mj ? "text-violet-100/45" : "text-slate-400"}`}>
                                {formatChatTime(message.createdAt)}
                              </span>
                            </div>
                            {isOwnMessage && (
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white shadow-sm ${
                                mj ? "bg-linear-to-br from-violet-500 to-cyan-400" : "bg-linear-to-br from-emerald-500 to-teal-600"
                              }`}>
                                {getInitials(session?.name)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className={`shrink-0 border-t px-4 py-3 backdrop-blur ${mj ? "border-white/10 bg-[#120f23]/70" : "border-slate-200/60 bg-white/80"}`}>
                  {!studentData?.student.chatEnabled ? (
                    <div className={`rounded-2xl px-4 py-3 text-center text-xs font-bold ${mj ? "bg-rose-400/10 text-rose-100" : "bg-rose-50 text-rose-600"}`}>
                      Admin has removed your chat access.
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage}>
                      {chatAttachment && (
                        <div className={`mb-3 flex items-center justify-between rounded-2xl border px-3 py-2 ${mj ? "border-cyan-300/20 bg-cyan-400/10" : "border-emerald-200 bg-emerald-50"}`}>
                          <div className={`flex min-w-0 items-center gap-2 text-xs font-bold ${mj ? "text-cyan-100" : "text-emerald-700"}`}>
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{chatAttachment.name}</span>
                            <span className={`shrink-0 ${mj ? "text-cyan-100/70" : "text-emerald-500"}`}>· {formatFileSize(chatAttachment.size || 0)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setChatAttachment(null)}
                            className={`ml-2 shrink-0 rounded-lg p-1 ${mj ? "text-cyan-100 hover:bg-white/10" : "text-emerald-700 hover:bg-emerald-100"}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border transition ${mj ? "border-white/10 bg-white/10 text-violet-100/70 hover:border-violet-300/30 hover:bg-white/15 hover:text-violet-50" : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"}`}>
                          <Paperclip className="h-4 w-4" />
                          <input className="hidden" type="file" onChange={(event) => setChatAttachment(event.target.files?.[0] || null)} />
                        </label>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(event) => setChatInput(event.target.value)}
                          placeholder="Type a message…"
                          className={`h-11 min-w-0 flex-1 rounded-2xl border px-4 text-sm outline-none transition-all ${mj ? "border-white/10 bg-white/5 text-violet-50 placeholder:text-violet-100/45 focus:border-violet-300 focus:bg-white/10 focus:ring-4 focus:ring-violet-400/15" : "border-slate-200 bg-slate-50 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"}`}
                        />
                        <button
                          type="submit"
                          disabled={sending || (!chatInput.trim() && !chatAttachment)}
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-all disabled:opacity-50 disabled:shadow-none active:scale-95 ${mj ? "bg-linear-to-br from-violet-500 to-cyan-400 shadow-violet-500/25 hover:brightness-110 hover:shadow-lg hover:shadow-violet-500/35" : "bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-500/35"}`}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ) : null}

        </div>
      </div>

      {/* ── QR Scanner Modal ── */}
      {scannerOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20">
                <Camera className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {student?.currentlyInLibrary ? "Check Out" : "Check In"}
                </p>
                <p className="text-[11px] text-slate-400">Point camera at the library QR code</p>
              </div>
            </div>
            <button onClick={closeScanner} className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            {!scanResult && !scanning && !scannerError ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-64 w-64">
                  <span className="absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-emerald-400" />
                  <span className="absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-emerald-400" />
                  <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-emerald-400" />
                  <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-emerald-400" />
                  <div className="absolute inset-x-4 animate-[scanline_2s_ease-in-out_infinite]" style={{ top: "50%", height: "2px", background: "linear-gradient(90deg,transparent,#34d399,transparent)" }} />
                </div>
              </div>
            ) : null}

            {scanning ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                <p className="mt-4 text-sm font-semibold text-white">Processing…</p>
              </div>
            ) : null}

            {(scanResult || scannerError) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-8 backdrop-blur-sm">
                {scanResult ? (
                  <>
                    <div className={`flex h-20 w-20 items-center justify-center rounded-full ${scanResult.mode === "check-in" ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                      {scanResult.mode === "check-in"
                        ? <LogIn className="h-10 w-10 text-emerald-400" />
                        : <LogOutIcon className="h-10 w-10 text-rose-400" />}
                    </div>
                    <p className="mt-5 text-2xl font-extrabold text-white">{scanResult.message}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {scanResult.mode === "check-in" ? "Welcome! Have a productive session." : "See you next time!"}
                    </p>
                    <button onClick={closeScanner} className="mt-8 rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-700">
                      Done
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20">
                      <AlertCircle className="h-10 w-10 text-rose-400" />
                    </div>
                    <p className="mt-5 text-center text-sm font-semibold text-white">{scannerError}</p>
                    <button onClick={closeScanner} className="mt-8 rounded-2xl bg-rose-600 px-8 py-3 text-sm font-bold text-white hover:bg-rose-700">
                      Close
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── Seat Change Modal ── */}
      {seatModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setSeatModalOpen(false)}
        >
          <div
            className={`w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl ${mj ? "bg-slate-800" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 p-6 text-white">
              <button
                type="button"
                onClick={() => setSeatModalOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/20 p-3">
                  <Armchair className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/80">Current seat</p>
                  <h3 className="text-2xl font-extrabold">Seat {studentData?.student?.seatNumber}</h3>
                </div>
              </div>
            </div>

            <form className="p-6" onSubmit={handleSeatChangeRequest}>
              <label className={`text-xs font-bold uppercase tracking-wider ${mj ? "text-slate-400" : "text-slate-600"}`}>
                New seat number
              </label>
              <input
                type="number"
                autoFocus
                autoComplete="off"
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
                  mj
                    ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-400 focus:bg-white"
                }`}
                placeholder="Enter seat number"
                value={seatNumberInput}
                onChange={(e) => { setSeatNumberInput(e.target.value); setSeatError(""); }}
              />

              <label className={`mt-4 block text-xs font-bold uppercase tracking-wider ${mj ? "text-slate-400" : "text-slate-600"}`}>
                Reason <span className={`font-normal ${mj ? "text-slate-500" : "text-slate-400"}`}>(optional)</span>
              </label>
              <textarea
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                  mj
                    ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    : "border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-400 focus:bg-white"
                }`}
                rows={2}
                placeholder="e.g. better lighting, near window…"
                value={seatReason}
                onChange={(e) => setSeatReason(e.target.value)}
              />

              {seatError ? (
                <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                  {seatError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={seatSubmitting || !seatNumberInput.trim()}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
              >
                {seatSubmitting ? "Submitting…" : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({ label, value, icon: Icon, accent, iconBg, mj }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${mj ? "border-slate-700 bg-slate-800/80" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-wide ${mj ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
          <p className={`mt-1.5 truncate text-sm font-extrabold ${accent}`}>{value}</p>
        </div>
        <div className={`shrink-0 rounded-xl p-2 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </div>
  );
}
