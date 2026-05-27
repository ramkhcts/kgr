"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";

interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  impactScope: string | null;
  impactCost: number | null;
  impactSchedule: string | null;
  status: string;
  responseNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  submittedBy: { id: string; name: string };
  reviewedBy: { id: string; name: string } | null;
}

interface Props {
  projectId: string;
  currentUserId: string;
  currentUserRole: string;
  submittedById: string;
  projectStatus: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

const POST_SOW_STATUSES = [
  "SOW_SIGNED",
  "PO_REQUESTED",
  "PO_RECEIVED",
  "RESOURCE_ASSIGNED",
  "HANDED_TO_OPERATIONS",
];

export function ChangeRequestsPanel({
  projectId,
  currentUserId,
  currentUserRole,
  submittedById,
  projectStatus,
}: Props) {
  const router = useRouter();
  const [crs, setCRs] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit modal state
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: "",
    description: "",
    impactScope: "",
    impactCost: "",
    impactSchedule: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Review modal state
  const [reviewCR, setReviewCR] = useState<ChangeRequest | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED" | "UNDER_REVIEW">("UNDER_REVIEW");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const isPMOLead = ["PMO_LEAD", "SUPER_ADMIN"].includes(currentUserRole);
  const isClient = currentUserRole === "CLIENT";
  const canSubmit =
    isPMOLead || (isClient && submittedById === currentUserId);

  // Only render if post-SOW
  if (!POST_SOW_STATUSES.includes(projectStatus)) return null;

  const fetchCRs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/change-requests`);
      if (res.ok) {
        const data = await res.json();
        setCRs(data);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    fetchCRs();
  }, [fetchCRs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/change-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: submitForm.title,
          description: submitForm.description,
          impactScope: submitForm.impactScope || null,
          impactCost: submitForm.impactCost ? parseFloat(submitForm.impactCost) : null,
          impactSchedule: submitForm.impactSchedule || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.error ?? "Failed to submit");
        return;
      }
      setShowSubmit(false);
      setSubmitForm({ title: "", description: "", impactScope: "", impactCost: "", impactSchedule: "" });
      fetchCRs();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewCR) return;
    setReviewing(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/change-requests/${reviewCR.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: reviewStatus, responseNotes: reviewNotes || null }),
        }
      );
      if (res.ok) {
        setReviewCR(null);
        setReviewNotes("");
        setReviewStatus("UNDER_REVIEW");
        fetchCRs();
        router.refresh();
      }
    } finally {
      setReviewing(false);
    }
  }

  async function handleWithdraw(cr: ChangeRequest) {
    const res = await fetch(
      `/api/projects/${projectId}/change-requests/${cr.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WITHDRAWN" }),
      }
    );
    if (res.ok) {
      fetchCRs();
      router.refresh();
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#e2e4f0] p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-700 text-[#1a1f5e] uppercase tracking-wide">
            Change Requests
          </p>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1a1f5e] text-white text-[10px] font-700">
            {crs.length}
          </span>
        </div>
        {canSubmit && (
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1f5e] text-white text-xs font-600 hover:bg-[#3d2d8e] transition-colors"
          >
            <Plus size={13} />
            Submit Change Request
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400 py-4 text-center">Loading...</p>
      ) : crs.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No change requests yet.</p>
      ) : (
        <div className="space-y-2">
          {crs.map((cr) => (
            <div
              key={cr.id}
              className="p-3 rounded-lg border border-[#e2e4f0] hover:bg-[#f4f5fb] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-600 text-gray-800 leading-tight">{cr.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cr.submittedBy.name} · {format(new Date(cr.submittedAt), "MMM d, yyyy")}
                  </p>
                  {cr.responseNotes && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      Response: {cr.responseNotes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-700 uppercase ${STATUS_COLORS[cr.status] ?? "bg-gray-100 text-gray-500"}`}
                  >
                    {cr.status.replace(/_/g, " ")}
                  </span>
                  {isPMOLead && !["WITHDRAWN", "APPROVED", "REJECTED"].includes(cr.status) && (
                    <button
                      onClick={() => {
                        setReviewCR(cr);
                        setReviewStatus("UNDER_REVIEW");
                        setReviewNotes("");
                      }}
                      className="text-xs text-[#1a1f5e] font-600 hover:underline"
                    >
                      Review
                    </button>
                  )}
                  {isClient &&
                    cr.submittedBy.id === currentUserId &&
                    cr.status === "PENDING" && (
                      <button
                        onClick={() => handleWithdraw(cr)}
                        className="text-xs text-red-500 font-600 hover:underline"
                      >
                        Withdraw
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e4f0]">
              <p className="font-700 text-[#1a1f5e]">Submit Change Request</p>
              <button onClick={() => setShowSubmit(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-600 text-gray-600 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={submitForm.title}
                  onChange={(e) => setSubmitForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-[#e2e4f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]"
                  placeholder="Brief title of the change"
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-gray-600 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={submitForm.description}
                  onChange={(e) => setSubmitForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-[#e2e4f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e] resize-none"
                  placeholder="Detailed description of the requested change"
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-gray-600 mb-1">Impact on Scope</label>
                <input
                  type="text"
                  value={submitForm.impactScope}
                  onChange={(e) => setSubmitForm((f) => ({ ...f, impactScope: e.target.value }))}
                  className="w-full border border-[#e2e4f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]"
                  placeholder="How does this affect the scope?"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-600 text-gray-600 mb-1">Cost Impact ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={submitForm.impactCost}
                    onChange={(e) => setSubmitForm((f) => ({ ...f, impactCost: e.target.value }))}
                    className="w-full border border-[#e2e4f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-600 text-gray-600 mb-1">Schedule Impact</label>
                  <input
                    type="text"
                    value={submitForm.impactSchedule}
                    onChange={(e) => setSubmitForm((f) => ({ ...f, impactSchedule: e.target.value }))}
                    className="w-full border border-[#e2e4f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e]"
                    placeholder="e.g. +2 weeks"
                  />
                </div>
              </div>
              {submitError && (
                <p className="text-xs text-red-600 font-500">{submitError}</p>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmit(false)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 border border-[#e2e4f0] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-600 bg-[#1a1f5e] text-white hover:bg-[#3d2d8e] disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewCR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e4f0]">
              <p className="font-700 text-[#1a1f5e]">Review Change Request</p>
              <button onClick={() => setReviewCR(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReview} className="p-5 space-y-4">
              {/* CR Details */}
              <div className="p-3 rounded-lg bg-[#f4f5fb] space-y-2">
                <p className="text-sm font-600 text-gray-800">{reviewCR.title}</p>
                <p className="text-xs text-gray-600">{reviewCR.description}</p>
                {reviewCR.impactScope && (
                  <p className="text-xs text-gray-500">Scope: {reviewCR.impactScope}</p>
                )}
                {reviewCR.impactCost != null && (
                  <p className="text-xs text-gray-500">Cost Impact: ${reviewCR.impactCost.toLocaleString()}</p>
                )}
                {reviewCR.impactSchedule && (
                  <p className="text-xs text-gray-500">Schedule: {reviewCR.impactSchedule}</p>
                )}
                <p className="text-xs text-gray-400">
                  Submitted by {reviewCR.submittedBy.name} on {format(new Date(reviewCR.submittedAt), "MMM d, yyyy")}
                </p>
              </div>

              {/* Status selection */}
              <div>
                <label className="block text-xs font-600 text-gray-600 mb-2">Decision</label>
                <div className="flex gap-3">
                  {(["UNDER_REVIEW", "APPROVED", "REJECTED"] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reviewStatus"
                        value={s}
                        checked={reviewStatus === s}
                        onChange={() => setReviewStatus(s)}
                        className="accent-[#1a1f5e]"
                      />
                      <span
                        className={`text-xs font-600 ${
                          s === "APPROVED"
                            ? "text-green-700"
                            : s === "REJECTED"
                            ? "text-red-700"
                            : "text-blue-700"
                        }`}
                      >
                        {s.replace(/_/g, " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-600 text-gray-600 mb-1">Response Notes</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full border border-[#e2e4f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1f5e]/20 focus:border-[#1a1f5e] resize-none"
                  placeholder="Optional notes for the requester..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewCR(null)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 border border-[#e2e4f0] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="px-4 py-2 rounded-lg text-sm font-600 bg-[#1a1f5e] text-white hover:bg-[#3d2d8e] disabled:opacity-50 transition-colors"
                >
                  {reviewing ? "Saving..." : "Save Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
