import nodemailer from 'nodemailer';

function summary(response) {
  return `<div style="font-family:Arial,sans-serif;color:#4b2944"><h1>${response.answer === 'yes' ? 'A date is official ❤️' : 'A thoughtful answer was received'}</h1><p><b>Guest:</b> ${response.guestName} (${response.guestPhone})</p><p><b>Restaurant:</b> ${response.restaurant || response.movie || response.detail || '—'}</p><p><b>Cuisine:</b> ${response.cuisine || '—'}</p><p><b>Foods:</b> ${(response.foods || []).join(', ') || '—'}</p><p><b>Desserts & drinks:</b> ${(response.desserts || []).join(', ') || '—'}</p><p><b>Date:</b> ${response.dateDate || response.date || '—'} at ${response.dateTime || response.time || '—'}</p><p><b>Location:</b> ${response.location || '—'}</p><p><b>Message:</b> ${response.message || response.noReason || '—'}</p></div>`;
}

function mailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
}

export async function sendOwnerEmail(response) {
  const transport = mailer();
  if (!transport || !response.ownerEmail) return { skipped: true, channel: 'email' };
  return transport.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to: response.ownerEmail, subject: 'Your Date With Me response is here 💌', html: summary(response) });
}

export async function sendGuestEmail(response) {
  const transport = mailer();
  if (!transport || !response.guestEmail) return { skipped: true, channel: 'email' };
  return transport.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to: response.guestEmail, subject: 'Thank you for your date answer ❤️', html: `<p>Thank you, ${response.guestName}. Your answer is safely with us.</p>${summary(response)}` });
}

async function sendTwilio(to, body, channel = "sms") {
  if (
    !to ||
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_FROM
  ) {
    return { skipped: true };
  }

  const params = new URLSearchParams({
    To: channel === "whatsapp" ? `whatsapp:${to}` : to,
    From:
      channel === "whatsapp"
        ? `whatsapp:${process.env.TWILIO_FROM}`
        : process.env.TWILIO_FROM,
    Body: body,
  });

  const auth = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString("base64");

  const result = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }
  );

  const data = await result.json();

  console.log("Twilio Response:", data);

  if (!result.ok) {
    throw new Error(data.message);
  }

  return data;
}

// export async function sendOwnerWhatsApp(response) {
//   return sendTwilio(response.ownerPhone, `Date With Me response from ${response.guestName}: ${response.answer}. ${response.dateDate || ''} ${response.dateTime || ''} at ${response.location || ''}. Foods: ${(response.foods || []).join(', ')}. Message: ${response.message || response.noReason || ''}`);
// }
export async function sendOwnerSMS(response) {
  return sendTwilio(
    response.ownerPhone,
    `💖 Date With Me Response

Name: ${response.guestName}
Phone: ${response.guestPhone}

Restaurant: ${response.restaurant || "-"}

Cuisine: ${response.cuisine || "-"}

Food: ${(response.foods || []).join(", ")}

Dessert: ${(response.desserts || []).join(", ")}

Date: ${response.dateDate}
Time: ${response.dateTime}

Location: ${response.location}

Message:
${response.message || response.noReason || "-"}`,
    "sms"
  );
}

export async function sendGuestWhatsApp(response) {
  return sendTwilio(response.guestPhone, `Thank you ${response.guestName} ❤️ Your answer is safely received.`);
}

// export async function notifyResponse(response) {
//   const results = await Promise.allSettled([
//     sendOwnerSMS(response),          // SMS owner ko
//     sendOwnerEmail(response),        // Email owner ko
//     sendGuestEmail(response),        // Email guest ko
//   ]);

//   console.log("Notification Results:");
//   console.log(results);

//   return results;
// }

export async function notifyResponse(response) {
  const results = await Promise.allSettled([
    sendOwnerSMS(response),     // SMS owner ko
    sendOwnerEmail(response),   // Email owner ko
    sendGuestEmail(response),   // Email guest ko
  ]);

  console.log("Notification Results:");
  console.log(results);

  return results;
}

// const ownerWhatsAppMessage = encodeURIComponent(`
// 💖 New Date Response

// Name: ${response.guestName}
// Phone: ${response.guestPhone}

// Answer: ${response.answer}

// Restaurant: ${response.restaurant || "-"}

// Cuisine: ${response.cuisine || "-"}

// Food: ${(response.foods || []).join(", ")}

// Dessert: ${(response.desserts || []).join(", ")}

// Date: ${response.dateDate}
// Time: ${response.dateTime}

// Location: ${response.location}

// Message:
// ${response.message || response.noReason || "-"}
// `);

// const whatsappUrl = `https://wa.me/${response.ownerPhone.replace("+", "")}?text=${ownerWhatsAppMessage}`;

// res.status(201).json({
//   success: true,
//   message: "Response Saved ❤️",
//   whatsappUrl,
// });