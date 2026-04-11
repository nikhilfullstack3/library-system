import { Armchair, CalendarCheck, MessageCircle, Home, Paperclip, UserRound, X, Clock, CheckCircle2, AlertCircle, ScanLine, Camera, LogIn, LogOut as LogOutIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";
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

function renderLinkedMessage(text, isAdminMessage) {
  return text.split(URL_PATTERN).map((part, index) => {
    if (part.match(URL_PATTERN)) {
      return (
        <a className="text-blue-600 underline underline-offset-4" href={part} key={`${part}-${index}`} rel="noreferrer" target="_blank">
          {part}
        </a>
      );
    }
    return (
      <span className={isAdminMessage ? "text-emerald-700" : ""} key={`${part}-${index}`}>
        {part}
      </span>
    );
  });
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
  const elapsedMs = Math.max(0, Date.now() - new Date(student.activeSessionStartedAt).getTime());
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

export function StudentDashboardPage() {
  const { fetchChatMessages, logout, refreshStudentData, requestSeatChange, scanAttendanceQr, sendChatMessage, session, studentData, subscribeToLibraryEvents } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [chatMessages, setChatMessages] = useState(studentData?.chatMessages || []);
  const [chatInput, setChatInput] = useState("");
  const [chatAttachment, setChatAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [, setTimerTick] = useState(0);
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [seatNumberInput, setSeatNumberInput] = useState("");
  const [seatReason, setSeatReason] = useState("");
  const [seatSubmitting, setSeatSubmitting] = useState(false);
  const [seatError, setSeatError] = useState("");
  const [seatSuccess, setSeatSuccess] = useState(false);
  // QR scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanResult, setScanResult] = useState(null); // { mode, message }
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

  // Scroll to bottom when chat tab is opened or new messages arrive
  useEffect(() => {
    if (activeTab === "chat") {
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      setUnreadCount(0);
    }
  }, [activeTab, chatMessages]);

  // Track unread messages when on home tab
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
      onAccessUpdate: async () => { await loadMessages(); },
      onMessage: async () => { await loadMessages(); },
      onSeatChangeResolved: async (payload) => {
        if (String(payload?.studentId) === String(session?.studentId)) {
          await refreshStudentData(session.studentId);
          setSeatSuccess(false);
        }
      },
    });
  }, [loadMessages, refreshStudentData, session?.studentId, subscribeToLibraryEvents]);

  useEffect(() => {
    const interval = window.setInterval(() => setTimerTick((v) => v + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      // wait for next render so videoRef is mounted
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
      // restart camera on error
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

  // cleanup on unmount
  useEffect(() => () => stopCamera(), []);

  const student = studentData?.student;
  const attendanceDisplay = getAttendanceDisplay(student);
  const shiftWarning = getShiftWarning(student);

  return (
    <div className="min-h-screen bg-[#f3fbf5]">
      <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">{session?.name || "Student"}</h1>
            <p className="text-xs text-slate-500">{studentData?.library?.name || "Library"}</p>
          </div>
          <div className="flex gap-2">
            <Button className="h-9 px-3 text-xs" onClick={() => navigate("/student/profile")} variant="outline">
              <UserRound className="mr-1.5 h-3.5 w-3.5" />
              Profile
            </Button>
            <Button className="h-9 px-3 text-xs" onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="mb-4 flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              activeTab === "home"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Home className="h-4 w-4" />
            Home
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                : "text-slate-500 hover:text-slate-700"
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

        {/* ── HOME TAB ── */}
        {activeTab === "home" ? (
          <div className="space-y-4">

            {/* Shift warning */}
            {shiftWarning ? (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {shiftWarning}
              </div>
            ) : null}

            {/* Seat change pending banner */}
            {studentData?.pendingSeatChangeRequest ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span className="font-semibold">Seat change pending:</span> You requested Seat {studentData.pendingSeatChangeRequest.requestedSeatNumber}. Waiting for librarian approval.
              </div>
            ) : null}

            {/* Status Card */}
            <div className={`rounded-3xl p-5 text-white shadow-lg ${student?.currentlyInLibrary ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20" : "bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-500/20"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/95">
                    {student?.currentlyInLibrary ? "Currently Inside" : "Currently Outside"}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {student?.currentlyInLibrary ? "Checked In" : "Checked Out"}
                  </p>
                  {student?.currentlyInLibrary ? (
                    <p className="mt-1 font-mono text-sm text-white/90">{attendanceDisplay}</p>
                  ) : null}
                </div>
                <div className={`rounded-2xl p-3 ${student?.currentlyInLibrary ? "bg-white/20" : "bg-white/10"}`}>
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Check In / Out Button */}
            <button
              onClick={openScanner}
              className={`flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-lg transition active:scale-[0.98] ${
                student?.currentlyInLibrary
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
              }`}
            >
              {student?.currentlyInLibrary ? (
                <LogOutIcon className="h-5 w-5" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
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
              />
              <InfoCard
                label="Shift"
                value={student?.shiftTiming || student?.shift || "Full Day"}
                icon={Clock}
                accent="text-sky-600"
                iconBg="bg-sky-100"
              />
              <InfoCard
                label="Attendance"
                value={student?.totalAttendance != null ? `${student.totalAttendance} days` : "—"}
                icon={CalendarCheck}
                accent="text-violet-600"
                iconBg="bg-violet-100"
              />
              <InfoCard
                label="Fee Status"
                value={student?.feeStatus || "—"}
                icon={CheckCircle2}
                accent={student?.feeStatus === "paid" ? "text-emerald-600" : "text-amber-600"}
                iconBg={student?.feeStatus === "paid" ? "bg-emerald-100" : "bg-amber-100"}
              />
            </div>

            {/* Actions */}
            {student?.seatNumber ? (
              <button
                onClick={() => { setSeatModalOpen(true); setSeatNumberInput(""); setSeatError(""); setSeatSuccess(false); }}
                className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 active:scale-[0.98]"
              >
                <Armchair className="mr-2 inline h-4 w-4" />
                {studentData?.pendingSeatChangeRequest ? "Seat Change Pending…" : "Request Seat Change"}
              </button>
            ) : null}

            {seatSuccess ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Seat change request submitted! Waiting for librarian approval.
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── CHAT TAB ── */}
        {activeTab === "chat" ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" style={{ height: "calc(100vh - 11rem)" }}>
            <div className="flex h-full flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fafc_100%)] p-4">
                <div className="space-y-3 px-1 py-2">
                  {chatMessages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-400">No messages yet. Say hello!</p>
                  ) : null}
                  {chatMessages.map((message) => {
                    const isOwnMessage = message.senderName === session?.name;
                    const isAdminMessage = message.senderRole === "admin";
                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[92%] rounded-[22px] px-4 py-3 shadow-sm sm:max-w-[82%] ${
                            isOwnMessage
                              ? "rounded-br-md bg-[#dcf8c6] text-slate-900"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                          }`}
                        >
                          {!isOwnMessage ? (
                            <p className={`text-xs font-semibold ${isAdminMessage ? "text-emerald-600" : "text-emerald-700"}`}>
                              {getSenderLabel(message)}
                            </p>
                          ) : null}
                          <p className={`mt-1.5 whitespace-pre-wrap text-sm leading-6 ${isAdminMessage ? "text-emerald-700" : ""}`}>
                            {renderLinkedMessage(message.message, isAdminMessage)}
                          </p>
                          {message.attachmentUrl ? (
                            <div className="mt-3">
                              {message.attachmentType === "image" ? (
                                <a href={resolveAssetUrl(message.attachmentUrl)} rel="noreferrer" target="_blank">
                                  <img
                                    alt={message.attachmentName || "Chat attachment"}
                                    className="max-h-56 rounded-2xl border border-slate-200 object-cover"
                                    src={resolveAssetUrl(message.attachmentUrl)}
                                  />
                                </a>
                              ) : (
                                <a
                                  className="inline-flex rounded-xl border border-emerald-100 bg-white/80 px-3 py-2 text-sm text-blue-600 underline underline-offset-4"
                                  href={resolveAssetUrl(message.attachmentUrl)}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  {message.attachmentName || "Open attachment"}
                                </a>
                              )}
                            </div>
                          ) : null}
                          <div className={`mt-2 flex justify-end gap-2 text-[11px] ${isAdminMessage ? "text-emerald-600" : "text-slate-500"}`}>
                            <span className="uppercase">{message.senderRole}</span>
                            <span>{formatChatTime(message.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>
              </div>

              {/* Input */}
              <form className="border-t border-slate-100 bg-[#edf7ef] p-4" onSubmit={handleSendMessage}>
                <div className="flex items-center gap-3">
                  <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
                    <Paperclip className="h-4 w-4" />
                    <input className="hidden" type="file" onChange={(event) => setChatAttachment(event.target.files?.[0] || null)} />
                  </label>
                  <input
                    className="h-10 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-emerald-400 focus:bg-white disabled:opacity-50"
                    placeholder={studentData?.student.chatEnabled ? "Type a message…" : "Chat access removed by admin"}
                    disabled={!studentData?.student.chatEnabled}
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={sending || !studentData?.student.chatEnabled}
                    className="flex h-10 items-center rounded-full bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {sending ? "…" : "Send"}
                  </button>
                </div>
                {!studentData?.student.chatEnabled ? (
                  <p className="mt-2 text-xs text-rose-600">Admin has removed your ability to send messages in library chat.</p>
                ) : null}
                {chatAttachment ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Attached: {chatAttachment.name} · {formatFileSize(chatAttachment.size || 0)} · limit {formatFileSize(MAX_ATTACHMENT_SIZE)}
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        ) : null}
      </div>

      {/* QR Scanner Modal */}
      {scannerOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
          {/* Header */}
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
            <button
              onClick={closeScanner}
              className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Camera / Result */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            {/* video feed */}
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan overlay */}
            {!scanResult && !scanning && !scannerError ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-64 w-64">
                  {/* Corner brackets */}
                  <span className="absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-emerald-400" />
                  <span className="absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-emerald-400" />
                  <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-emerald-400" />
                  <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-emerald-400" />
                  {/* Scan line animation */}
                  <div className="absolute inset-x-4 animate-[scanline_2s_ease-in-out_infinite]" style={{ top: "50%", height: "2px", background: "linear-gradient(90deg,transparent,#34d399,transparent)" }} />
                </div>
              </div>
            ) : null}

            {/* Processing overlay */}
            {scanning ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                <p className="mt-4 text-sm font-semibold text-white">Processing…</p>
              </div>
            ) : null}

            {/* Success / Error overlay */}
            {(scanResult || scannerError) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-8 backdrop-blur-sm">
                {scanResult ? (
                  <>
                    <div className={`flex h-20 w-20 items-center justify-center rounded-full ${scanResult.mode === "check-in" ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                      {scanResult.mode === "check-in" ? (
                        <LogIn className="h-10 w-10 text-emerald-400" />
                      ) : (
                        <LogOutIcon className="h-10 w-10 text-rose-400" />
                      )}
                    </div>
                    <p className="mt-5 text-2xl font-extrabold text-white">{scanResult.message}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {scanResult.mode === "check-in" ? "Welcome! Have a productive session." : "See you next time!"}
                    </p>
                    <button
                      onClick={closeScanner}
                      className="mt-8 rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                    >
                      Done
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20">
                      <AlertCircle className="h-10 w-10 text-rose-400" />
                    </div>
                    <p className="mt-5 text-center text-sm font-semibold text-white">{scannerError}</p>
                    <button
                      onClick={closeScanner}
                      className="mt-8 rounded-2xl bg-rose-600 px-8 py-3 text-sm font-bold text-white hover:bg-rose-700"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Seat Change Request Modal */}
      {seatModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setSeatModalOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                New seat number
              </label>
              <input
                type="number"
                autoFocus
                autoComplete="off"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
                placeholder="Enter seat number"
                value={seatNumberInput}
                onChange={(e) => { setSeatNumberInput(e.target.value); setSeatError(""); }}
              />

              <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Reason <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
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

function InfoCard({ label, value, icon: Icon, accent, iconBg }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className={`mt-1 truncate text-sm font-extrabold ${accent}`}>{value}</p>
        </div>
        <div className={`shrink-0 rounded-xl p-2 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </div>
  );
}
