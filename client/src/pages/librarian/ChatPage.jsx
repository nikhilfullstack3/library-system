import { MessageCircleMore, Paperclip } from "lucide-react";
import { useEffect, useState } from "react";
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

export function ChatPage() {
  const { fetchChatMessages, libraryData, sendChatMessage, session, updateChatAccess } = useAuth();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const messages = await fetchChatMessages();
      if (active) {
        setChatMessages(messages);
      }
    }

    load();
    const intervalId = window.setInterval(load, 10000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [fetchChatMessages]);

  async function handleSend(event) {
    event.preventDefault();
    if (!chatInput.trim() || !chatAllowed) {
      return;
    }

    setSending(true);
    try {
      await sendChatMessage({
        message: chatInput.trim(),
        tag: "",
        attachment,
      });
      setChatMessages(await fetchChatMessages());
      setChatInput("");
      setAttachment(null);
    } finally {
      setSending(false);
    }
  }

  const participants = [
    ...(libraryData?.librarians || []).map((item) => ({ ...item, participantType: "librarian" })),
    ...(libraryData?.students || []).map((item) => ({ ...item, participantType: "student" })),
  ];
  const currentParticipant = (libraryData?.librarians || []).find((item) => item.id === session?.librarianId);
  const chatAllowed = currentParticipant?.chatEnabled ?? true;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageCircleMore className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Library Chat</CardTitle>
              <p className="text-sm text-slate-500">Admin and staff chat with everyone in the same library.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fafc_100%)] p-3">
            <div className="max-h-[520px] space-y-3 overflow-y-auto px-1 py-2">
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

          <form className="border-t border-slate-100 bg-white p-4" onSubmit={handleSend}>
            <div className="flex items-center gap-3">
              <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
                <Paperclip className="h-5 w-5" />
                <input className="hidden" type="file" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
              </label>
              <Input
                className="h-11 flex-1 rounded-full border-slate-200 bg-slate-50 px-4"
                disabled={!chatAllowed}
                placeholder={chatAllowed ? "Type a message" : "Chat access removed by admin"}
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
              />
              <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700" disabled={sending || !chatAllowed} type="submit">
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
            {!chatAllowed ? <p className="mt-2 text-xs text-rose-600">Admin has removed your chat access.</p> : null}
            {attachment ? <p className="mt-2 text-xs text-slate-500">Attached: {attachment.name}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Chat Access</CardTitle>
          <p className="text-sm text-slate-500">Only admin can remove or restore a user from library chat.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {participants.map((participant) => {
            const isCurrentAdmin = participant.id === session?.librarianId;
            const canModerate = session?.role === "admin" && !isCurrentAdmin;

            return (
              <div key={`${participant.participantType}-${participant.id}`} className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{participant.name}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    {participant.participantType} {participant.role ? `• ${participant.role}` : ""}
                  </p>
                </div>
                {canModerate ? (
                  <Button
                    size="sm"
                    variant={participant.chatEnabled ? "destructive" : "outline"}
                    onClick={() =>
                      updateChatAccess(participant.participantType, participant.id, !participant.chatEnabled)
                    }
                  >
                    {participant.chatEnabled ? "Remove" : "Restore"}
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500">{participant.chatEnabled ? "Active" : "Removed"}</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
