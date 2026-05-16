"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Send, Trash2 } from "lucide-react";
import { ROLE_LABELS } from "@/types/enums";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
};

export function CommentsThread({
  projectId,
  comments,
  currentUserId,
  currentUserRole,
}: {
  projectId: string;
  comments: Comment[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  async function postComment() {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) {
        setText("");
        router.refresh();
      }
    } finally {
      setPosting(false);
    }
  }

  async function deleteComment(commentId: string) {
    await fetch(`/api/projects/${projectId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    router.refresh();
  }

  const roleLabel = (role: string) =>
    ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;

  const roleBg = (role: string) => {
    if (role === "PMO_LEAD") return "bg-[#1a1f5e] text-white";
    if (role === "PMO_TEAM") return "bg-[#3d2d8e] text-white";
    return "bg-[#f4f5fb] text-[#1a1f5e]";
  };

  return (
    <div className="space-y-4">
      {comments.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No updates yet. Be the first to post.</p>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {comments.map((c) => {
          const isOwn = c.user.id === currentUserId;
          return (
            <div key={c.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-700 flex-shrink-0 ${roleBg(c.user.role)}`}>
                {c.user.name.charAt(0)}
              </div>
              <div className={`flex-1 min-w-0 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`flex items-center gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <span className="text-xs font-600 text-gray-800">{c.user.name}</span>
                  <span className="text-[10px] text-gray-400">{roleLabel(c.user.role)}</span>
                  <span className="text-[10px] text-gray-400">·</span>
                  <span className="text-[10px] text-gray-400">{format(new Date(c.createdAt), "MMM d, h:mm a")}</span>
                </div>
                <div className={`group relative rounded-xl px-3 py-2 text-sm max-w-sm ${isOwn ? "bg-[#1a1f5e] text-white rounded-tr-sm" : "bg-[#f4f5fb] text-gray-800 rounded-tl-sm"}`}>
                  {c.content}
                  {(isOwn || currentUserRole === "PMO_LEAD") && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="absolute -top-2 -right-2 hidden group-hover:flex w-5 h-5 rounded-full bg-red-100 text-red-500 items-center justify-center hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compose */}
      <div className="flex gap-2 pt-2 border-t border-[#e2e4f0]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); } }}
          placeholder="Add an update or question... (Enter to send)"
          rows={2}
          className="flex-1 text-sm border border-[#e2e4f0] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20"
        />
        <button
          onClick={postComment}
          disabled={posting || !text.trim()}
          className="flex-shrink-0 w-9 h-9 mt-auto rounded-lg bg-[#1a1f5e] text-white flex items-center justify-center hover:bg-[#12174a] disabled:opacity-40 transition-colors"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
