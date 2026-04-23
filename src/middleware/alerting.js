const twilio = require('twilio');
const logger = require('../utils/logger');
const db = require('../services/supabase');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const lastAlertAt = {};

async function sendAlert(service, message) {
  const alertPhone = process.env.ALERT_PHONE;
  if (!alertPhone) return;

  const now = Date.now();
  const cooldown = 5 * 60 * 1000;
  if (lastAlertAt[service] && now - lastAlertAt[service] < cooldown) return;

  lastAlertAt[service] = now;
  const body = `SYSTEM ALERT – ${service} failed: ${message.slice(0, 120)}`;

  try {
    await client.messages.create({ to: alertPhone, from: process.env.TWILIO_FROM_ALERT || process.env.ALERT_FROM, body });
  } catch (err) {
    logger.error('alerting', 'failed to send alert SMS', err.message);
  }
}

function isCritical(service) {
  return ['twilio', 'supabase'].includes(service);
}

async function handleError(service, err) {
  const msg = err && err.message ? err.message : String(err);
  const stack = err && err.stack ? err.stack : '';
  const level = isCritical(service) ? 'CRITICAL' : 'WARNING';

  logger.error(service, `[${level}] ${msg}`);

  try {
    await db.saveError(service, level, msg, stack);
  } catch (_) {}

  if (level === 'CRITICAL') {
    await sendAlert(service, msg).catch(() => {});
  }
}

module.exports = { handleError };
