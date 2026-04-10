import { MessageSquare, Paperclip, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

export function ChatPage() {
  const { fetchChatMessages, libraryData, refreshLibraryData, sendChatMessage, session, subscribeToLibraryEvents, updateChatAccess } = useAuth();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [updatingParticipantId, setUpdatingParticipantId] = useState("");
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [chatMessages]);

  const currentParticipant = (libraryData?.librarians || []).find((item) => item.id === session?.librarianId);
  const chatAllowed = currentParticipant?.chatEnabled ?? true;

  async function handleSend(event) {
    event.preventDefault();
    if ((!chatInput.trim() && !attachment) || !chatAllowed || sending) {
      return;
    }

    if (attachment?.size > MAX_ATTACHMENT_SIZE) {
      window.alert(`Please upload a file smaller than ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`);
      return;
    }

    setSending(true);
    try {
      await sendChatMessage({
        message: chatInput.trim() || (attachment?.name ? `Shared ${attachment.name}` : ""),
        tag: "",
        attachment,
      });
      await loadMessages();
      setChatInput("");
      setAttachment(null);
    } catch (error) {
      window.alert(error?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
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
    if (session?.role !== "admin") return;

    const participantType = message.senderRole === "student" ? "student" : "librarian";
    const participantList = participantType === "student" ? libraryData?.students || [] : libraryData?.librarians || [];
    const participant =
      participantList.find((item) => item.id === message.senderId) ||
      participantList.find((item) => item.name === message.senderName);

    if (!participant || participant.id === session?.librarianId || updatingParticipantId) return;

    const nextChatEnabled = !participant.chatEnabled;
    const confirmed = window.confirm(
      nextChatEnabled
        ? `Restore ${participant.name} to library chat?`
        : `Remove ${participant.name} from library chat?`
    );

    if (!confirmed) return;
    handleToggleChatAccess(participantType, participant.id, nextChatEnabled);
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-r from-emerald-50/60 via-white to-teal-50/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-slate-900">Library Chat</h2>
            <p className="text-xs font-medium text-slate-500">
              {chatMessages.length} {chatMessages.length === 1 ? "message" : "messages"}
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/60 to-white/40 p-4 sm:p-6"
      >
        {chatMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50">
              <MessageSquare className="h-7 w-7 text-emerald-500" />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-700">No messages yet</p>
            <p className="mt-1 text-xs text-slate-400">Start the conversation by sending a message below</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chatMessages.map((message) => {
              const isOwnMessage = message.senderName === session?.name;
              const isAdminMessage = message.senderRole === "admin";

              return (
                <div key={message.id} className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"} animate-fade-in-up`}>
                  {!isOwnMessage && (
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white shadow-sm ${
                      isAdminMessage
                        ? "bg-gradient-to-br from-amber-500 to-orange-600"
                        : "bg-gradient-to-br from-slate-500 to-slate-700"
                    }`}>
                      {getInitials(message.senderName)}
                    </div>
                  )}
                  <div className={`max-w-[78%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
                    {!isOwnMessage && (
                      <button
                        className={`mb-1 px-2 text-[10px] font-extrabold uppercase tracking-wider ${
                          isAdminMessage ? "text-amber-600" : "text-slate-500"
                        } ${session?.role === "admin" ? "cursor-pointer hover:underline" : "cursor-default"}`}
                        disabled={session?.role !== "admin" || Boolean(updatingParticipantId)}
                        onClick={() => handleSenderClick(message)}
                        type="button"
                      >
                        {getSenderLabel(message)}
                      </button>
                    )}
                    <div
                      className={`rounded-3xl px-4 py-2.5 shadow-sm ${
                        isOwnMessage
                          ? "rounded-br-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      {message.message && (
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {renderLinkedMessage(message.message)}
                        </p>
                      )}
                      {message.attachmentUrl ? (
                        <div className={message.message ? "mt-2" : ""}>
                          {message.attachmentType === "image" ? (
                            <a href={resolveAssetUrl(message.attachmentUrl)} rel="noreferrer" target="_blank">
                              <img
                                alt={message.attachmentName || "Chat attachment"}
                                className="max-h-56 rounded-2xl border border-white/20 object-cover"
                                src={resolveAssetUrl(message.attachmentUrl)}
                              />
                            </a>
                          ) : (
                            <a
                              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                                isOwnMessage
                                  ? "bg-white/20 text-white hover:bg-white/30"
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
                    <span className={`mt-1 px-2 text-[10px] font-medium ${isOwnMessage ? "text-slate-400" : "text-slate-400"}`}>
                      {formatChatTime(message.createdAt)}
                    </span>
                  </div>
                  {isOwnMessage && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[11px] font-extrabold text-white shadow-sm">
                      {getInitials(session?.name)}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200/60 bg-white/80 px-4 py-4 backdrop-blur sm:px-5">
        {!chatAllowed ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-center text-xs font-bold text-rose-600">
            Admin has removed your chat access.
          </div>
        ) : (
          <form onSubmit={handleSend}>
            {attachment && (
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="truncate">{attachment.name}</span>
                  <span className="text-emerald-500">· {formatFileSize(attachment.size || 0)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600">
                <Paperclip className="h-4 w-4" />
                <input
                  className="hidden"
                  type="file"
                  onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                />
              </label>
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type a message…"
                className="flex h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
              <button
                type="submit"
                disabled={sending || (!chatInput.trim() && !attachment)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-500/35 disabled:opacity-50 disabled:shadow-none active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}