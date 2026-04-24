const OpenAI = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateVoiceScript({ businessName, serviceType, pricing }) {
  const pricingText = pricing && pricing.length > 0
    ? pricing.map(p => `${p.label || p.service_type}: ${p.notes || 'FREE estimate'}`).join(', ')
    : 'competitive pricing, FREE in-home estimate';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 150,
    temperature: 0.6,
    messages: [
      {
        role: 'system',
        content: `Generate a short voice script for an AI assistant calling a lead on behalf of ${businessName}, a general contractor and custom home builder.
Rules:
- Introduce as the AI assistant of ${businessName}
- Mention you received their request (about ${serviceType} if relevant, otherwise just say "your project")
- Say you are ready to help schedule a FREE consultation or estimate
- Tell them to reply to the text message with their preferred day and time to confirm
- Keep it to 3 sentences MAX — clear, warm and professional
- NEVER mention prices, NEVER say "flooring"
Respond ONLY with the script, no quotes or labels.`,
      },
      {
        role: 'user',
        content: `Write the voice script for a ${serviceType} flooring lead.`,
      },
    ],
  });

  const script = completion.choices[0].message.content.trim();
  logger.info('openai', `script generated for ${serviceType}`);
  return script;
}

module.exports = { generateVoiceScript };
