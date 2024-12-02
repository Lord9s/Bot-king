const fs = require('fs');
const { GoatWrapper } = require('fca-liane-utils');
const crypto = require('crypto');

const configPath = __dirname + '/fileConfig.json';
let config = {
    encryption: true,
    method: 1
};

function loadConfig() {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
        saveConfig();
    }
}

function saveConfig() {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function encryptText(text, method) {
    const methods = {
        1: () => {
            const key = crypto.scryptSync('password', 'salt', 24);
            const iv = Buffer.alloc(16, 0);
            const cipher = crypto.createCipheriv('aes-192-cbc', key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted;
        },
        2: () => {
            return Buffer.from(text).toString('base64');
        },
        3: () => {
            const key = crypto.scryptSync('different_password', 'different_salt', 32);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag();
            return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
        },
        4: () => {
            return text.split('').map(char => char.charCodeAt(0).toString(16)).join('');
        },
        5: () => {
            const shifted = text.split('').map(char => 
                String.fromCharCode(((char.charCodeAt(0) + 13) % 128))
            ).join('');
            return Buffer.from(shifted).toString('base64');
        }
    };

    return methods[method]?.() || text;
}

module.exports = {
    config: {
        name: "file",
        version: "2.0",
        author: "Priyanshi Kaur",
        countDown: 5,
        role: 0,
        shortDescription: "Send bot script with encryption",
        longDescription: "Send bot specified file with multiple encryption methods",
        category: "Admin",
        guide: "{pn} [options] filename\nOptions:\n- en:on/off - Enable/disable encryption\n- m:1-5 - Set encryption method\n- s - Show current settings"
    },

    onStart: async function ({ message, args, api, event }) {
        const permission = ["100088590098255","61560050885709"]; // ADD UID BEFORE USING 
        if (!permission.includes(event.senderID)) {
            return api.sendMessage("⚠️ You don't have permission to use this command.", event.threadID, event.messageID);
        }

        loadConfig();

        if (args[0]?.startsWith('en:')) {
            const state = args[0].split(':')[1].toLowerCase();
            config.encryption = state === 'on';
            saveConfig();
            return api.sendMessage(`🔐 Encryption ${config.encryption ? 'enabled' : 'disabled'}`, event.threadID);
        }

        if (args[0]?.startsWith('m:')) {
            const method = parseInt(args[0].split(':')[1]);
            if (method >= 1 && method <= 5) {
                config.method = method;
                saveConfig();
                return api.sendMessage(`🔄 Encryption method set to ${method}`, event.threadID);
            }
            return api.sendMessage("⚠️ Invalid encryption method. Choose 1-5", event.threadID);
        }

        if (args[0] === 's') {
            return api.sendMessage(
                `📊 Current Settings\n` +
                `├─ Encryption: ${config.encryption ? 'Enabled 🔒' : 'Disabled 🔓'}\n` +
                `└─ Method: ${config.method} 🔢`, 
                event.threadID
            );
        }

        const fileName = args[0];
        if (!fileName) {
            return api.sendMessage("📝 Please provide a file name.", event.threadID);
        }

        const filePath = __dirname + `/${fileName}.js`;
        if (!fs.existsSync(filePath)) {
            return api.sendMessage(`❌ File not found: ${fileName}.js`, event.threadID);
        }

        let fileContent = fs.readFileSync(filePath, 'utf8');
        
        if (config.encryption) {
            fileContent = encryptText(fileContent, config.method);
            api.sendMessage({
                body: `🔒 Encrypted File Content (Method ${config.method}):\n\n${fileContent}`
            }, event.threadID);
        } else {
            api.sendMessage({
                body: `📄 File Content:\n\n${fileContent}`
            }, event.threadID);
        }
    }
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
