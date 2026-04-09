const { OpenAI } = require('openai');
const o = new OpenAI({ apiKey: 'test' });
console.log('chat in o:', !!o.chat);
if (o.chat) console.log('completions in chat:', !!o.chat.completions);
if (o.chat && o.chat.completions) console.log('create in completions:', !!o.chat.completions.create);
