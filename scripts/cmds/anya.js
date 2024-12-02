const axios = require('axios');
const fs = require('fs');

const CHAT_STYLES = {
    casual: 'casual',
    formal: 'formal',
    friendly: 'friendly',
    sarcastic: 'sarcastic',
    anime: 'anime'
};

const EMOTIONS = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    surprised: '😮',
    love: '😍',
    confused: '😕'
};

module.exports = {
    config: {
        name: 'anya',
        aliases: ['lor', 'chat'],
        version: '2.0.0',
        author: 'Priyanshi Kaur',
        countDown: 5,
        role: 0,
        shortDescription: 'Advanced Anya AI Chat',
        longDescription: 'Chat with Anya AI with multiple personalities and features',
        category: 'AI Chat',
        guide: {
            en: `Anya AI Chat Commands:
1. Basic Chat:
   {pn} <message>
2. Style Selection:
   {pn} style <casual/formal/friendly/sarcastic/anime>
3. Memory Management:
   {pn} remember <fact>
   {pn} forget
4. Settings:
   {pn} on - Enable auto-reply
   {pn} off - Disable auto-reply
5. Mood:
   {pn} mood <happy/sad/angry/surprised/love/confused>
Example: {pn} Hello there!`
        }
    },

    onLoad: function () {
        global.anyaData = global.anyaData || {
            memories: {},
            styles: {},
            moods: {},
            autoReply: new Set()
        };
    },

    onStart: async function ({ api, args, threadsData, message, event, prefix }) {
        const { threadID, messageID, senderID } = event;
        const command = args[0]?.toLowerCase();
        const inputText = args.slice(1).join(" ");

        switch (command) {
            case 'style':
                if (CHAT_STYLES[inputText]) {
                    global.anyaData.styles[threadID] = inputText;
                    return message.reply(`Chat style set to: ${inputText} ${EMOTIONS.happy}`);
                }
                return message.reply(`Available styles: ${Object.keys(CHAT_STYLES).join(', ')}`);

            case 'remember':
                if (!inputText) return message.reply("What should I remember?");
                global.anyaData.memories[threadID] = global.anyaData.memories[threadID] || [];
                global.anyaData.memories[threadID].push(inputText);
                return message.reply(`I'll remember that! ${EMOTIONS.happy}`);

            case 'forget':
                delete global.anyaData.memories[threadID];
                return message.reply(`Memory cleared ${EMOTIONS.surprised}`);

            case 'mood':
                if (EMOTIONS[inputText]) {
                    global.anyaData.moods[threadID] = inputText;
                    return message.reply(`Mood set to: ${inputText} ${EMOTIONS[inputText]}`);
                }
                return message.reply(`Available moods: ${Object.keys(EMOTIONS).join(', ')}`);

            case 'on':
                global.anyaData.autoReply.add(threadID);
                return message.reply(`Auto-reply enabled ${EMOTIONS.happy}`);

            case 'off':
                global.anyaData.autoReply.delete(threadID);
                return message.reply(`Auto-reply disabled ${EMOTIONS.sad}`);

            default:
                try {
                    const style = global.anyaData.styles[threadID] || 'casual';
                    const mood = global.anyaData.moods[threadID] || 'happy';
                    const memories = global.anyaData.memories[threadID] || [];

                    let contextPrompt = `You are Anya, speaking in ${style} style, feeling ${mood}. `;
                    if (memories.length > 0) {
                        contextPrompt += `You remember: ${memories.join(', ')}. `;
                    }

                    const response = await generateResponse(args.join(" "), style, mood);
                    const formattedResponse = `${response} ${EMOTIONS[mood] || ''}`;

                    await message.reply(formattedResponse);
                    
                    saveConversation(threadID, senderID, args.join(" "), response);
                } catch (error) {
                    console.error(error);
                    message.reply(`I'm having trouble responding right now ${EMOTIONS.confused}`);
                }
        }
    },

    onChat: async function ({ api, message, event, args, isUserCallCommand }) {
        const { threadID, senderID } = event;
        
        if (!isUserCallCommand && global.anyaData.autoReply.has(threadID)) {
            if (args.length < 2) return;
            
            try {
                const style = global.anyaData.styles[threadID] || 'casual';
                const mood = global.anyaData.moods[threadID] || 'happy';
                
                const response = await generateResponse(args.join(" "), style, mood);
                const formattedResponse = `${response} ${EMOTIONS[mood] || ''}`;
                
                await message.reply(formattedResponse);
                saveConversation(threadID, senderID, args.join(" "), response);
            } catch (error) {
                console.error(error);
            }
        }
    }
};

async function generateResponse(message, style, mood) {
    try {
        const response = await axios.post('https://api.simsimi.vn/v1/simtalk', 
            new URLSearchParams({
                text: message,
                lc: 'en',
                style: style,
                mood: mood
            })
        );

        if (response.status > 200) {
            throw new Error(response.data.success);
        }

        let aiResponse = response.data.message;
        
        switch (style) {
            case 'anime':
                aiResponse = addAnimeQuirks(aiResponse);
                break;
            case 'sarcastic':
                aiResponse = addSarcasm(aiResponse);
                break;
            case 'formal':
                aiResponse = makeResponseFormal(aiResponse);
                break;
        }

        return aiResponse;
    } catch (error) {
        console.error('Response Generation Error:', error);
        throw error;
    }
}

function addAnimeQuirks(text) {
    const animeExpressions = ['uwu', 'owo', '*blushes*', '*headpats*', 'nya~'];
    return `${text} ${animeExpressions[Math.floor(Math.random() * animeExpressions.length)]}`;
}

function addSarcasm(text) {
    return `${text} *rolls eyes*`;
}

function makeResponseFormal(text) {
    return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}

function saveConversation(threadID, userID, userMessage, botResponse) {
    const conversationLog = {
        timestamp: new Date().toISOString(),
        threadID,
        userID,
        userMessage,
        botResponse
    };

    const logDir = 'anya_logs';
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    const logFile = `${logDir}/conversation_${threadID}.json`;
    let conversations = [];
    
    if (fs.existsSync(logFile)) {
        conversations = JSON.parse(fs.readFileSync(logFile));
    }
    
    conversations.push(conversationLog);
    fs.writeFileSync(logFile, JSON.stringify(conversations, null, 2));
}
