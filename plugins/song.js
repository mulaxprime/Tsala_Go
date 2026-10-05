const { cmd } = require('../command');
const yts = require('yt-search');
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

// Fetch audio URL using David Cyril /play-v2
async function fetchAudioUrl(query) {
    try {
        const res = await axios.get(`https://apis.davidcyril.name.ng/play-v2?q=${encodeURIComponent(query)}`, { timeout: 15000 });
        if (res.data?.success && res.data?.result?.audio?.url) {
            return {
                url: res.data.result.audio.url,
                title: res.data.result.title
            };
        }
    } catch (e) {
        console.error("David Cyril /play-v2 failed:", e.message);
    }
    return null;
}

// Fetch video URL using David Cyril /download/ytv3
async function fetchVideoUrl(youtubeUrl) {
    try {
        const res = await axios.get(`https://apis.davidcyril.name.ng/download/ytv3?url=${encodeURIComponent(youtubeUrl)}&format=mp4`, { timeout: 20000 });
        if (res.data?.success && res.data?.result?.download_url) {
            return {
                url: res.data.result.download_url,
                title: res.data.result.title
            };
        }
    } catch (e) {
        console.error("David Cyril /download/ytv3 failed:", e.message);
    }
    return null;
}

// ==================== 1. MAIN CARD COMMAND ====================
cmd({
    pattern: "song",
    alias: ["ytplay", "play"],
    react: "🎶",
    desc: "Search YouTube track and present download choices.",
    category: "downloader",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {

    if (!q) return reply(tiny("❌ Please enter the name of the song.\nExample: .play let me love you"));

    try {
        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        const search = await yts(q);
        const video = search && search.videos && search.videos.length > 0 ? search.videos[0] : null;

        if (!video) return reply(tiny("❌ Couldn't find any results on YouTube."));

        const title = video.title;
        const duration = video.timestamp;
        const views = video.views ? video.views.toLocaleString() : 'N/A';
        const url = video.url;
        const thumbnail = video.thumbnail;

        const infoText = 
`│ 🎵 *Title:* ${title}
│ ⏱️ *Duration:* ${duration}
│ 👀 *Views:* ${views}
│ 🔗 *URL:* ${url}
│ 
│ 👇 *Select media format below:*`;

        const cardContent = `╭───〔 🌸 *Tsala Media Downloader* 🌸 〕───⬣\n${infoText}\n╰──────────────────────⬣`;
        const styledText = tiny(cardContent);
        const photoPath = getRandomPhoto();

        // Native flow interactive buttons triggering specialized sub-commands
        const buttons = [
            B.cmdBtn('🎶 Audio', `ytaudio ${url}`),
            B.cmdBtn('📹 Video', `ytvideo ${url}`),
            B.cmdBtn('📁 Menu', 'menu')
        ];

        const image = photoPath && fs.existsSync(photoPath) 
            ? { url: photoPath } 
            : (thumbnail ? { url: thumbnail } : undefined);

        // Send card only, do not stream automatically
        await B.sendButtons(conn, from, {
            text: styledText,
            image: image,
            footer: '✨ Tsala Yame | PᴏᴡᴇRᴇD ʙY MᴜLᴀX PʀIᴍE',
            buttons: buttons
        }, { quoted: mek });

    } catch (err) {
        console.error("Song command error:", err);
        reply(tiny("❌ Error occurred while searching."));
    }
});

// ==================== 2. AUDIO DISPATCH ====================
cmd({
    pattern: "ytaudio",
    alias: ["yta"],
    react: "🎵",
    desc: "Download MP3 audio track",
    category: "downloader",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply(tiny("❌ Missing YouTube URL or query."));

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const audioData = await fetchAudioUrl(q);
        if (!audioData || !audioData.url) {
            return reply(tiny("❌ Audio download API is currently offline."));
        }

        await conn.sendMessage(from, {
            audio: { url: audioData.url },
            mimetype: 'audio/mpeg',
            fileName: `${audioData.title || 'audio'}.mp3`,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("Audio download error:", err);
        reply(tiny("❌ Failed to stream audio file."));
    }
});

// ==================== 3. VIDEO DISPATCH ====================
cmd({
    pattern: "ytvideo",
    alias: ["ytv", "video"],
    react: "📹",
    desc: "Download MP4 video clip",
    category: "downloader",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply(tiny("❌ Missing YouTube URL or query."));

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const videoData = await fetchVideoUrl(q);
        if (!videoData || !videoData.url) {
            return reply(tiny("❌ Video download API is currently offline."));
        }

        await conn.sendMessage(from, {
            video: { url: videoData.url },
            caption: tiny(`🎬 *${videoData.title || 'Video'}*\n\n> ✨ Tsala Yame`),
            mimetype: 'video/mp4'
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("Video download error:", err);
        reply(tiny("❌ Failed to stream video file."));
    }
});