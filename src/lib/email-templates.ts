/**
 * HTML email templates for KGR iDemand Portal
 * All templates use inline CSS for maximum email-client compatibility.
 */

function wrap(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f5fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f5fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;border:1px solid #e2e4f0;box-shadow:0 4px 16px rgba(26,31,94,0.08);" cellspacing="0" cellpadding="0" border="0">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a1f5e;padding:20px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="color:#d4a017;font-weight:800;font-size:22px;letter-spacing:-0.5px;">KGR</span>
                    <span style="color:rgba(255,255,255,0.75);font-size:14px;margin-left:10px;">iDemand Portal</span>
                  </td>
                  <td align="right">
                    <span style="color:rgba(255,255,255,0.4);font-size:11px;">KGR End User Services</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:28px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f4f5fb;padding:14px 28px;border-top:1px solid #e2e4f0;">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
                KGR End User Services &middot; Powered by iDemand
                <br>
                <span style="color:#d1d5db;">Do not reply to this email. This is an automated notification.</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
    <tr>
      <td style="border-radius:8px;background-color:#1a1f5e;">
        <a href="${href}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:#1a1f5e;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function infoTable(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;border-radius:8px;border:1px solid #e2e4f0;overflow:hidden;">
    ${rows.map(([label, value], i) => `
      <tr style="background-color:${i % 2 === 0 ? "#f4f5fb" : "#ffffff"};">
        <td style="padding:8px 14px;font-size:12px;color:#6b7280;font-weight:600;width:40%;vertical-align:top;">${label}</td>
        <td style="padding:8px 14px;font-size:13px;color:#1a1f5e;font-weight:500;">${value}</td>
      </tr>
    `).join("")}
  </table>`;
}

function alertBox(message: string, color: string, bgColor: string): string {
  return `<div style="background:${bgColor};border:1px solid ${color}40;border-radius:8px;padding:14px 16px;margin:14px 0;">
    <p style="margin:0;font-size:13px;color:${color};line-height:1.5;">${message}</p>
  </div>`;
}

function projectLink(projectId: string, path = ""): string {
  const base = process.env.NEXTAUTH_URL ?? "https://idemand.kgr.com";
  return `${base}/projects/${projectId}${path}`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, (data: Record<string, string>) => { subject: string; html: string; text: string }> = {

  INFO_REQUIRED: (data) => ({
    subject: `Action Required — More information needed: ${data.projectName}`,
    html: wrap(`
      <h1 style="color:#1a1f5e;font-size:20px;font-weight:800;margin:0 0 8px;">Additional Information Required</h1>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">Please read the message below and respond at your earliest convenience.</p>
      ${infoTable([["Project", `<strong>${data.projectName}</strong>`]])}
      ${data.message ? alertBox(data.message, "#92400e", "#fef3c7") : ""}
      <p style="font-size:14px;color:#374151;line-height:1.6;">Please log in to the iDemand Portal to provide the requested information. A PMO representative will continue processing your request once the information is received.</p>
      ${btn(projectLink(data.projectId), "Provide Information →")}
    `),
    text: `Additional information required for ${data.projectName}.\n\n${data.message ?? ""}\n\nVisit: ${projectLink(data.projectId)}`,
  }),

  SOW_APPROVAL: (data) => ({
    subject: `Action Required — SOW ready for your approval: ${data.projectName}`,
    html: wrap(`
      <h1 style="color:#1a1f5e;font-size:20px;font-weight:800;margin:0 0 8px;">Statement of Work Ready for Approval</h1>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">Your SOW requires review and signature to move forward.</p>
      ${infoTable([["Project", `<strong>${data.projectName}</strong>`]])}
      <p style="font-size:14px;color:#374151;line-height:1.6;">The Statement of Work for your engagement has been prepared and is ready for your review. Please click below to review the document and either sign or request revisions.</p>
      ${btn(projectLink(data.projectId, "/sow"), "Review & Sign SOW →")}
    `),
    text: `Your SOW is ready for approval for ${data.projectName}.\n\nReview at: ${projectLink(data.projectId, "/sow")}`,
  }),

  RESOURCE_ASSIGNED: (data) => ({
    subject: `Your team has been assigned for ${data.projectName}`,
    html: wrap(`
      <h1 style="color:#1a1f5e;font-size:20px;font-weight:800;margin:0 0 8px;">Resource Assigned</h1>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">Great news — your team is ready.</p>
      ${infoTable([["Project", `<strong>${data.projectName}</strong>`]])}
      <p style="font-size:14px;color:#374151;line-height:1.6;">A team has been assigned to <strong>${data.projectName}</strong>. They are being onboarded and will begin delivery preparations shortly. Expect an introduction from your assigned team lead soon.</p>
      ${btn(projectLink(data.projectId), "View Your Team →")}
    `),
    text: `Resources have been assigned to ${data.projectName}.\n\nView at: ${projectLink(data.projectId)}`,
  }),

  CLOSED_SUCCESS: (data) => ({
    subject: `Your engagement has been successfully closed: ${data.projectName}`,
    html: wrap(`
      <h1 style="color:#1a1f5e;font-size:20px;font-weight:800;margin:0 0 8px;">Engagement Closed Successfully</h1>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">Thank you for working with KGR End User Services.</p>
      ${infoTable([["Project", `<strong>${data.projectName}</strong>`]])}
      <p style="font-size:14px;color:#374151;line-height:1.6;">Congratulations! Your engagement <strong>${data.projectName}</strong> has been completed and closed successfully. We appreciate your trust in KGR End User Services.</p>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin-top:12px;">Please do not hesitate to reach out if you have any follow-up needs or would like to start a new engagement.</p>
      ${btn(projectLink(data.projectId), "View Final Record →")}
    `),
    text: `${data.projectName} has been closed successfully.\n\nView at: ${projectLink(data.projectId)}`,
  }),

  CR_APPROVED: (data) => ({
    subject: `Your change request has been approved: ${data.crTitle}`,
    html: wrap(`
      <h1 style="color:#1a1f5e;font-size:20px;font-weight:800;margin:0 0 8px;">Change Request Approved</h1>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">Your change request has been reviewed and approved.</p>
      ${infoTable([
        ["Project", `<strong>${data.projectName}</strong>`],
        ["Change Request", data.crTitle],
        ["Decision", `<span style="color:#16a34a;font-weight:700;">Approved</span>`],
      ])}
      ${data.responseNotes ? alertBox(data.responseNotes, "#166534", "#dcfce7") : ""}
      ${btn(projectLink(data.projectId), "View Project →")}
    `),
    text: `Change request "${data.crTitle}" for ${data.projectName} has been approved.\n\nView at: ${projectLink(data.projectId)}`,
  }),

  CR_REJECTED: (data) => ({
    subject: `Your change request has been declined: ${data.crTitle}`,
    html: wrap(`
      <h1 style="color:#1a1f5e;font-size:20px;font-weight:800;margin:0 0 8px;">Change Request Declined</h1>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">Your change request has been reviewed.</p>
      ${infoTable([
        ["Project", `<strong>${data.projectName}</strong>`],
        ["Change Request", data.crTitle],
        ["Decision", `<span style="color:#dc2626;font-weight:700;">Declined</span>`],
      ])}
      ${data.responseNotes ? alertBox(data.responseNotes, "#991b1b", "#fee2e2") : ""}
      <p style="font-size:14px;color:#374151;line-height:1.6;margin-top:12px;">Please contact the PMO team if you have questions or would like to submit a revised change request.</p>
      ${btn(projectLink(data.projectId), "View Project →")}
    `),
    text: `Change request "${data.crTitle}" for ${data.projectName} has been declined.\n\nView at: ${projectLink(data.projectId)}`,
  }),

  PASSWORD_RESET: (data) => ({
    subject: "Reset your iDemand password",
    html: wrap(`
      <h1 style="color:#1a1f5e;font-size:20px;font-weight:800;margin:0 0 8px;">Reset Your Password</h1>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">A password reset was requested for your iDemand account.</p>
      <p style="font-size:14px;color:#374151;line-height:1.6;">Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>
      ${alertBox("If you did not request a password reset, please ignore this email. Your account remains secure.", "#92400e", "#fef3c7")}
      ${btn(data.resetUrl, "Reset Password →")}
      <p style="font-size:12px;color:#9ca3af;margin-top:20px;">Or copy and paste this URL into your browser:</p>
      <p style="font-size:11px;color:#6b7280;word-break:break-all;">${data.resetUrl}</p>
    `),
    text: `Reset your iDemand password by visiting: ${data.resetUrl}\n\nThis link expires in 1 hour.`,
  }),

};

/**
 * Render an email template by type.
 * @param type - Template key, e.g. "INFO_REQUIRED", "SOW_APPROVAL"
 * @param data - Dynamic data for the template
 */
export function renderEmail(
  type: string,
  data: Record<string, string>
): { subject: string; html: string; text: string } {
  const template = TEMPLATES[type];
  if (!template) {
    return {
      subject: `KGR iDemand — ${type.replace(/_/g, " ")}`,
      html: wrap(`<p style="font-size:14px;color:#374151;">${Object.values(data).join(" · ")}</p>`),
      text: Object.values(data).join(" · "),
    };
  }
  return template(data);
}
