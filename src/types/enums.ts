export const UserRole = {
  CLIENT: "CLIENT",
  PMO_LEAD: "PMO_LEAD",
  PMO_TEAM: "PMO_TEAM",
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
  HANDED_TO_OPERATIONS: "HANDED_TO_OPERATIONS",
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

export const DocumentType = {
  SOW_DRAFT: "SOW_DRAFT",
  SIGNED_SOW: "SIGNED_SOW",
  STAFFING_ORDER: "STAFFING_ORDER",
  PO: "PO",
  COMMERCIAL: "COMMERCIAL",
  OTHER: "OTHER",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  SOW_DRAFT: "SOW Draft",
  SIGNED_SOW: "Signed SOW",
  STAFFING_ORDER: "Staffing Order",
  PO: "Purchase Order",
  COMMERCIAL: "Commercial",
  OTHER: "Other",
};

export const SCOPE_LABELS: Record<ScopeOfWork, string> = {
  SITE_SUPPORT_SERVICES: "Site Support Services",
  SERVICE_DESK: "Service Desk",
  REMOTE_COMMAND_CENTER: "Remote Command Center",
  FIELD_SERVICES: "Field Services",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: "Client",
  PMO_LEAD: "PMO Lead",
  PMO_TEAM: "PMO Team",
};
