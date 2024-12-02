const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const doNotDelete = "[ KingBotV2 ]";

module.exports = {
    config: {
        name: "help",
        version: "2.0",
        author: "Priyanshi Kaur",
        countDown: 5,
        role: 0,
        shortDescription: {
            en: "View command information and usage"
        },
        longDescription: {
            en: "Display detailed information about commands, including usage, categories, and permissions"
        },
        category: "system",
        guide: {
            en: "{pn} [blank | <page> | <command>]"
                + "\n• {pn} [-all]: Show all commands"
                + "\n• {pn} [-c | category]: List commands by category"
                + "\n• {pn} <command> [-i | info]: Show command info"
                + "\n• {pn} <command> [-u | usage]: Show command usage"
                + "\n• {pn} <command> [-p | perms]: Show command permissions"
                + "\n• {pn} <command> [-e | examples]: Show command examples"
                + "\n• {pn} [-s | search] <keyword>: Search commands"
        },
        priority: 1
    },

    langs: {
        en: {
            menuHeader: "╭─────────────⭓\n│ 🤖 BOT COMMANDS\n├─────────────⭔",
            menuBody: "│ %1. %2\n",
            menuFooter: "├─────────────⭔\n│ Page %1/%2 • %3 commands\n│ Use %4help <page>\n╰─────────────⭓",
            
            categoryHeader: "╭─────────────⭓\n│ 📑 CATEGORY: %1\n├─────────────⭔",
            categoryBody: "│ %1\n",
            categoryFooter: "├─────────────⭔\n│ %1 commands in category\n╰─────────────⭓",
            
            commandInfo: "╭── COMMAND INFO ────⭓"
                + "\n│ 📝 Name: %1"
                + "\n│ 📚 Description: %2" 
                + "\n│ 🔧 Version: %3"
                + "\n│ 👑 Role: %4"
                + "\n│ ⏰ Cooldown: %5s"
                + "\n│ ✍️ Author: %6"
                + "\n├── USAGE ────⭔"
                + "\n%7"
                + "\n╰──────────⭓",
                
            searchResults: "╭── SEARCH RESULTS ────⭓"
                + "\n│ 🔎 Found %1 commands:"
                + "\n│ %2"
                + "\n╰──────────⭓",
                
            noResults: "❌ No commands found matching '%1'",
            invalidPage: "❌ Invalid page number %1",
            invalidCommand: "❌ Command '%1' not found",
            noPermission: "⚠️ You don't have permission to use this command"
        }
    },

    onStart: async function ({ message, args, event, threadsData, getLang, role }) {
        const prefix = getPrefix(event.threadID);
        const threadData = await threadsData.get(event.threadID);
        
        // Helper function to format command list
        const formatCommands = (cmds) => {
            return cmds
                .filter(cmd => cmd.config.role <= role)
                .map(cmd => {
                    const desc = cmd.config.shortDescription?.en || '';
                    return `${cmd.config.name}: ${desc}`;
                });
        };

        // Handle different command arguments
        if (!args.length || !isNaN(args[0])) {
            // Show paginated command list
            const page = parseInt(args[0]) || 1;
            const commandsPerPage = 10;
            const validCommands = Array.from(commands.values())
                .filter(cmd => cmd.config.role <= role);
                
            const totalPages = Math.ceil(validCommands.length / commandsPerPage);
            
            if (page < 1 || page > totalPages)
                return message.reply(getLang("invalidPage", page));
                
            const startIdx = (page - 1) * commandsPerPage;
            const pageCommands = validCommands.slice(startIdx, startIdx + commandsPerPage);
            
            let msg = getLang("menuHeader");
            pageCommands.forEach((cmd, idx) => {
                msg += getLang("menuBody", startIdx + idx + 1, 
                    `${cmd.config.name}: ${cmd.config.shortDescription?.en || ''}`);
            });
            msg += getLang("menuFooter", page, totalPages, validCommands.length, prefix);
            
            return message.reply(msg);
        }

        if (args[0] === '-c' || args[0] === 'category') {
            // List commands by category
            const categories = new Map();
            for (const [, cmd] of commands) {
                if (cmd.config.role <= role) {
                    const category = cmd.config.category || 'Uncategorized';
                    if (!categories.has(category)) {
                        categories.set(category, []);
                    }
                    categories.get(category).push(cmd.config.name);
                }
            }

            let msg = '';
            for (const [category, cmds] of categories) {
                msg += getLang("categoryHeader", category.toUpperCase());
                msg += getLang("categoryBody", cmds.join(', '));
                msg += getLang("categoryFooter", cmds.length);
            }
            
            return message.reply(msg);
        }

        if (args[0] === '-s' || args[0] === 'search') {
            // Search commands
            const query = args.slice(1).join(' ').toLowerCase();
            const matches = Array.from(commands.values())
                .filter(cmd => 
                    cmd.config.role <= role && 
                    (cmd.config.name.toLowerCase().includes(query) ||
                     cmd.config.shortDescription?.en.toLowerCase().includes(query))
                );
                
            if (!matches.length)
                return message.reply(getLang("noResults", query));
                
            const results = matches.map(cmd => 
                `${cmd.config.name}: ${cmd.config.shortDescription?.en || ''}`
            );
            
            return message.reply(getLang("searchResults", 
                matches.length,
                results.join('\n│ ')
            ));
        }

        // Show command info
        const commandName = args[0].toLowerCase();
        const command = commands.get(commandName) || commands.get(aliases.get(commandName));
        
        if (!command)
            return message.reply(getLang("invalidCommand", commandName));
            
        if (command.config.role > role)
            return message.reply(getLang("noPermission"));

        let msg = getLang("commandInfo",
            command.config.name,
            command.config.longDescription?.en || command.config.shortDescription?.en || 'No description',
            command.config.version || '1.0',
            command.config.role,
            command.config.cooldown || 3,
            command.config.author || 'Unknown',
            command.config.guide?.en || 'No usage guide'
        );

        if (args[1] === '-u' || args[1] === 'usage') {
            msg = `╭── USAGE ────⭓\n${command.config.guide?.en || 'No usage guide'}\n╰──────────⭓`;
        }
        else if (args[1] === '-p' || args[1] === 'perms') {
            msg = `╭── PERMISSIONS ────⭓\n│ Required Role: ${command.config.role}\n╰──────────⭓`;
        }
        else if (args[1] === '-e' || args[1] === 'examples') {
            msg = `╭── EXAMPLES ────⭓\n${command.config.examples?.en || 'No examples available'}\n╰──────────⭓`;
        }

        return message.reply(msg);
    }
};
