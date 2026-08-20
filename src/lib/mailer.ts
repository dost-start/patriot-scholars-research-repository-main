import nodemailer from "nodemailer"

/**
 * Mailer utility using Nodemailer.
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const BRAND_COLOR_NAVY = "#0B1F3A"
const BRAND_COLOR_GOLD = "#D4920A"

/**
 * Shared HTML wrapper with inlined styles for maximum email client compatibility.
 */
function getHtmlTemplate(title: string, content: string, ctaText?: string, ctaUrl?: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 40px 40px 20px 40px;">
                  <div style="font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: ${BRAND_COLOR_NAVY}; letter-spacing: 2px; text-transform: uppercase;">PSRR</div>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 20px 40px;">
                  <h1 style="margin: 0 0 16px 0; font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; color: ${BRAND_COLOR_NAVY}; text-align: center;">${title}</h1>
                  <p style="margin: 0 0 24px 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #334155; text-align: center;">${content}</p>
                  
                  ${ctaText && ctaUrl ? `
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${ctaUrl}" style="background-color: ${BRAND_COLOR_NAVY}; color: #ffffff; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">${ctaText}</a>
                    </div>
                  ` : ""}
                  
                  <p style="margin: 32px 0 0 0; font-family: Arial, sans-serif; font-size: 13px; color: #64748b; text-align: center;">
                    If you did not request this email, you can safely ignore it.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 40px; background-color: #fcfcfc; border-top: 1px solid #f1f5f9; text-align: center;">
                  <div style="font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; color: ${BRAND_COLOR_GOLD}; margin-bottom: 8px;">DOST-SEI Patriot Scholars Research Repository</div>
                  <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Science Education Institute. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export async function sendVerificationEmail(email: string, url: string) {
  const html = getHtmlTemplate(
    "Verify your email address",
    "Welcome to the DOST-SEI Patriot Scholars Research Repository! Please verify your email address to complete your registration and gain access to the platform.",
    "Verify Email Address",
    url
  )

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your PSRR email address",
    html,
    text: `Welcome to PSRR! Verify your email by visiting: ${url}`,
  })
}

export async function sendPasswordResetEmail(email: string, url: string) {
  const html = getHtmlTemplate(
    "Reset your password",
    "We received a request to reset your password for your PSRR account. Click the button below to choose a new password.",
    "Reset Password",
    url
  )

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your PSRR password",
    html,
    text: `Reset your password by visiting: ${url}`,
  })
}

export async function sendStatusUpdate(
  email: string,
  paperTitle: string,
  status: "PUBLISHED" | "RETURNED",
  feedback?: string | null
) {
  const isApproved = status === "PUBLISHED"
  const title = isApproved ? "Paper Approved" : "Action Required: Paper Returned"
  const content = isApproved
    ? `Great news! Your research paper "<strong>${paperTitle}</strong>" has been reviewed and published in the repository.`
    : `Your research paper "<strong>${paperTitle}</strong>" has been returned for revision. 
       ${feedback ? `<br><br><strong>Reviewer Feedback:</strong><br>${feedback}` : ""}`
  
  const ctaText = isApproved ? "View Paper" : "Revise Submission"
  const ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`

  const html = getHtmlTemplate(title, content, ctaText, ctaUrl)

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `PSRR: ${title}`,
    html,
    text: `${title}: ${paperTitle}. Log in to PSRR to view details.`,
  })
}

export async function sendCorrectionRequest(email: string, userName: string) {
  const title = "Action Required: Profile Correction";
  const content = `Hello ${userName},<br><br>An administrator has reviewed your scholar registration and found that your submitted SPAS information does not match our records. Please log in and update your profile information (Full Name or SPAS ID) to proceed with account verification.`;
  const ctaText = "Update Profile";
  const ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profile`;

  const html = getHtmlTemplate(title, content, ctaText, ctaUrl);

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `PSRR: Profile Correction Required`,
    html,
    text: `Profile Correction Required: Please log in to PSRR to update your scholar profile information.`,
  });
}
