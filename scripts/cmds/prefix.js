const fs = require("fs-extra");
const axios = require("axios");
const { utils } = global;

module.exports = {
    config: {
        name: "prefix",
        version: "1.8",
        author: "Priyanshi Kaur",
        countDown: 5,
        role: 0,
        description: "Change the command prefix for Lord𖣘King Bot V2 or view bot information",
        category: "config",
        guide: {
            en: "   {pn}: show bot information and current prefix"
                + "\n   {pn} <new prefix>: change new prefix in your box chat"
                + "\n   Example: {pn} #"
                + "\n   {pn} <new prefix> -g: change new prefix in system bot (only admin bot)"
                + "\n   Example: {pn} # -g"
                + "\n   {pn} reset: change prefix in your box chat to default"
        }
    },

    langs: {
        en: {
            reset: "Your prefix has been reset to default: %1",
            onlyAdmin: "Only admin can change prefix of system bot",
            confirmGlobal: "Please react to this message with any emoji to confirm changing the prefix of Lord𖣘King Bot V2",
            confirmThisThread: "Please react to this message with any emoji to confirm changing the prefix in your chat box",
            successGlobal: "Changed prefix of Lord𖣘King Bot V2 to: %1",
            successThisThread: "Changed prefix in your chat box to: %1",
            botInfo: "✨ Lord𖣘King Bot V2 - Your Cool Assistant ✨\n\n"
                + "🌸 Current system prefix: %1\n"
                + "🎀 Current chat box prefix: %2\n\n"
                + "Available commands:\n"
                + "🤖 AI - Always here to help you, your assistant\n"
                + "🎨 Flux - No prefix cmd, allows you to generate your imagination\n"
                + "🧠 -g - Gemini 1.5 flash response to your every question and image reply support\n"
                + "🎵 -sing - Listen songs from youtube search by the name.\n\n"
                + "Feel free to ask me anything! I'm here to make your day brighter! 💖",
            error: "❌ An error occurred while fetching the meme. Please try again."
        }
    },

    onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
        try {
            if (!args[0]) {
                const memeApi = "https://meme-api.com/gimme";
                const response = await axios.get(memeApi);
                
                if (response.data && response.data.url) {
                    const memeAttachment = await global.utils.getStreamFromURL(response.data.url);
                    if (!memeAttachment) throw new Error("Failed to get meme attachment");

                    return message.reply({
                        body: getLang("botInfo", global.GoatBot.config.prefix, utils.getPrefix(event.threadID)),
                        attachment: memeAttachment
                    });
                }
                throw new Error("Invalid meme data");
            }

            if (args[0] == 'reset') {
                await threadsData.set(event.threadID, null, "data.prefix");
                return message.reply(getLang("reset", global.GoatBot.config.prefix));
            }

            const newPrefix = args[0];
            const formSet = {
                commandName,
                author: event.senderID,
                newPrefix
            };

            if (args[1] === "-g") {
                if (role < 2) return message.reply(getLang("onlyAdmin"));
                formSet.setGlobal = true;
            } else {
                formSet.setGlobal = false;
            }

            return message.reply(args[1] === "-g" ? getLang("confirmGlobal") : getLang("confirmThisThread"), (err, info) => {
                formSet.messageID = info.messageID;
                global.GoatBot.onReaction.set(info.messageID, formSet);
            });
        } catch (error) {
            console.error(error);
            return message.reply(getLang("error"));
        }
    },

    onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
        const { author, newPrefix, setGlobal } = Reaction;
        if (event.userID !== author)
            return;
        if (setGlobal) {
            global.GoatBot.config.prefix = newPrefix;
            fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
            return message.reply(getLang("successGlobal", newPrefix));
        }
        else {
            await threadsData.set(event.threadID, newPrefix, "data.prefix");
            return message.reply(getLang("successThisThread", newPrefix));
        }
    },

    onChat: async function ({ event, message, getLang }) {
        if (event.body && event.body.toLowerCase() === "prefix") {
            try {
                const memeApi = "https://meme-api.com/gimme";
                const response = await axios.get(memeApi);
                
                if (response.data && response.data.url) {
                    const memeAttachment = await global.utils.getStreamFromURL(response.data.url);
                    if (!memeAttachment) throw new Error("Failed to get meme attachment");

                    return message.reply({
                        body: getLang("botInfo", global.GoatBot.config.prefix, utils.getPrefix(event.threadID)),
                        attachment: memeAttachment
                    });
                }
                throw new Error("Invalid meme data");
            } catch (error) {
                console.error(error);
                return message.reply(getLang("error"));
            }
        }
    }
};
