const RESEND_API_URL = "https://api.resend.com/emails";

export const sendMail = async ({ to, subject, html, text }) => {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true, reason: "RESEND_API_KEY is not configured" };
  }

  if (!to) {
    return { skipped: true, reason: "Recipient email is missing" };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "MotoRentix <onboarding@resend.dev>",
      to,
      subject,
      html,
      text,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || "Failed to send email";
    throw new Error(message);
  }

  return data;
};
