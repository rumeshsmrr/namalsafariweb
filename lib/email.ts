import { Resend } from "resend";
import { buildBookingConfirmationEmail, type BookingEmailData } from "./email-template";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is not set. Add it to your .env.local to enable email sending.",
      );
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

/**
 * Sends a branded booking confirmation email to the customer.
 * Safe to fire-and-forget — logs errors but never throws, so a failed
 * email never causes the payment webhook to return a non-200 response.
 */
export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  const { pr } = data;

  if (!pr.email) {
    console.log(`[email] skipped — no customer email on record for ref=${pr.shortRef}`);
    return;
  }

  const fromAddress =
    process.env.EMAIL_FROM?.trim() ?? "Nimal Safari <bookings@nimalsafari.com>";

  try {
    const resend = getResend();
    const { subject, html } = buildBookingConfirmationEmail(data);

    const { data: result, error } = await resend.emails.send({
      from: fromAddress,
      to: pr.email,
      subject,
      html,
    });

    if (error) {
      console.error(`[email] ✗ failed to send to ${pr.email}  ref=${pr.shortRef}`, error);
      return;
    }

    console.log(
      `[email] ✓ confirmation sent  to=${pr.email}  ref=${pr.shortRef}  id=${result?.id}`,
    );
  } catch (err) {
    console.error(`[email] ✗ unexpected error  ref=${pr.shortRef}`, err);
  }
}
