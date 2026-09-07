import Response from '../models/Response.js';
import Invitation from '../models/Invitation.js';
import { notifyResponse } from '../services/notificationService.js';

export async function createResponse(req, res) {
  const userAgent = req.get('user-agent') || '';
  const payload = {
    ...req.body,
    restaurant: req.body.restaurant || req.body.restaurantName,
    restaurantName: req.body.restaurantName || req.body.restaurant,
    dateDate: req.body?.dateDate || req.body?.date,
    dateTime: req.body?.dateTime || req.body?.time,
    browser: userAgent.split(')')[0].split('(').pop() || 'unknown',
    device: /mobile|android|iphone|ipad/i.test(userAgent) ? 'mobile' : 'desktop',
    metadata: {
      userAgent,
      timezone: req.body?.timezone,
      browser: userAgent.split(')')[0].split('(').pop() || 'unknown',
      device: /mobile|android|iphone|ipad/i.test(userAgent) ? 'mobile' : 'desktop',
      ipAddress: req.ip
    }
  };
  const invitation = await Invitation.findOne({ inviteCode: payload.inviteCode, status: 'active' }).lean();
  if (!invitation) return res.status(404).json({ message: 'Invitation not found or no longer active.' });
  payload.ownerPhone = invitation.ownerPhone;
  payload.ownerEmail = invitation.ownerEmail;
  if (!['yes', 'no'].includes(payload.answer)) {
    return res.status(400).json({ message: 'Please choose yes or no.' });
  }
  if (payload.answer === 'yes' && (!payload.dateType || !payload.dateDate || !payload.dateTime || !payload.location)) {
    return res.status(400).json({ message: 'Please complete the date, time, and location before sending.' });
  }
  if (payload.answer === 'no' && !payload.noReason && !payload.message) {
    return res.status(400).json({ message: 'Please share a short reason or message.' });
  }

  if (!payload.guestName?.trim() || !payload.guestPhone?.trim()) {
    return res.status(400).json({ message: 'Your name and phone number are required.' });
  }
  const response = await Response.create(payload);
  await notifyResponse(response.toObject());

  const ownerWhatsAppMessage = encodeURIComponent(`
💖 New Date Response

Name: ${response.guestName}
Phone: ${response.guestPhone}

Answer: ${response.answer}

// Restaurant: ${response.restaurant || "-"}

Restaurant: ${response.restaurantName || response.restaurant || "-"}

Cuisine: ${response.cuisine || "-"}

Food: ${(response.foods || []).join(", ")}

Dessert: ${(response.desserts || []).join(", ")}

Date: ${response.dateDate}
Time: ${response.dateTime}

Location: ${response.location}

Message:
${response.message || response.noReason || "-"}
`);

  const whatsappUrl = `https://wa.me/${response.ownerPhone.replace("+", "")}?text=${ownerWhatsAppMessage}`;

  res.status(201).json({
    success: true,
    message: "Your answer is safely tucked away. 💌",
    id: response._id,
    whatsappUrl,
  });
}
