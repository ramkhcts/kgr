import { ProjectStatus, UserRole } from "@/types/enums";

export type Transition = {
  from: ProjectStatus;
  to: ProjectStatus;
  allowedRoles: UserRole[];
  label: string;
  requiresField?: string;
};

export const TRANSITIONS: Transition[] = [
  {
    from: "SUBMITTED",
    to: "UNDER_REVIEW",
    allowedRoles: ["PROGRAM_MANAGER"],
    label: "Begin Review",
  },
  {
    from: "UNDER_REVIEW",
    to: "INFO_REQUIRED",
    allowedRoles: ["PROGRAM_MANAGER"],
    label: "Request More Info",
    requiresField: "infoRequestMessage",
  },
  {
    from: "UNDER_REVIEW",
    to: "SOLUTIONING",
    allowedRoles: ["PROGRAM_MANAGER"],
    label: "Send to Solutioning",
  },
  {
    from: "INFO_REQUIRED",
    to: "UNDER_REVIEW",
    allowedRoles: ["BUSINESS_USER", "PROGRAM_MANAGER"],
    label: "Info Provided — Resume Review",
  },
  {
    from: "SOLUTIONING",
    to: "SOW_DRAFT",
    allowedRoles: ["SOLUTIONING_TEAM"],
    label: "Create SOW Draft",
  },
  {
    from: "SOW_DRAFT",
    to: "SOW_APPROVAL",
    allowedRoles: ["PROGRAM_MANAGER", "SOLUTIONING_TEAM"],
    label: "Send for Customer Approval",
  },
  {
    from: "SOW_APPROVAL",
    to: "SOW_SIGNED",
    allowedRoles: ["CUSTOMER_APPROVER"],
    label: "Approve & Sign SOW",
    requiresField: "signedSowPath",
  },
  {
    from: "SOW_APPROVAL",
    to: "SOW_DRAFT",
    allowedRoles: ["CUSTOMER_APPROVER", "PROGRAM_MANAGER"],
    label: "Reject SOW — Needs Revision",
  },
  {
    from: "SOW_SIGNED",
    to: "PO_REQUESTED",
    allowedRoles: ["PROGRAM_MANAGER"],
    label: "Request Purchase Order",
  },
  {
    from: "PO_REQUESTED",
    to: "PO_RECEIVED",
    allowedRoles: ["CUSTOMER_APPROVER", "PROGRAM_MANAGER"],
    label: "Mark PO Received",
    requiresField: "poNumber",
  },
  {
    from: "PO_RECEIVED",
    to: "RESOURCE_ASSIGNED",
    allowedRoles: ["PROGRAM_MANAGER", "SOLUTIONING_TEAM"],
    label: "Assign Resource",
    requiresField: "assignedResourceId",
  },
  {
    from: "RESOURCE_ASSIGNED",
    to: "CLOSED_SUCCESS",
    allowedRoles: ["PROGRAM_MANAGER"],
    label: "Close Successfully",
  },
];

export const CANCEL_ALLOWED_ROLES: UserRole[] = ["PROGRAM_MANAGER"];

export function getAvailableTransitions(
  currentStatus: ProjectStatus,
  userRole: UserRole
): Transition[] {
  return TRANSITIONS.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
  );
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
  CLOSED_SUCCESS: "#15803d",
  CANCELLED: "#6b7280",
};
