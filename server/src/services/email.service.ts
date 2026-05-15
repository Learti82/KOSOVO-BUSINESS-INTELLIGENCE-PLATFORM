import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return;
  }
  await t.sendMail({
    from: process.env.EMAIL_FROM || 'KosovaIntel <noreply@kosovaintel.com>',
    to,
    subject,
    html,
  });
}

function wrap(body: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 24px;">
      <span style="font-size: 18pt; font-weight: bold; color: #0f172a;">KOSOVAINTEL</span>
    </div>
    ${body}
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">
      KosovaIntel — Kosovo Business Intelligence<br>
      This message is intended for the named recipient only.
    </div>
  </div>`;
}

export function orderReceivedEmail(orderNumber: string, companyName: string): string {
  return wrap(`<h2>Order Received</h2>
    <p>Thank you for your order <strong>${orderNumber}</strong>.</p>
    <p>We have received your request for a business intelligence report on <strong>${companyName}</strong>.</p>
    <p>Our team will contact you within 2 hours to confirm and send payment instructions.</p>`);
}

export function reportReadyEmail(orderNumber: string, companyName: string, downloadUrl: string): string {
  return wrap(`<h2>Your Report is Ready</h2>
    <p>Your report <strong>${orderNumber}</strong> for <strong>${companyName}</strong> has been completed.</p>
    <p><a href="${downloadUrl}" style="display: inline-block; background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Download Report</a></p>`);
}

export function orderConfirmedEmail(orderNumber: string, dueDate: string): string {
  return wrap(`<h2>Order Confirmed</h2>
    <p>Your order <strong>${orderNumber}</strong> is now in progress.</p>
    <p>Expected delivery: <strong>${dueDate}</strong></p>`);
}
