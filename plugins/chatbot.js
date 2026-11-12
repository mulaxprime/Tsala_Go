const { cmd } = require('../command');
const config = require('../config');
const { tiny } = require("../lib/fancy_font/fancy");
const { downloadMediaMessage, getContentType } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { get, responseError } = require('../lib/eliteprotech');

// ==================== CHATBOT TOGGLE ====================
cmd({
    pattern: "chatbot",
    desc: "Turn auto chatbot on or off",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply(tiny("Only the owner can use this command!"));

    const status = args[0] ? args[0].toLowerCase() : '';

    if (status === 'on') {
        config.AUTO_CHATBOT = true;
        saveChatbotSetting(true);
        return reply(tiny("🤖 Auto Chatbot has been turned *ON*."));
    }

    if (status === 'off') {
        config.AUTO_CHATBOT = false;
        saveChatbotSetting(false);
        return reply(tiny("🤖 Auto Chatbot has been turned *OFF*."));
    }

    return reply(tiny(
        `🤖 *Auto Chatbot Status:* ${config.AUTO_CHATBOT ? "ON" : "OFF"}\n\n` +
        `Use:\n.chatbot on\n.chatbot off`
    ));
});

function saveChatbotSetting(enabled) {
    try {
        const settingsPath = path.join(__dirname, '../config.json');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        settings.AUTO_CHATBOT = enabled;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    } catch (error) {
        console.error('Could not persist chatbot setting:', error.message);
    }
}

// ==================== VIEW ONCE RECOVERY ====================
cmd({
    pattern: "vv",
    alias: ["viewonce", "reveal"],
    desc: "Recover View Once message (reply to it)",
    category: "utility",
    filename: __filename
}, async (conn, mek, m, { from, quoted, isOwner, reply }) => {
    try {
        if (!quoted) {
            return reply(tiny("Reply to a *View Once* message with `.vv`"));
        }

        // Get the real quoted message
        let msg = quoted.message || quoted;
        let type = getContentType(msg);

        // Unwrap viewOnce wrappers
        if (type === "viewOnceMessage" || type === "viewOnceMessageV2" || type === "viewOnceMessageV2Extension") {
            msg = msg[type].message;
            type = getContentType(msg);
        }

        const mediaMsg = msg[type];
        if (!mediaMsg) {
            return reply(tiny("This is not a valid View Once media message."));
        }

        // Download the media
        const buffer = await downloadMediaMessage(
            { message: msg, key: quoted.key || mek.key },
            "buffer",
            {},
            { logger: console, reuploadRequest: conn.updateMediaMessage }
        );

        if (!buffer) {
            return reply(tiny("Failed to download the media."));
        }

        const caption = mediaMsg.caption ? `*Recovered View Once*\n\n${mediaMsg.caption}` : "*Recovered View Once Message*";

        if (type === "imageMessage") {
            await conn.sendMessage(from, {
                image: buffer,
                caption: caption
            }, { quoted: mek });
        }
        else if (type === "videoMessage") {
            await conn.sendMessage(from, {
                video: buffer,
                caption: caption
            }, { quoted: mek });
        }
        else if (type === "audioMessage") {
            await conn.sendMessage(from, {
                audio: buffer,
                mimetype: "audio/mp4",
                ptt: mediaMsg.ptt || false
            }, { quoted: mek });
        }
        else {
            return reply(tiny("Unsupported View Once type."));
        }

    } catch (err) {
        console.error("ViewOnce Error:", err);
        reply(tiny("Failed to recover View Once message.\nMake sure you replied to a valid View Once media."));
    }
});

// ==================== AUTO CHATBOT (DM only) ====================
const conversations = new Map();

cmd({ on: "text" }, async (conn, mek, m, { from, body, sender, isGroup, isMe }) => {
    if (isGroup) return;
    if (!body) return;
    if (isMe || mek.key?.fromMe) return;
    if (!['@s.whatsapp.net', '@lid'].some(suffix => String(from).endsWith(suffix))) return;
    if (body.startsWith(config.PREFIX || '.')) return;
    if (!(config.AUTO_CHATBOT === true || String(config.AUTO_CHATBOT).toLowerCase() === 'true')) return;

    try {
        const userKey = sender || from;
        const params = { prompt: body };
        const conversationId = conversations.get(userKey);
        if (conversationId) params.conversationId = conversationId;
        const response = await get('/ai/chatgpt', params);
        if (response.conversationId) conversations.set(userKey, response.conversationId);
        const answer = response.text || response.result?.text || response.result || response.message;
        if (!answer) throw new Error('ChatGPT API returned an empty response.');
        await conn.sendMessage(from, { text: String(answer).slice(0, 12000) }, { quoted: mek });
    } catch (e) {
        console.error("Failed to send chatbot reply:", responseError(e));
        await conn.sendMessage(from, { text: tiny(`❌ Chatbot error: ${responseError(e)}`) }, { quoted: mek });
    }
});
