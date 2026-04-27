const { google } = require('googleapis');
const logger = require('../utils/logger');

function getAuthClient(refreshToken) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

async function createFollowUpEvent({ refreshToken, calendarId, leadPhone, serviceType, message, voiceScript }) {
  const auth = getAuthClient(refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setMinutes(0, 0, 0);

  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  const event = {
    summary: `Estimate: Customer – ${serviceType}`,
    description: `NEW LEAD\n\nPhone: ${leadPhone}\nService: ${serviceType}\n\nMessage:\n${message}\n\nAI Voice Script:\n${voiceScript}\n\n⚠️ Please confirm or reschedule.`,
    start: { dateTime: start.toISOString() },
    end:   { dateTime: end.toISOString() },
  };

  const res = await calendar.events.insert({ calendarId, requestBody: event });
  logger.info('calendar', `event created id=${res.data.id}`);
  return res.data;
}

async function createConfirmedEvent({ refreshToken, calendarId, leadPhone, leadName, serviceType, scheduledAt, address }) {
  const auth = getAuthClient(refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });

  const start = new Date(scheduledAt);
  const end   = new Date(start.getTime() + 60 * 60 * 1000);

  const event = {
    summary: `✅ Estimate: ${leadName} – ${serviceType}`,
    location: address || '',
    description: `CONFIRMED APPOINTMENT\n\nClient: ${leadName}\nPhone: +${leadPhone}\nService: ${serviceType}\nAddress: ${address || 'Pending'}\n\nBooked via LeadPilot AI.`,
    start: { dateTime: start.toISOString() },
    end:   { dateTime: end.toISOString() },
  };

  const res = await calendar.events.insert({ calendarId, requestBody: event });
  logger.info('calendar', `confirmed event created id=${res.data.id}`);
  return res.data;
}

async function updateEventAddress({ refreshToken, calendarId, leadPhone, address, scheduledAt }) {
  const auth = getAuthClient(refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });

  // Find event by searching for the lead phone in upcoming events
  const timeMin = new Date(scheduledAt);
  timeMin.setHours(timeMin.getHours() - 1);
  const timeMax = new Date(scheduledAt);
  timeMax.setHours(timeMax.getHours() + 1);

  try {
    const list = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      q: leadPhone,
    });

    const event = list.data.items && list.data.items[0];
    if (!event) return;

    await calendar.events.patch({
      calendarId,
      eventId: event.id,
      requestBody: {
        location: address,
        summary: event.summary.replace('Estimate:', '✅ Estimate:'),
        description: (event.description || '') + `\n\n📍 Address confirmed: ${address}`,
      },
    });
    logger.info('calendar', `event updated with address for ${leadPhone}`);
  } catch (err) {
    logger.error('calendar', `updateEventAddress failed: ${err.message}`);
  }
}

module.exports = { createFollowUpEvent, createConfirmedEvent, updateEventAddress };
