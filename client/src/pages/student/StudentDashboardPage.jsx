import { Paperclip, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
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
  if (!student?.shiftEndTime || student.fullDay) {
    return null;
  }

  const match = String(student.shiftEndTime).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3].toUpperCase() === "PM") {
    hours += 12;
  }

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
  if (!student?.currentlyInLibrary) {
    return null;
  }

  const shiftEndDate = getShiftEndDate(student);
  if (!shiftEndDate) {
    return null;
  }

  const remainingMs = shiftEndDate.getTime() - Date.now();
  if (remainingMs <= 0) {
    return "Your shift has ended. Please check out now.";
  }

  if (remainingMs > SHIFT_END_WARNING_MS) {
    return null;
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Your shift will end in ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s.`;
}

export function StudentDashboardPage() {
  const { fetchChatMessages, logout, refreshStudentData, sendChatMessage, session, studentData, subscribeToLibraryEvents } = useAuth();
  const navigate = useNavigate();
  const [chatMessages, setChatMessages] = useState(studentData?.chatMessages || []);
  const [chatInput, setChatInput] = useState("");
  const [chatAttachment, setChatAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [, setTimerTick] = useState(0);

  useEffect(() => {
    setChatMessages(studentData?.chatMessages || []);
  }, [studentData]);

  const loadMessages = useCallback(async () => {
    if (!session?.studentId) {
      return;
    }

    const messages = await fetchChatMessages();
    setChatMessages(messages);
    await refreshStudentData(session.studentId);
  }, [fetchChatMessages, refreshStudentData, session]);

  useEffect(() => {
    if (!session?.studentId) {
      return;
    }

    loadMessages().catch(() => {});
  }, [loadMessages, session?.studentId]);

  useEffect(() => {
    if (!session?.studentId) {
      return () => {};
    }

    return subscribeToLibraryEvents({
      onAccessUpdate: async () => {
        await loadMessages();
      },
      onMessage: async () => {
        await loadMessages();
      },
    });
  }, [loadMessages, session?.studentId, subscribeToLibraryEvents]);

  useEffect(() => {
    const interval = window.setInterval(() => setTimerTick((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  async function handleSendMessage(event) {
    event.preventDefault();
    if ((!chatInput.trim() && !chatAttachment) || !studentData?.student.chatEnabled) {
      return;
    }

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

  const student = studentData?.student;
  const attendanceDisplay = getAttendanceDisplay(student);
  const shiftWarning = getShiftWarning(student);

  return (
    <div className="min-h-screen bg-[#f3fbf5]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex justify-end gap-2">
          <Button onClick={() => navigate("/student/profile")} variant="outline">
            <UserRound className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>

        <Card className="h-[calc(100vh-10rem)] overflow-hidden rounded-[2rem]">
          <CardContent className="flex h-full flex-col p-0">
            <div className={`flex items-center justify-between px-5 py-3 text-sm ${shiftWarning ? "bg-rose-50 text-rose-700" : "bg-[#e4f3e8] text-slate-700"}`}>
              <div>
                <p className={`font-semibold ${shiftWarning ? "text-rose-700" : "text-slate-900"}`}>
                  {student?.currentlyInLibrary ? "Checked In" : "Checked Out"}
                </p>
                <p className={shiftWarning ? "text-rose-600" : "text-slate-500"}>
                  {student?.currentlyInLibrary ? `Live timer ${attendanceDisplay}` : `Shift ${attendanceDisplay}`}
                </p>
              </div>
              {shiftWarning ? <p className="text-right text-xs font-semibold text-rose-600">{shiftWarning}</p> : null}
            </div>
            <div className="flex-1 bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fafc_100%)] p-4">
              <div className="h-full space-y-3 overflow-y-auto px-1 py-2">
                {chatMessages.map((message) => {
                  const isOwnMessage = message.senderName === session?.name;
                  const isAdminMessage = message.senderRole === "admin";

                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[82%] rounded-[22px] px-4 py-3 shadow-sm ${
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
              </div>
            </div>

            <form className="bg-[#edf7ef] p-4" onSubmit={handleSendMessage}>
              <div className="flex items-center gap-3">
                <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
                  <Paperclip className="h-5 w-5" />
                  <input className="hidden" type="file" onChange={(event) => setChatAttachment(event.target.files?.[0] || null)} />
                </label>
                <Input
                  className="h-11 flex-1 rounded-full border-slate-200 bg-slate-50 px-4"
                  placeholder={studentData?.student.chatEnabled ? "Type a message" : "Chat access removed by admin"}
                  disabled={!studentData?.student.chatEnabled}
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                />
                <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700" disabled={sending || !studentData?.student.chatEnabled} type="submit">
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
              {!studentData?.student.chatEnabled ? (
                <p className="mt-2 text-xs text-rose-600">Admin has removed your ability to send messages in library chat.</p>
              ) : null}
              {chatAttachment ? <p className="mt-2 text-xs text-slate-500">Attached: {chatAttachment.name} • {formatFileSize(chatAttachment.size || 0)} • limit {formatFileSize(MAX_ATTACHMENT_SIZE)}</p> : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
