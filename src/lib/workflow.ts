import { ProjectStatus, UserRole } from "@/types/enums";

export type ProjectSnapshot = {
  documents: { type: string }[];
  poNumber: string | null;
  assignedResourceId: string | null;
  closureNotes: string | null;
};

export type ExitCriterion = {
  label: string;
  check: (project: ProjectSnapshot) => boolean;
};

export type Transition = {
  from: ProjectStatus;
  to: ProjectStatus;
  allowedRoles: UserRole[];
  label: string;
  requiresField?: string;
  exitCriteria?: ExitCriterion[];
};

export const TRANSITIONS: Transition[] = [
  {
    from: "SUBMITTED",
    to: "UNDER_REVIEW",
    allowedRoles: ["PMO_LEAD"],
    label: "Begin Review",
  },
  {
    from: "UNDER_REVIEW",
    to: "INFO_REQUIRED",
    allowedRoles: ["PMO_LEAD"],
    label: "Request More Info",
    requiresField: "infoRequestMessage",
  },
  {
    from: "UNDER_REVIEW",
    to: "SOLUTIONING",
    allowedRoles: ["PMO_LEAD"],
    label: "Send to Solutioning",
  },
  {
    from: "INFO_REQUIRED",
    to: "UNDER_REVIEW",
    allowedRoles: ["CLIENT", "PMO_LEAD"],
    label: "Info Provided — Resume Review",
  },
  {
    from: "SOLUTIONING",
    to: "SOW_DRAFT",
    allowedRoles: ["PMO_TEAM"],
    label: "Upload SOW Draft",
    exitCriteria: [
      {
        label: "Upload a SOW draft document",
        check: (p) => p.documents.some((d) => d.type === "SOW_DRAFT"),
      },
    ],
  },
  {
    from: "SOW_DRAFT",
    to: "SOW_APPROVAL",
    allowedRoles: ["PMO_LEAD", "PMO_TEAM"],
    label: "Send for Client Approval",
    exitCriteria: [
      {
        label: "Upload a SOW draft document",
        check: (p) => p.documents.some((d) => d.type === "SOW_DRAFT"),
      },
    ],
  },
  {
    from: "SOW_APPROVAL",
    to: "SOW_SIGNED",
    allowedRoles: ["CLIENT"],
    label: "Approve & Sign SOW",
    requiresField: "signedSowDocumentId",
    exitCriteria: [
      {
        label: "Client must sign or upload signed SOW",
        check: (p) => p.documents.some((d) => d.type === "SIGNED_SOW"),
      },
    ],
  },
  {
    from: "SOW_APPROVAL",
    to: "SOW_DRAFT",
    allowedRoles: ["CLIENT", "PMO_LEAD"],
    label: "Reject SOW — Needs Revision",
  },
  {
    from: "SOW_SIGNED",
    to: "PO_REQUESTED",
    allowedRoles: ["PMO_LEAD"],
    label: "Request Purchase Order",
  },
  {
    from: "PO_REQUESTED",
    to: "PO_RECEIVED",
    allowedRoles: ["CLIENT", "PMO_LEAD"],
    label: "Mark PO Received",
    requiresField: "poNumber",
    exitCriteria: [
      {
        label: "Enter PO number",
        check: (p) => !!p.poNumber,
      },
    ],
  },
  {
    from: "PO_RECEIVED",
    to: "RESOURCE_ASSIGNED",
    allowedRoles: ["PMO_LEAD", "PMO_TEAM"],
    label: "Assign Resource",
    requiresField: "assignedResourceId",
    exitCriteria: [
      {
        label: "Select a resource to assign",
        check: (p) => !!p.assignedResourceId,
      },
    ],
  },
  {
    from: "RESOURCE_ASSIGNED",
    to: "HANDED_TO_OPERATIONS",
    allowedRoles: ["PMO_LEAD"],
    label: "Hand Over to Operations",
  },
  {
    from: "HANDED_TO_OPERATIONS",
    to: "CLOSED_SUCCESS",
    allowedRoles: ["PMO_LEAD"],
    label: "Close Successfully",
    exitCriteria: [
      {
        label: "Add closure notes",
        check: (p) => !!p.closureNotes,
      },
    ],
  },
];

export const CANCEL_ALLOWED_ROLES: UserRole[] = ["PMO_LEAD"];

export function getAvailableTransitions(
  currentStatus: ProjectStatus,
  userRole: UserRole
): Transition[] {
  return TRANSITIONS.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
  );
}

export function getAllTransitionsFrom(currentStatus: ProjectStatus): Transition[] {
  return TRANSITIONS.filter((t) => t.from === currentStatus);
}

export function getPendingCriteria(
  transition: Transition,
  project: ProjectSnapshot
): string[] {
  return (transition.exitCriteria ?? [])
    .filter((c) => !c.check(project))
    .map((c) => c.label);
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  INFO_REQUIRED: "Info Required",
  SOLUTIONING: "Solutioning",
  SOW_DRAFT: "SOW Draft",
  SOW_APPROVAL: "SOW Approval",
  SOW_SIGNED: "SOW Signed",
  PO_REQUESTED: "PO Requested",
  PO_RECEIVED: "PO Received",
  RESOURCE_ASSIGNED: "Resource Assigned",
  HANDED_TO_OPERATIONS: "Handed to Operations",
  CLOSED_SUCCESS: "Closed (Success)",
  CANCELLED: "Cancelled",
};

export const STATUS_ORDER: ProjectStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INFO_REQUIRED",
  "SOLUTIONING",
  "SOW_DRAFT",
  "SOW_APPROVAL",
  "SOW_SIGNED",
  "PO_REQUESTED",
  "PO_RECEIVED",
  "RESOURCE_ASSIGNED",
  "HANDED_TO_OPERATIONS",
  "CLOSED_SUCCESS",
  "CANCELLED",
];

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  SUBMITTED: "#6366f1",
  UNDER_REVIEW: "#f59e0b",
  INFO_REQUIRED: "#ef4444",
  SOLUTIONING: "#8b5cf6",
  SOW_DRAFT: "#3b82f6",
  SOW_APPROVAL: "#0ea5e9",
  SOW_SIGNED: "#10b981",
  PO_REQUESTED: "#14b8a6",
  PO_RECEIVED: "#0d9488",
  RESOURCE_ASSIGNED: "#22c55e",
  HANDED_TO_OPERATIONS: "#16a34a",
  CLOSED_SUCCESS: "#15803d",
  CANCELLED: "#6b7280",
};
