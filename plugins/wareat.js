const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const B = require('../lib/buttons');
const { tiny } = require("../lib/fancy_font/fancy");

function getRandomPhoto() {
    const photosDir = path.join(__dirname, '../lib/photos');
    if (!fs.existsSync(photosDir)) return null;
    
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const photoFiles = fs.readdirSync(photosDir).filter(file => 
        validExtensions.includes(path.extname(file).toLowerCase())
    );
    
    if (photoFiles.length === 0) return null;
    
    const randomFile = photoFiles[Math.floor(Math.random() * photoFiles.length)];
    return path.join(photosDir, randomFile);
}

cmd({
    pattern: "wareat",
    alias: ["chnreact", "channelreact", "wareact"],
    react: "👍",
    desc: "Send a reaction to a WhatsApp Channel post directly.",
    category: "tools",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {

    if (!q) {
        return reply(tiny("❌ Please provide a Channel Post URL and emoji.\nUsage: .wareat <Channel_URL> | <emoji>\nExample: .wareat https://whatsapp.com/channel/0029VbDiwEo1XquPafRGOd0B/158 | 👍"));
    }

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const parts = q.split('|').map(p => p.trim());
        const channelLink = parts[0];
        const reactionEmoji = parts[1] || "👍";

        // Extract channel code and message ID from the URL
        const urlMatch = channelLink.match(/whatsapp\.com\/channel\/([a-zA-Z0-9]+)\/(\d+)/);
        
        if (!urlMatch) {
            return reply(tiny("❌ Invalid channel URL format.\nExpected format: https://whatsapp.com/channel/CODE/MESSAGE_ID"));
        }

        const channelCode = urlMatch[1];
        const messageServerId = urlMatch[2];

        // Fetch Channel metadata to retrieve JID
        const metadata = await conn.newsletterMetadata('invite', channelCode);
        if (!metadata || !metadata.id) {
            return reply(tiny("❌ Unable to fetch metadata for this channel. Ensure the channel is public."));
        }

        const channelJid = metadata.id;

        // Native Baileys newsletter reaction method
        if (typeof conn.newsletterReactMessage === 'function') {
            await conn.newsletterReactMessage(channelJid, messageServerId, reactionEmoji);
        } else {
            // Fallback for custom socket wrappers
            await conn.sendMessage(channelJid, {
                react: {
                    text: reactionEmoji,
                    key: {
                        remoteJid: channelJid,
                        fromMe: false,
                        id: messageServerId
                    }
                }
            });
        }

        const infoText = 
`│ 🔗 *Channel:* ${metadata.name || channelCode}
│ 🆔 *Message ID:* ${messageServerId}
│ 🎭 *Reaction:* ${reactionEmoji}
│ 📊 *Status:* Reaction Sent Successfully!`;

        const cardContent = `╭───〔 👍 *Tsala Channel React* 👍 〕───⬣\n${infoText}\n╰──────────────────────⬣`;
        const styledText = tiny(cardContent);

        const photoPath = getRandomPhoto();
        const image = photoPath && fs.existsSync(photoPath) ? { url: photoPath } : undefined;

        const buttons = [
            B.cmdBtn('📁 Menu', 'menu'),
            B.cmdBtn('⚡ Ping', 'ping')
        ];

        await B.sendButtons(conn, from, {
            text: styledText,
            image: image,
            footer: '✨ Tsala Yame | PᴏᴡᴇRᴇD ʙY MᴜLᴀX PʀIᴍE',
            buttons: buttons
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("Native WA Channel React Error:", err);
        reply(tiny(`❌ Failed to send reaction: ${err?.message || "Unknown error"}`));
    }
});