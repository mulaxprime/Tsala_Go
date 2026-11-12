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
    pattern: "xvdl",
    alias: ["xvideo", "xvdownload", "xvd"],
    react: "🎬",
    desc: "Download video from XVideos URL.",
    category: "downloader",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {

    if (!q) {
        return reply(tiny("❌ Please provide a valid XVideos URL.\nExample: .xvdl https://www.xvideos.com/video.hppakie6a79/..."));
    }

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const videoUrl = q.trim();
        const apiUrl = `https://apis.davidcyril.name.ng/endpoints/xxx/?url=${encodeURIComponent(videoUrl)}`;
        const res = await axios.get(apiUrl, { timeout: 60000 });

        if (!res.data || !res.data.success || !res.data.download_url) {
            return reply(tiny("❌ Failed to fetch video download link."));
        }

        const videoTitle = res.data.title || "XVideos Download";
        const downloadUrl = res.data.download_url;
        const thumbnail = res.data.thumbnail;

        const infoText = 
`│ 🎬 *Title:* ${videoTitle}
│ 🔗 *Source:* XVideos
│ 
│ 📥 Sending video file below...`;

        const cardContent = `╭───〔 🔞 *Tsala XVideos Downloader* 🔞 〕───⬣\n${infoText}\n╰──────────────────────⬣`;
        const styledText = tiny(cardContent);

        const photoPath = getRandomPhoto();
        const image = thumbnail ? { url: thumbnail } : (photoPath && fs.existsSync(photoPath) ? { url: photoPath } : undefined);

        const buttons = [
            B.cmdBtn('📁 Menu', 'menu')
        ];

        // Send info card first
        await B.sendButtons(conn, from, {
            text: styledText,
            image: image,
            footer: '✨ Tsala Yame | PᴏᴡᴇRᴇD ʙY MᴜLᴀX PʀIᴍE',
            buttons: buttons
        }, { quoted: mek });

        // Stream and send the MP4 file directly
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: tiny(`🎬 *${videoTitle}*`)
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("XVideos Downloader error:", err.message);
        reply(tiny("❌ Error occurred while processing video download."));
    }
});