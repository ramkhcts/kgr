export const UserRole = {
  CLIENT: "CLIENT",
  PMO_LEAD: "PMO_LEAD",
  PMO_TEAM: "PMO_TEAM",
  SUPER_ADMIN: "SUPER_ADMIN",
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
  CLOSED_REJECTED: "CLOSED_REJECTED",
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

export const Specialization = {
  SOLUTIONING: "SOLUTIONING",
  DELIVERY: "DELIVERY",
  COMMERCIAL: "COMMERCIAL",
  GENERAL: "GENERAL",
} as const;
export type Specialization = (typeof Specialization)[keyof typeof Specialization];

export const Region = {
  NA: "NA",
  EMEA: "EMEA",
  LATAM: "LATAM",
  ASPAC: "ASPAC",
} as const;
export type Region = (typeof Region)[keyof typeof Region];

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

export const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Client",
  PMO_LEAD: "PMO Lead",
  PMO_TEAM: "PMO Team",
  SUPER_ADMIN: "Super Admin",
};

export const SPECIALIZATION_LABELS: Record<string, string> = {
  SOLUTIONING: "Solutioning",
  DELIVERY: "Delivery",
  COMMERCIAL: "Commercial",
  GENERAL: "General",
};

export const REGION_LABELS: Record<string, string> = {
  NA: "North America",
  EMEA: "Europe, Middle East & Africa",
  LATAM: "Latin America",
  ASPAC: "Asia Pacific",
};

export const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#d97706",
  MEDIUM: "#2563eb",
  LOW: "#6b7280",
};

export const URGENCY_LABELS: Record<string, string> = {
  EMERGENCY: "Emergency",
  URGENT: "Urgent",
  STANDARD: "Standard",
  PLANNED: "Planned",
};

export const COVERAGE_MODEL_LABELS: Record<string, string> = {
  STANDARD_8X5: "Standard (8×5)",
  EXTENDED_12X5: "Extended (12×5)",
  HOURS_24X7: "24×7",
  FOLLOW_THE_SUN: "Follow the Sun",
};

export const WORKPLACE_MODEL_LABELS: Record<string, string> = {
  ON_SITE:                 "On-Site Only",
  ONSHORE_REMOTE:          "Onshore Remote",
  OFFSHORE_REMOTE:         "Offshore Remote",
  HYBRID_ON_SITE_ONSHORE:  "Hybrid — On-Site + Onshore",
  HYBRID_ON_SITE_OFFSHORE: "Hybrid — On-Site + Offshore",
  HYBRID_ONSHORE_OFFSHORE: "Hybrid — Onshore + Offshore",
  HYBRID_ALL:              "Hybrid — On-Site + Onshore + Offshore",
};

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  TIME_AND_MATERIALS: "Time & Materials",
  FIXED_PRICE: "Fixed Price",
  MANAGED_SERVICE: "Managed Service",
  NOT_SURE: "Not Sure Yet",
};

export const DATA_CLASSIFICATION_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  INTERNAL: "Internal",
  CONFIDENTIAL: "Confidential",
  RESTRICTED: "Restricted / Regulated",
};

export const DATA_CLASSIFICATION_COLORS: Record<string, string> = {
  PUBLIC: "#16a34a",
  INTERNAL: "#2563eb",
  CONFIDENTIAL: "#d97706",
  RESTRICTED: "#dc2626",
};

export const ITSM_PLATFORM_LABELS: Record<string, string> = {
  SERVICENOW: "ServiceNow",
  JIRA_SERVICE_MANAGEMENT: "Jira Service Management",
  REMEDY: "BMC Remedy",
  ZENDESK: "Zendesk",
  FRESHSERVICE: "Freshservice",
  OTHER: "Other",
  NONE: "None / To Be Determined",
};

export const SERVICE_TIER_LABELS: Record<string, string> = {
  BASIC: "Basic",
  STANDARD: "Standard",
  PREMIUM: "Premium",
  ENTERPRISE: "Enterprise",
};
export const SERVICE_TIER_COLORS: Record<string, string> = {
  BASIC: "#6b7280",
  STANDARD: "#2563eb",
  PREMIUM: "#7c3aed",
  ENTERPRISE: "#d97706",
};
export const BG_CHECK_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  CLEARED: "Cleared",
  FAILED: "Failed",
};
export const SHIFT_PATTERN_LABELS: Record<string, string> = {
  DAY: "Day (6am–2pm)",
  EVENING: "Evening (2pm–10pm)",
  NIGHT: "Night (10pm–6am)",
  WEEKEND: "Weekend",
  ROTATING: "Rotating",
};

export const STATUS_LABELS: Record<string, string> = {
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
  CLOSED_SUCCESS: "Closed — Success",
  CLOSED_REJECTED: "Closed — Rejected",
  CANCELLED: "Cancelled",
};
