const OpenAI = require('openai');
const logger = require('../utils/logger');

let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

async function generateVoiceScript({ businessName, serviceType, pricing, systemPrompt }) {
  const pricingText = pricing && pricing.length > 0
    ? pricing.map(p => `${p.label || p.service_type}: ${p.notes || 'FREE estimate'}`).join(', ')
    : 'FREE in-home estimate';

  const defaultPrompt = `Generate a short, warm voice script for an AI assistant calling a lead on behalf of ${businessName}.
Rules:
- Introduce as the assistant of ${businessName}
- Mention you received their ${serviceType.replace(/_/g, ' ')} request
- Say you are ready to help schedule a FREE estimate or consultation
- Ask them to reply to the text message with their preferred day and time
- Max 3 sentences — clear, warm, professional
- NEVER mention specific prices
Respond ONLY with the script, no quotes or labels.`;

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 150,
    temperature: 0.6,
    messages: [
      { role: 'system', content: systemPrompt || defaultPrompt },
      { role: 'user',   content: `Write the voice script for a ${serviceType.replace(/_/g, ' ')} request.` },
    ],
  });

  const script = completion.choices[0].message.content.trim();
  logger.info('openai', `script generated for ${businessName} / ${serviceType}`);
  return script;
}

module.exports = { generateVoiceScript };
