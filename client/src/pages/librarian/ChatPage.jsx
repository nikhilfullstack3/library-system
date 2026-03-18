import { Paperclip } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../context/AuthContext";
import { API_ORIGIN } from "../../lib/api";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

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

export function ChatPage() {
  const { fetchChatMessages, libraryData, refreshLibraryData, sendChatMessage, session, subscribeToLibraryEvents, updateChatAccess } = useAuth();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [updatingParticipantId, setUpdatingParticipantId] = useState("");

  const loadMessages = useCallback(async () => {
    const messages = await fetchChatMessages();
    setChatMessages(messages);
  }, [fetchChatMessages]);

  useEffect(() => {
    loadMessages().catch(() => {});
  }, [loadMessages]);

  useEffect(() => {
    return subscribeToLibraryEvents({
      onAccessUpdate: async () => {
        await refreshLibraryData();
        await loadMessages();
      },
      onMessage: async () => {
        await loadMessages();
      },
    });
  }, [loadMessages, refreshLibraryData, subscribeToLibraryEvents]);

  const currentParticipant = (libraryData?.librarians || []).find((item) => item.id === session?.librarianId);
  const chatAllowed = currentParticipant?.chatEnabled ?? true;

  async function handleSend(event) {
    event.preventDefault();
    if ((!chatInput.trim() && !attachment) || !chatAllowed) {
      return;
    }

    setSending(true);
    try {
      if (attachment?.size > MAX_ATTACHMENT_SIZE) {
        window.alert(`Please upload a file smaller than ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`);
        return;
      }

      await sendChatMessage({
        message: chatInput.trim() || (attachment?.name ? `Shared ${attachment.name}` : ""),
        tag: "",
        attachment,
      });
      await loadMessages();
      setChatInput("");
      setAttachment(null);
    } finally {
      setSending(false);
    }
  }

  async function handleToggleChatAccess(participantType, participantId, nextChatEnabled) {
    setUpdatingParticipantId(`${participantType}-${participantId}`);
    try {
      await updateChatAccess(participantType, participantId, nextChatEnabled);
      await refreshLibraryData();
      await loadMessages();
    } finally {
      setUpdatingParticipantId("");
    }
  }

  function handleSenderClick(message) {
    if (session?.role !== "admin") {
      return;
    }

    const participantType = message.senderRole === "student" ? "student" : "librarian";
    const participantList = participantType === "student" ? libraryData?.students || [] : libraryData?.librarians || [];
    const participant =
      participantList.find((item) => item.id === message.senderId) ||
      participantList.find((item) => item.name === message.senderName);

    if (!participant || participant.id === session?.librarianId || updatingParticipantId) {
      return;
    }

    const nextChatEnabled = !participant.chatEnabled;
    const confirmed = window.confirm(
      nextChatEnabled
        ? `Restore ${participant.name} to library chat?`
        : `Remove ${participant.name} from library chat?`
    );

    if (!confirmed) {
      return;
    }

    handleToggleChatAccess(participantType, participant.id, nextChatEnabled);
  }

  return (
    <Card className="h-[calc(100vh-10rem)] overflow-hidden rounded-[2rem]">
      <CardContent className="flex h-full flex-col p-0">
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
                      <button
                        className={`text-left text-xs font-semibold ${isAdminMessage ? "text-emerald-600" : "text-emerald-700"} ${
                          session?.role === "admin" ? "cursor-pointer underline decoration-emerald-300 underline-offset-4" : ""
                        }`}
                        disabled={session?.role !== "admin" || Boolean(updatingParticipantId)}
                        onClick={() => handleSenderClick(message)}
                        type="button"
                      >
                        {getSenderLabel(message)}
                      </button>
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

        <form className="bg-[#edf7ef] p-4" onSubmit={handleSend}>
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
          {attachment ? <p className="mt-2 text-xs text-slate-500">Attached: {attachment.name} • {formatFileSize(attachment.size || 0)} • limit {formatFileSize(MAX_ATTACHMENT_SIZE)}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
