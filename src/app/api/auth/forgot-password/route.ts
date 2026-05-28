import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return 200 — don't leak whether email exists
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    // Log in dev mode; send in prod (import dynamically to avoid build issues)
    const isDev = !process.env.EMAIL_PASS || process.env.EMAIL_PASS === "your-app-password";
    if (isDev) {
      console.log("\n📧 [PASSWORD RESET — dev mode, not sent]");
      console.log(`  To:    ${email}`);
      console.log(`  Link:  ${resetUrl}\n`);
    } else {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Reset your KGR iDemand Portal password",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e4f0;border-radius:12px;overflow:hidden">
            <div style="background:#1a1f5e;padding:20px 24px">
              <span style="color:#d4a017;font-weight:800;font-size:20px">KGR</span>
              <span style="color:#ffffff;font-size:14px;opacity:0.8;margin-left:10px">iDemand Portal</span>
            </div>
            <div style="padding:24px">
              <h2 style="color:#1a1f5e;margin:0 0 12px">Password Reset Request</h2>
              <p style="color:#374151;font-size:14px">Click the link below to reset your password. This link expires in 1 hour.</p>
              <a href="${resetUrl}" style="display:inline-block;background:#1a1f5e;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px">Reset Password →</a>
              <p style="color:#6b7280;font-size:12px;margin-top:16px">If you didn't request this, you can safely ignore this email.</p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[FORGOT PASSWORD]", err);
    return NextResponse.json({ success: true }); // always return 200
  }
}
