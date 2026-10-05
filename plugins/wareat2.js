const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const B = require('../lib/buttons');
const { tiny } = require("../lib/fancy_font/fancy");

// Function to get a random photo safely
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
    pattern: "wareat2",
    alias: ["wareact2", "chnreact2"],
    react: "🔥",
    desc: "Send bot reactions to a WhatsApp Channel post (Alt Endpoint).",
    category: "tools",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {

    if (!q) {
        return reply(tiny("❌ Please provide a WhatsApp Channel message URL.\nUsage: .wareat2 <Channel_URL> | <emojis> | <count>\nExample: .wareat2 https://whatsapp.com/channel/0029Vb8hiKd0gcfQDPeDdf2n/363 | 😛,😭,🤣 | 5"));
    }

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Parse url, optional comma-separated emojis (max 4), and count separated by '|'
        const parts = q.split('|').map(p => p.trim());
        const channelUrl = parts[0];
        const emojisParam = parts[1] || "🔥"; // Defaults to 🔥 if not provided
        const countParam = parts[2] ? parseInt(parts[2], 10) : 1; // Defaults to 1 if not provided

        if (!channelUrl.startsWith('http')) {
            return reply(tiny("❌ Invalid channel message URL pattern provided."));
        }

        const apiUrl = `https://apis.davidcyril.name.ng/endpoints/socialboost/?url=${encodeURIComponent(channelUrl)}&emojis=${encodeURIComponent(emojisParam)}&count=${encodeURIComponent(countParam)}`;
        const res = await axios.get(apiUrl, { timeout: 30000 });

        if (!res.data || res.data.status === false || res.data.success === false) {
            const errorMsg = res.data?.message || res.data?.error || "Could not send channel reactions.";
            return reply(tiny(`❌ ${errorMsg}`));
        }

        const statusText = res.data.message || res.data.result || "Reaction request executed successfully!";

        const infoText = 
`│ 🔗 *Channel Post:*
${channelUrl}
│ 🎭 *Emojis:* ${emojisParam}
│ 🔢 *Count:* ${countParam}
│ 📊 *Status:* ${statusText}`;

        const cardContent = `╭───〔 🔥 *Tsala Channel React (Alt)* 🔥 〕───⬣\n${infoText}\n╰──────────────────────⬣`;
        const styledText = tiny(cardContent);

        const photoPath = getRandomPhoto();
        const image = photoPath && fs.existsSync(photoPath) 
            ? { url: photoPath } 
            : undefined;

        const buttons = [
            B.cmdBtn('🔥 Reaction x5', `wareat2 ${channelUrl} | ${emojisParam} | 5`),
            B.cmdBtn('📁 Menu', 'menu')
        ];

        await B.sendButtons(conn, from, {
            text: styledText,
            image: image,
            footer: '✨ Tsala Yame | PᴏᴡᴇRᴇD ʙY MᴜLᴀX PʀIᴍE',
            buttons: buttons
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("WA React Alt error:", err.message);
        reply(tiny("❌ Error occurred while sending channel reactions."));
    }
});