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
    pattern: "tikbst",
    alias: ["tiktokboost", "tkboost", "tikboost"],
    react: "🚀",
    desc: "Boost TikTok video views, likes, or followers.",
    category: "tools",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {

    if (!q) {
        return reply(tiny("❌ Please provide a TikTok URL and optional boost type.\nUsage: .tikbst <TikTok_URL> | <type>\nTypes: video_views, like, followers\nExample: .tikbst https://www.tiktok.com/@khaby.lame/video/730966533272778030 | followers"));
    }

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Parse URL and optional boost type separated by '|'
        let targetUrl = q.trim();
        let boostType = 'video_views'; // default fallback

        if (q.includes('|')) {
            const parts = q.split('|');
            targetUrl = parts[0].trim();
            boostType = parts[1].trim() || 'video_views';
        }

        const apiUrl = `https://apis.davidcyril.name.ng/socialboost/?url=${encodeURIComponent(targetUrl)}&type=${encodeURIComponent(boostType)}`;
        const res = await axios.get(apiUrl, { timeout: 30000 });

        if (!res.data || res.data.status === false || res.data.success === false) {
            const errorMsg = res.data?.message || res.data?.error || "Could not process TikTok boost request.";
            return reply(tiny(`❌ ${errorMsg}`));
        }

        const statusText = res.data.message || res.data.result || "Boost order submitted successfully!";

        const infoText = 
`│ 🎯 *Target URL:*
${targetUrl}
│ ⚙️ *Boost Type:* ${boostType}
│ 📊 *Status:* ${statusText}`;

        const cardContent = `╭───〔 🚀 *Tsala TikTok Booster* 🚀 〕───⬣\n${infoText}\n╰──────────────────────⬣`;
        const styledText = tiny(cardContent);

        const photoPath = getRandomPhoto();
        const image = photoPath && fs.existsSync(photoPath) 
            ? { url: photoPath } 
            : undefined;

        const buttons = [
            B.cmdBtn('👁️ Views Boost', `tikbst ${targetUrl} | video_views`),
            B.cmdBtn('❤️ Likes Boost', `tikbst ${targetUrl} | like`),
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
        console.error("TikTok Boost error:", err.message);
        reply(tiny("❌ Error occurred while processing TikTok boost request."));
    }
});