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

module.exports = { createFollowUpEvent };
