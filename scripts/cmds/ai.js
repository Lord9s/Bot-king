const axios = require('axios');

let PriyaPrefix = [
  'lord',
  'ai',
  '-ai',
  'darc', // Add Your Prefix Here
];

const axiosInstance = axios.create();

module.exports = {
  config: {
    name: 'ai',
    version: '2.2.0',
    role: 0,
    category: '𝘈𝘪',
    author: 'Priyanshi Kaur 🩶 Priyansh Rajput',
    shortDescription: 'Artificial Intelligence',
    longDescription: 'Ask Anything To Ai For Your Answers',
  },

  onStart: async function () {},

  onChat: async function ({ message, event, args, api, threadID, messageID }) {
    const command = args[0]?.toLowerCase();

    // Help Command
    if (command === 'help') {
      const helpMessage = `
      🌟 𝘈𝘪 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 🌟
      - Prefixes: ${PriyaPrefix.join(', ')}
      - Add Prefix𝘭: addprefix <prefix>
      - AI Query: ${PriyaPrefix[0]} <your query>
      - Say Hi: hi
      `;
      await message.reply(helpMessage);
      return;
    }

    // Add New Prefix Command
    if (command === 'addprefix') {
      const newPrefix = args[1];
      if (newPrefix && !PriyaPrefix.includes(newPrefix)) {
        PriyaPrefix.push(newPrefix);
        await message.reply(`New prefix "${newPrefix}" added successfully!`);
      } else {
        await message.reply('Please provide a valid and unique prefix.');
      }
      return;
    }

    // Check for prefixes in the message
    const ahprefix = PriyaPrefix.find((p) => event.body && event.body.toLowerCase().startsWith(p));
    if (!ahprefix) {
      return;
    }

    const priya = event.body.substring(ahprefix.length).trim();
    if (!priya) {
      await message.reply('𝙺𝚒𝚗𝚑 𝐼𝑠 𝐻𝑒𝑟𝑒 𝑇𝑜 𝐻𝑒𝑙𝑝 𝑌𝑜𝑢 𝙾𝚗 𝙰𝚗𝚢𝚝𝚑𝚒𝚗𝚐✪');
      return;
    }

    const apply = [
      '𝚎𝚗𝚝𝚎𝚛 (𝚚)*',
      '𝙷𝚘𝚠 𝙲𝚊𝚗 𝙸 𝙷𝚎𝚕𝚙 𝚈𝚘𝚞?',
      '𝚀𝚞𝚊𝚛𝚢 𝙿𝚕𝚎𝚊𝚜𝚎....',
      '𝙷𝚘𝚠 𝙲𝚊𝚗 𝙸 𝙰𝚜𝚜𝚒𝚜𝚝 𝚈𝚘𝚞?',
      '𝙶𝚛𝚎𝚎𝚝𝚒𝚗𝚐𝚜!',
      '𝙸𝚜 𝚃𝚑𝚎𝚛𝚎 𝚊𝚗𝚢𝚝𝚑𝚒𝚗𝚐 𝙴𝚕𝚜𝚎 𝙸 𝙲𝚊𝚗 𝙳𝚘?'
    ];
    const randomapply = apply[Math.floor(Math.random() * apply.length)];

    if (command === 'hi') {
      await message.reply(randomapply);
      return;
    }

    // Remove AI-related words from the query
    const cleanedQuery = priya.replace(/\b(ai|queen|\.ai)\b/gi, '').trim();
    const encodedPrompt = encodeURIComponent(cleanedQuery);

    // Send the initial waiting message
    const waitingMessage = await message.reply('𝙺𝚒𝚗𝚐 𝚃𝚑𝚒𝚗𝚔𝚒𝚗𝚐.....');

    try {
      // Call the AI API
      const response = await axiosInstance.get(`https://priyansh-ai.onrender.com/gemini/ai?query=${encodedPrompt}`);
      const Priya = response.data;
      const priyares = `${Priya}`;

      // Edit the waiting message with the AI response
      await api.editMessage(priyares, waitingMessage.messageID);

    } catch (error) {
      // Handle any errors and update the waiting message
      await api.editMessage('Oops! Something went wrong. Please try again later.', waitingMessage.messageID);
    }
  }
};
