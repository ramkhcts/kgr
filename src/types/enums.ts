export const UserRole = {
  BUSINESS_USER: "BUSINESS_USER",
  PROGRAM_MANAGER: "PROGRAM_MANAGER",
  SOLUTIONING_TEAM: "SOLUTIONING_TEAM",
  CUSTOMER_APPROVER: "CUSTOMER_APPROVER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ProjectStatus = {
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  INFO_REQUIRED: "INFO_REQUIRED",
  SOLUTIONING: "SOLUTIONING",
  SOW_DRAFT: "SOW_DRAFT",
  SOW_APPROVAL: "SOW_APPROVAL",
  SOW_SIGNED: "SOW_SIGNED",
  PO_REQUESTED: "PO_REQUESTED",
  PO_RECEIVED: "PO_RECEIVED",
  RESOURCE_ASSIGNED: "RESOURCE_ASSIGNED",
  CLOSED_SUCCESS: "CLOSED_SUCCESS",
  CANCELLED: "CANCELLED",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const ScopeOfWork = {
  SITE_SUPPORT_SERVICES: "SITE_SUPPORT_SERVICES",
  SERVICE_DESK: "SERVICE_DESK",
  REMOTE_COMMAND_CENTER: "REMOTE_COMMAND_CENTER",
  FIELD_SERVICES: "FIELD_SERVICES",
} as const;
export type ScopeOfWork = (typeof ScopeOfWork)[keyof typeof ScopeOfWork];

export const RAGStatus = {
  RED: "RED",
  AMBER: "AMBER",
  GREEN: "GREEN",
} as const;
export type RAGStatus = (typeof RAGStatus)[keyof typeof RAGStatus];

export const SCOPE_LABELS: Record<ScopeOfWork, string> = {
  SITE_SUPPORT_SERVICES: "Site Support Services",
  SERVICE_DESK: "Service Desk",
  REMOTE_COMMAND_CENTER: "Remote Command Center",
  FIELD_SERVICES: "Field Services",
};
