const twilio = require('twilio');
const logger = require('../utils/logger');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function makeCall({ to, from, voiceScript, statusCallbackUrl }) {
  const twiml = `<Response>
  <Pause length="1"/>
  <Say voice="Polly.Joanna" language="en-US">${voiceScript}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna" language="en-US">Please reply to this number with your preferred date and time. Thank you and have a great day!</Say>
</Response>`;

  const call = await client.calls.create({
    to,
    from,
    twiml,
    statusCallback: statusCallbackUrl,
    statusCallbackMethod: 'POST',
    machineDetection: 'Enable',
  });

  logger.info('twilio', `call initiated sid=${call.sid} to=${to}`);
  return call;
}

async function sendSms({ to, from, body }) {
  const msg = await client.messages.create({ to, from, body });
  logger.info('twilio', `sms sent sid=${msg.sid} to=${to}`);
  return msg;
}

function validateSignature(req) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers['x-twilio-signature'];
  const url = process.env.BASE_URL + req.originalUrl;
  return twilio.validateRequest(authToken, signature, url, req.body);
}

module.exports = { makeCall, sendSms, validateSignature };
