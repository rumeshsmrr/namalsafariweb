import {
  PARK_LABELS,
  SAFARI_TYPE_LABELS,
  TIME_SLOT_LABELS,
  MEAL_PLAN_LABELS,
  MEAL_PREFERENCE_LABELS,
  type PaymentRequest,
} from "@/lib/payment-storage";

export interface BookingEmailData {
  pr: PaymentRequest;
  transactionId: string;
  paidAt: string; // ISO string
}

function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  });
}

function row(label: string, value: string, highlight = false): string {
  return `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #e8f5ea;font-size:13px;color:#666666;width:40%;vertical-align:top;">
        ${label}
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #e8f5ea;font-size:14px;color:${highlight ? "#011d07" : "#333333"};font-weight:${highlight ? "700" : "500"};vertical-align:top;">
        ${value}
      </td>
    </tr>`;
}

export function buildBookingConfirmationEmail(data: BookingEmailData): {
  subject: string;
  html: string;
} {
  const { pr, transactionId, paidAt } = data;
  // Email images must use a public HTTPS URL (not localhost).
  const emailAssetBase =
    process.env.EMAIL_PUBLIC_URL?.replace(/\/$/, "") ?? "https://nimalsafari.com";
  const logoUrl = `${emailAssetBase}/Images/logo.png`;

  const parkLabel = pr.park ? PARK_LABELS[pr.park] : null;
  const safariTypeLabel = pr.safariType
    ? SAFARI_TYPE_LABELS[pr.safariType]
    : null;
  const timeSlotLabel = pr.timeSlot ? TIME_SLOT_LABELS[pr.timeSlot] : null;
  const mealPlanLabel = pr.mealPlan ? MEAL_PLAN_LABELS[pr.mealPlan] : null;
  const mealPrefLabel =
    pr.mealPreference && pr.mealPreference !== "NONE"
      ? MEAL_PREFERENCE_LABELS[pr.mealPreference]
      : null;

  const subject = `Booking Confirmed – ${pr.shortRef} | Nimal Safari`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f2fff5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Your safari booking is confirmed! Booking reference: ${pr.shortRef}. We look forward to welcoming you.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2fff5;padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- ══ OUTER CARD ══ -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(1,29,7,0.10);">

          <!-- ══ HEADER ══ -->
          <tr>
            <td style="background-color:#011d07;padding:36px 40px;text-align:center;">
              <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:32px;
                font-weight:700;letter-spacing:0.5px;line-height:1.2;">
                <span style="color:#ffffff;">Nimal</span><span style="color:#fab226;">Safari</span>
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td style="background-color:#ffffff;padding:12px 20px;border-radius:12px;text-align:center;">
                    <img src="${logoUrl}" alt="" width="180" height="64"
                      style="display:block;margin:0 auto;border:0;outline:none;max-width:180px;height:auto;" />
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 14px 0;color:#f2fff5;font-family:Arial,Helvetica,sans-serif;
                font-size:14px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">
                NimalSafari
              </p>
              <p style="margin:0;color:#fab226;font-family:Arial,Helvetica,sans-serif;font-size:11px;
                letter-spacing:4px;text-transform:uppercase;font-weight:700;">
                Wildlife Safari · Sri Lanka
              </p>
            </td>
          </tr>

          <!-- ══ CONFIRMATION BANNER ══ -->
          <tr>
            <td style="background-color:#fab226;padding:36px 40px;text-align:center;">
              <!-- Checkmark circle -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px auto;">
                <tr>
                  <td style="background-color:#011d07;border-radius:50%;width:60px;height:60px;
                    text-align:center;vertical-align:middle;">
                    <span style="color:#fab226;font-size:30px;line-height:60px;font-weight:700;">✓</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0 0 8px 0;color:#011d07;font-family:Arial,sans-serif;
                font-size:30px;font-weight:700;letter-spacing:-0.5px;">
                Booking Confirmed!
              </h1>
              <p style="margin:0;color:#011d07;font-family:Arial,sans-serif;font-size:15px;opacity:0.75;">
                Your safari adventure is all set
              </p>
            </td>
          </tr>

          <!-- ══ GREETING ══ -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 40px 24px 40px;">
              <p style="margin:0 0 12px 0;color:#011d07;font-family:Arial,sans-serif;font-size:16px;font-weight:700;">
                Dear ${pr.customerName},
              </p>
              <p style="margin:0;color:#444444;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;">
                Thank you for booking with <strong style="color:#011d07;">Nimal Safari</strong>.
                Your payment has been received and your safari experience is officially confirmed.
                We can't wait to take you into the wild!
              </p>
            </td>
          </tr>

          <!-- ══ BOOKING DETAILS ══ -->
          <tr>
            <td style="background-color:#ffffff;padding:0 40px 8px 40px;">
              <!-- Section label -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:#fab226;width:4px;border-radius:4px;">&nbsp;</td>
                        <td style="padding-left:10px;color:#011d07;font-family:Arial,sans-serif;
                          font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                          Booking Details
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Details table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border-radius:10px;overflow:hidden;border:1px solid #e8f5ea;">
                ${row("Booking Reference", `<span style="font-family:monospace;background:#f2fff5;padding:2px 8px;border-radius:4px;border:1px solid #c8e6c9;">${pr.shortRef}</span>`, true)}
                ${parkLabel ? row("Safari Park", parkLabel) : ""}
                ${safariTypeLabel ? row("Safari Type", safariTypeLabel) : ""}
                ${pr.safariDate ? row("Safari Date", formatDate(pr.safariDate)) : row("Safari Date", '<span style="color:#999;">To be confirmed — our team will contact you</span>')}
                ${timeSlotLabel ? row("Time Slot", timeSlotLabel) : ""}
                ${pr.guests != null ? row("Number of Guests", String(pr.guests)) : ""}
                ${mealPlanLabel && pr.mealPlan !== "NONE" ? row("Meal Plan", mealPlanLabel) : ""}
                ${mealPrefLabel ? row("Meal Preference", mealPrefLabel) : ""}
                ${pr.packageName ? row("Package", pr.packageName) : ""}
                ${pr.notes ? row("Special Notes", pr.notes) : ""}
                <tr>
                  <td style="padding:12px 16px;font-size:13px;color:#666666;width:40%;vertical-align:middle;">
                    Total Amount Paid
                  </td>
                  <td style="padding:12px 16px;vertical-align:middle;">
                    <span style="background-color:#011d07;color:#fab226;font-family:Arial,sans-serif;
                      font-size:16px;font-weight:700;padding:4px 14px;border-radius:6px;display:inline-block;">
                      ${formatMoney(pr.amount, pr.currency)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ TRANSACTION DETAILS ══ -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 40px 8px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:#fab226;width:4px;border-radius:4px;">&nbsp;</td>
                        <td style="padding-left:10px;color:#011d07;font-family:Arial,sans-serif;
                          font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                          Payment Receipt
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border-radius:10px;overflow:hidden;border:1px solid #e8f5ea;">
                ${row("Transaction ID", `<span style="font-family:monospace;font-size:12px;">${transactionId}</span>`)}
                ${row("Payment Date & Time", formatDateTime(paidAt))}
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#666666;width:40%;vertical-align:middle;">
                    Payment Status
                  </td>
                  <td style="padding:10px 16px;vertical-align:middle;">
                    <span style="background-color:#d4edda;color:#155724;font-size:13px;font-weight:700;
                      padding:3px 12px;border-radius:20px;display:inline-block;">
                      ✓ &nbsp;PAID
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ WHAT TO BRING ══ -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 40px 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f2fff5;border-radius:10px;border:1px solid #c8e6c9;padding:20px 24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 12px 0;color:#011d07;font-family:Arial,sans-serif;
                      font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                      🎒 What to Bring
                    </p>
                    <ul style="margin:0;padding:0 0 0 20px;color:#444444;font-family:Arial,sans-serif;font-size:14px;line-height:1.9;">
                      <li>Comfortable, neutral-coloured clothing (khaki, olive, beige)</li>
                      <li>Sunscreen, wide-brimmed hat &amp; sunglasses</li>
                      <li>Insect repellent &amp; a reusable water bottle</li>
                      <li>Camera or binoculars for wildlife spotting</li>
                      <li><strong>National ID or Passport</strong> — required at park entry gates</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ DIVIDER ══ -->
          <tr>
            <td style="background-color:#ffffff;padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e8f5ea;margin:0;" />
            </td>
          </tr>

          <!-- ══ CONTACT ══ -->
          <tr>
            <td style="background-color:#ffffff;padding:28px 40px 32px 40px;">
              <p style="margin:0 0 16px 0;color:#011d07;font-family:Arial,sans-serif;
                font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                Need Help?
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:8px;">
                    <span style="font-size:15px;">📧</span>
                    <a href="mailto:nimalsafariyala@gmail.com"
                      style="color:#011d07;font-family:Arial,sans-serif;font-size:14px;
                      text-decoration:none;margin-left:8px;">
                      nimalsafariyala@gmail.com
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:8px;">
                    <span style="font-size:15px;">📞</span>
                    <a href="tel:+94767627295"
                      style="color:#011d07;font-family:Arial,sans-serif;font-size:14px;
                      text-decoration:none;margin-left:8px;">
                      +94 76 762 7295
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="font-size:15px;">📍</span>
                    <span style="color:#011d07;font-family:Arial,sans-serif;font-size:14px;margin-left:8px;">
                      Tissamaharama, Southern Province, Sri Lanka
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ FOOTER ══ -->
          <tr>
            <td style="background-color:#011d07;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
              <!-- Social links -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="https://web.facebook.com/profile.php?id=61579240436619"
                      style="color:#fab226;font-family:Arial,sans-serif;font-size:12px;
                      text-decoration:none;letter-spacing:1px;">
                      Facebook
                    </a>
                  </td>
                  <td style="color:#fab226;opacity:0.4;">·</td>
                  <td style="padding:0 8px;">
                    <a href="https://www.instagram.com/nimalsafari"
                      style="color:#fab226;font-family:Arial,sans-serif;font-size:12px;
                      text-decoration:none;letter-spacing:1px;">
                      Instagram
                    </a>
                  </td>
                  <td style="color:#fab226;opacity:0.4;">·</td>
                  <td style="padding:0 8px;">
                    <a href="https://www.tripadvisor.com/Attraction_Review-g1102395-d5512904-Reviews-Nimal_Safari-Tissamaharama_Southern_Province.html"
                      style="color:#fab226;font-family:Arial,sans-serif;font-size:12px;
                      text-decoration:none;letter-spacing:1px;">
                      TripAdvisor
                    </a>
                  </td>
                  <td style="color:#fab226;opacity:0.4;">·</td>
                  <td style="padding:0 8px;">
                    <a href="https://www.pinterest.com/nimalsafariyala/"
                      style="color:#fab226;font-family:Arial,sans-serif;font-size:12px;
                      text-decoration:none;letter-spacing:1px;">
                      Pinterest
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px 0;color:#f2fff5;font-family:Arial,sans-serif;font-size:12px;opacity:0.6;">
                © ${new Date().getFullYear()} Nimal Safari · All rights reserved
              </p>
              <p style="margin:0;color:#f2fff5;font-family:Arial,sans-serif;font-size:11px;opacity:0.4;">
                This is an automated confirmation email. Please do not reply to this message.
              </p>
            </td>
          </tr>

        </table>
        <!-- ══ END OUTER CARD ══ -->

      </td>
    </tr>
  </table>

</body>
</html>`;

  return { subject, html };
}
