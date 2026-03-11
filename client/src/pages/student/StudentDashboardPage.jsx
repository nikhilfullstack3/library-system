import { MessageCircleMore, Paperclip, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../context/AuthContext";

function formatChatTime(value) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getSenderLabel(message) {
  return message.senderRole === "admin" ? `${message.senderName} (Admin)` : message.senderName;
}

export function StudentDashboardPage() {
  const {
    fetchChatMessages,
    logout,
    refreshStudentData,
    sendChatMessage,
    session,
    studentData,
  } = useAuth();
  const navigate = useNavigate();
  const [chatMessages, setChatMessages] = useState(studentData?.chatMessages || []);
  const [chatInput, setChatInput] = useState("");
  const [chatAttachment, setChatAttachment] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setChatMessages(studentData?.chatMessages || []);
  }, [studentData]);

  useEffect(() => {
    if (!session?.studentId) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      const messages = await fetchChatMessages();
      setChatMessages(messages);
      await refreshStudentData(session.studentId);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [fetchChatMessages, refreshStudentData, session]);

  async function handleSendMessage(event) {
    event.preventDefault();
    if (!chatInput.trim() || !studentData?.student.chatEnabled) {
      return;
    }

    setSending(true);
    try {
      await sendChatMessage({
        message: chatInput.trim(),
        tag: "",
        attachment: chatAttachment,
      });
      const messages = await fetchChatMessages();
      setChatMessages(messages);
      setChatInput("");
      setChatAttachment(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3fbf5]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden rounded-3xl">
          <CardHeader className="border-b border-emerald-100 bg-[radial-gradient(circle_at_top,#f8fff9_0%,#eff8f2_44%,#e6f4ea_100%)]">
            <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100/80 bg-white/50 px-5 py-5 shadow-[0_16px_44px_rgba(22,101,52,0.08)]">
              <div className="absolute -left-6 top-0 h-24 w-24 rounded-full bg-emerald-200/40 blur-2xl" />
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-lime-100/70 blur-3xl" />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center justify-center gap-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700 shadow-sm">
                  <MessageCircleMore className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                      Student Chat
                    </p>
                    <CardTitle className="mt-2 bg-[linear-gradient(135deg,#0f5132_0%,#2d7a4f_50%,#5c9c67_100%)] bg-clip-text text-3xl tracking-tight text-transparent sm:text-4xl">
                      {studentData?.student?.library?.name || "Your Library"}
                    </CardTitle>
                    <p className="mt-2 text-sm text-slate-600">
                      {session?.name} • Library chat only for now
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button className="border-white/90 bg-white/80 shadow-sm backdrop-blur" onClick={() => navigate("/student/profile")} variant="outline">
                    <UserRound className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button className="border-white/90 bg-white/80 shadow-sm backdrop-blur" onClick={logout} variant="outline">
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fafc_100%)] p-3">
              <div className="mx-auto mb-3 w-fit rounded-full bg-white/90 px-3 py-1 text-xs text-slate-500 shadow-sm">
                Only users from your library can see these messages
              </div>
              <div className="max-h-[70vh] space-y-3 overflow-y-auto px-1 py-2">
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
                        <p className={`mt-1.5 whitespace-pre-wrap text-sm leading-6 ${isAdminMessage ? "text-emerald-700" : ""}`}>{message.message}</p>
                        {message.attachmentUrl ? (
                          <div className="mt-3">
                            {message.attachmentType === "image" ? (
                              <img
                                alt={message.attachmentName || "Chat attachment"}
                                className="max-h-56 rounded-2xl border border-slate-200 object-cover"
                                src={`http://127.0.0.1:5001${message.attachmentUrl}`}
                              />
                            ) : (
                              <a
                                className="inline-flex rounded-xl border border-emerald-100 bg-white/80 px-3 py-2 text-sm text-emerald-700"
                                href={`http://127.0.0.1:5001${message.attachmentUrl}`}
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

            <form className="border-t border-slate-100 bg-white p-4" onSubmit={handleSendMessage}>
              <div className="flex items-center gap-3">
                <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
                  <Paperclip className="h-5 w-5" />
                  <input
                    className="hidden"
                    type="file"
                    onChange={(event) => setChatAttachment(event.target.files?.[0] || null)}
                  />
                </label>
                <Input
                  className="h-11 flex-1 rounded-full border-slate-200 bg-slate-50 px-4"
                  placeholder={
                    studentData?.student.chatEnabled ? "Type a message" : "Chat access removed by admin"
                  }
                  disabled={!studentData?.student.chatEnabled}
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                />
                <Button
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={sending || !studentData?.student.chatEnabled}
                  type="submit"
                >
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
              {!studentData?.student.chatEnabled ? (
                <p className="mt-2 text-xs text-rose-600">Admin has removed your ability to send messages in library chat.</p>
              ) : null}
              {chatAttachment ? <p className="mt-2 text-xs text-slate-500">Attached: {chatAttachment.name}</p> : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
