import nodemailer from "nodemailer";
import { renderEmail } from "@/lib/email-templates";

const isDev = !process.env.EMAIL_PASS || process.env.EMAIL_PASS === "your-app-password";

const transporter = isDev
  ? null
  : nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

async function send(to: string | string[], subject: string, html: string) {
  const originalRecipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!originalRecipients.length) return;

  // If a test recipient is set, redirect all mail there
  const testRecipient = process.env.EMAIL_TEST_RECIPIENT;
  const recipients = testRecipient ? [testRecipient] : originalRecipients;
  const subjectLine = testRecipient
    ? `[TEST — orig: ${originalRecipients.join(", ")}] ${subject}`
    : subject;

  if (isDev) {
    console.log("\n📧 [EMAIL — dev mode, not sent]");
    console.log(`  To:      ${recipients.join(", ")}`);
    console.log(`  Subject: ${subjectLine}`);
    console.log(`  Body:    ${html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 300)}\n`);
    return;
  }

  await transporter!.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipients.join(", "),
    subject: subjectLine,
    html,
  });
}

function wrap(body: string) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e4f0;border-radius:12px;overflow:hidden">
    <div style="background:#1a1f5e;padding:20px 24px">
      <span style="color:#d4a017;font-weight:800;font-size:20px">KGR</span>
      <span style="color:#ffffff;font-size:14px;opacity:0.8;margin-left:10px">iDemand Portal</span>
    </div>
    <div style="padding:24px">${body}</div>
    <div style="background:#f4f5fb;padding:14px 24px;font-size:11px;color:#9ca3af;border-top:1px solid #e2e4f0">
      KGR iDemand Portal · KarthikLLC End User Services · Do not reply to this email.
    </div>
  </div>`;
}

function projectLink(projectId: string, path = "") {
  return `${process.env.NEXTAUTH_URL}/projects/${projectId}${path}`;
}

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#1a1f5e;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px">${label}</a>`;
}

function infoRow(label: string, value: string) {
  return `<tr><td style="padding:5px 0;color:#6b7280;font-size:13px;width:140px">${label}</td><td style="padding:5px 0;font-size:13px;color:#1a1f5e">${value}</td></tr>`;
}

type NotifyOpts = {
  clientEmails: string[];
  pmoEmails: string[];
  projectName: string;
  projectId: string;
  changedBy: string;
  fromStatus: string;
  toStatus: string;
  extra?: Record<string, string>;
};

const STAGE_CONFIG: Record<string, {
  subject: (p: string) => string;
  clientHtml: (o: NotifyOpts) => string;
  pmoHtml: (o: NotifyOpts) => string;
  notifyClient: boolean;
  notifyPMO: boolean;
}> = {
  SUBMITTED: {
    subject: (p) => `New Request Submitted: ${p}`,
    notifyClient: false,
    notifyPMO: true,
    clientHtml: () => "",
    pmoHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">New iDemand Request</h2>
      <p style="color:#374151;font-size:14px">A new request has been submitted and is awaiting your review.</p>
      <table style="width:100%;border-collapse:collapse;margin:14px 0">
        ${infoRow("Project", `<strong>${o.projectName}</strong>`)}
        ${infoRow("Submitted by", o.changedBy)}
        ${o.extra?.scope ? infoRow("Scope", o.extra.scope) : ""}
        ${o.extra?.location ? infoRow("Location", o.extra.location) : ""}
      </table>
      ${btn(projectLink(o.projectId), "Review Request →")}
    `),
  },
  UNDER_REVIEW: {
    subject: (p) => `Your request is under review: ${p}`,
    notifyClient: true,
    notifyPMO: false,
    pmoHtml: () => "",
    clientHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Request Under Review</h2>
      <p style="color:#374151;font-size:14px">Good news — the PMO team has started reviewing your request <strong>${o.projectName}</strong>.</p>
      <p style="color:#374151;font-size:14px">You will be notified of any updates or if additional information is needed.</p>
      ${btn(projectLink(o.projectId), "View Request →")}
    `),
  },
  INFO_REQUIRED: {
    subject: (p) => `Action Required — More info needed: ${p}`,
    notifyClient: true,
    notifyPMO: false,
    pmoHtml: () => "",
    clientHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Additional Information Required</h2>
      <p style="color:#374151;font-size:14px">The PMO team needs more information before proceeding with <strong>${o.projectName}</strong>.</p>
      ${o.extra?.infoRequestMessage ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px;margin:14px 0"><p style="margin:0;font-size:13px;color:#92400e">${o.extra.infoRequestMessage}</p></div>` : ""}
      <p style="color:#374151;font-size:14px">Please log in to respond to this request.</p>
      ${btn(projectLink(o.projectId), "Provide Information →")}
    `),
  },
  SOLUTIONING: {
    subject: (p) => `Solutioning started: ${p}`,
    notifyClient: true,
    notifyPMO: true,
    clientHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Solutioning in Progress</h2>
      <p style="color:#374151;font-size:14px">Your request <strong>${o.projectName}</strong> has been accepted and our team is now working on the solution and Statement of Work.</p>
      <p style="color:#374151;font-size:14px">You will be notified once the SOW is ready for your review.</p>
      ${btn(projectLink(o.projectId), "View Request →")}
    `),
    pmoHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Solutioning Assigned</h2>
      <p style="color:#374151;font-size:14px"><strong>${o.projectName}</strong> has been moved to Solutioning by ${o.changedBy}. The team should prepare the SOW.</p>
      ${btn(projectLink(o.projectId), "View Project →")}
    `),
  },
  SOW_DRAFT: {
    subject: (p) => `SOW draft uploaded: ${p}`,
    notifyClient: false,
    notifyPMO: true,
    clientHtml: () => "",
    pmoHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">SOW Draft Ready for Review</h2>
      <p style="color:#374151;font-size:14px">A Statement of Work draft has been uploaded for <strong>${o.projectName}</strong> by ${o.changedBy}. Please review before sending to the client.</p>
      ${btn(projectLink(o.projectId, "/sow"), "Review SOW →")}
    `),
  },
  SOW_APPROVAL: {
    subject: (p) => `Action Required — SOW ready for your approval: ${p}`,
    notifyClient: true,
    notifyPMO: false,
    pmoHtml: () => "",
    clientHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Statement of Work Ready for Approval</h2>
      <p style="color:#374151;font-size:14px">The Statement of Work for <strong>${o.projectName}</strong> is ready for your review and signature.</p>
      <p style="color:#374151;font-size:14px">Please review the document and either approve &amp; sign, or request revisions.</p>
      ${btn(projectLink(o.projectId, "/sow"), "Review & Sign SOW →")}
    `),
  },
  SOW_SIGNED: {
    subject: (p) => `SOW signed — next step: PO: ${p}`,
    notifyClient: false,
    notifyPMO: true,
    clientHtml: () => "",
    pmoHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">SOW Signed by Client</h2>
      <p style="color:#374151;font-size:14px">The client has signed the Statement of Work for <strong>${o.projectName}</strong>. Next step: request the Purchase Order.</p>
      ${btn(projectLink(o.projectId), "Request PO →")}
    `),
  },
  PO_REQUESTED: {
    subject: (p) => `Action Required — Purchase Order requested: ${p}`,
    notifyClient: true,
    notifyPMO: false,
    pmoHtml: () => "",
    clientHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Purchase Order Requested</h2>
      <p style="color:#374151;font-size:14px">The PMO team has requested a Purchase Order for <strong>${o.projectName}</strong>. Please upload the PO to proceed.</p>
      ${btn(projectLink(o.projectId), "Upload PO →")}
    `),
  },
  PO_RECEIVED: {
    subject: (p) => `PO received — resource assignment next: ${p}`,
    notifyClient: false,
    notifyPMO: true,
    clientHtml: () => "",
    pmoHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Purchase Order Received</h2>
      <p style="color:#374151;font-size:14px">The Purchase Order has been received for <strong>${o.projectName}</strong>. Next step: assign a resource.</p>
      ${o.extra?.poNumber ? `<p style="color:#374151;font-size:13px">PO Number: <strong>${o.extra.poNumber}</strong></p>` : ""}
      ${btn(projectLink(o.projectId, "/resources"), "Assign Resource →")}
    `),
  },
  RESOURCE_ASSIGNED: {
    subject: (p) => `Resource assigned to your project: ${p}`,
    notifyClient: true,
    notifyPMO: true,
    clientHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Resource Assigned</h2>
      <p style="color:#374151;font-size:14px">A resource has been assigned to <strong>${o.projectName}</strong>. The team will begin delivery preparations shortly.</p>
      ${btn(projectLink(o.projectId), "View Project →")}
    `),
    pmoHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Resource Assignment Confirmed</h2>
      <p style="color:#374151;font-size:14px">A resource has been assigned to <strong>${o.projectName}</strong> by ${o.changedBy}. Ready to hand over to operations.</p>
      ${btn(projectLink(o.projectId), "View Project →")}
    `),
  },
  HANDED_TO_OPERATIONS: {
    subject: (p) => `Project handed to operations: ${p}`,
    notifyClient: true,
    notifyPMO: true,
    clientHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Project Handed to Operations</h2>
      <p style="color:#374151;font-size:14px"><strong>${o.projectName}</strong> has been handed over to the steady-state operations team for ongoing management.</p>
      ${btn(projectLink(o.projectId), "View Project →")}
    `),
    pmoHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Handed to Operations</h2>
      <p style="color:#374151;font-size:14px"><strong>${o.projectName}</strong> has been handed to operations by ${o.changedBy}. Final closure step remaining.</p>
      ${btn(projectLink(o.projectId), "View Project →")}
    `),
  },
  CLOSED_SUCCESS: {
    subject: (p) => `Project closed successfully: ${p}`,
    notifyClient: true,
    notifyPMO: true,
    clientHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Project Closed Successfully ✓</h2>
      <p style="color:#374151;font-size:14px">Congratulations! <strong>${o.projectName}</strong> has been completed and closed successfully.</p>
      <p style="color:#374151;font-size:14px">Thank you for working with KGR End User Services.</p>
      ${btn(projectLink(o.projectId), "View Final Record →")}
    `),
    pmoHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Project Closed</h2>
      <p style="color:#374151;font-size:14px"><strong>${o.projectName}</strong> has been closed successfully by ${o.changedBy}.</p>
      ${btn(projectLink(o.projectId), "View Record →")}
    `),
  },
  CANCELLED: {
    subject: (p) => `Project cancelled: ${p}`,
    notifyClient: true,
    notifyPMO: true,
    clientHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Project Cancelled</h2>
      <p style="color:#374151;font-size:14px">Your request <strong>${o.projectName}</strong> has been cancelled by the PMO team.</p>
      ${o.extra?.cancelledReason ? `<div style="background:#fee2e2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin:14px 0"><p style="margin:0;font-size:13px;color:#991b1b">Reason: ${o.extra.cancelledReason}</p></div>` : ""}
      <p style="color:#374151;font-size:14px">Please contact the PMO team if you have questions.</p>
      ${btn(projectLink(o.projectId), "View Request →")}
    `),
    pmoHtml: (o) => wrap(`
      <h2 style="color:#1a1f5e;margin:0 0 12px">Project Cancelled</h2>
      <p style="color:#374151;font-size:14px"><strong>${o.projectName}</strong> was cancelled by ${o.changedBy}.</p>
      ${o.extra?.cancelledReason ? `<p style="color:#374151;font-size:13px">Reason: ${o.extra.cancelledReason}</p>` : ""}
      ${btn(projectLink(o.projectId), "View Record →")}
    `),
  },
};

export async function sendStageNotification(opts: NotifyOpts) {
  const config = STAGE_CONFIG[opts.toStatus];
  if (!config) return;

  const subject = config.subject(opts.projectName);
  const sends: Promise<void>[] = [];

  if (config.notifyClient && opts.clientEmails.length) {
    sends.push(send(opts.clientEmails, subject, config.clientHtml(opts)));
  }
  if (config.notifyPMO && opts.pmoEmails.length) {
    sends.push(send(opts.pmoEmails, subject, config.pmoHtml(opts)));
  }

  await Promise.all(sends);
}

export async function sendCRDecisionNotification(opts: {
  toEmail: string;
  submitterName: string;
  projectName: string;
  projectId: string;
  crTitle: string;
  decision: "APPROVED" | "REJECTED";
  responseNotes: string | null;
}) {
  const isApproved = opts.decision === "APPROVED";
  const subject = isApproved
    ? `Change Request Approved: ${opts.crTitle}`
    : `Change Request Rejected: ${opts.crTitle}`;

  const html = wrap(`
    <h2 style="color:#1a1f5e;margin:0 0 12px">Change Request ${isApproved ? "Approved" : "Rejected"}</h2>
    <p style="color:#374151;font-size:14px">
      Hi ${opts.submitterName}, your change request for <strong>${opts.projectName}</strong> has been
      <strong style="color:${isApproved ? "#16a34a" : "#dc2626"}">${opts.decision.toLowerCase()}</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:14px 0">
      ${infoRow("Change Request", opts.crTitle)}
      ${infoRow("Project", opts.projectName)}
      ${infoRow("Decision", opts.decision)}
    </table>
    ${opts.responseNotes ? `<div style="background:#f4f5fb;border:1px solid #e2e4f0;border-radius:8px;padding:14px;margin:14px 0"><p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280">Response Notes</p><p style="margin:0;font-size:13px;color:#374151">${opts.responseNotes}</p></div>` : ""}
    ${btn(projectLink(opts.projectId), "View Project →")}
  `);

  await send(opts.toEmail, subject, html);
}

/**
 * Send an email using a named template from email-templates.ts
 */
export async function sendTemplatedEmail(
  to: string | string[],
  type: string,
  data: Record<string, string>
) {
  const { subject, html, text } = renderEmail(type, data);
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) return;

  if (isDev) {
    console.log(`\n📧 [EMAIL — dev mode, not sent]`);
    console.log(`  Type:    ${type}`);
    console.log(`  To:      ${recipients.join(", ")}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Text:    ${text.slice(0, 200)}\n`);
    return;
  }

  await transporter!.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipients.join(", "),
    subject,
    html,
    text,
  });
}

// Keep the simple helper for new submissions (called from projects/route.ts)
export const Notifications = {
  newRequestSubmitted: (opts: {
    pmoEmails: string[];
    projectName: string;
    submittedBy: string;
    scope: string;
    location: string;
    projectId: string;
  }) =>
    sendStageNotification({
      clientEmails: [],
      pmoEmails: opts.pmoEmails,
      projectName: opts.projectName,
      projectId: opts.projectId,
      changedBy: opts.submittedBy,
      fromStatus: "",
      toStatus: "SUBMITTED",
      extra: { scope: opts.scope, location: opts.location },
    }),
};
