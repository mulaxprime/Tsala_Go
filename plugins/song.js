const { cmd } = require('../command');
const yts = require('yt-search');
const { get, responseError } = require('../lib/eliteprotech');
const B = require('../lib/buttons');
const { tiny } = require("../lib/fancy_font/fancy");

function videoItems(data) {
    const results = data?.results || data?.result || {};
    return results.videos || data?.videos || [];
}

async function fetchAudioUrl(youtubeUrl) {
    const data = await get('/download/ytmp3', { url: youtubeUrl });
    const item = data.download || data.result || data;
    const url = item.downloadUrl || item.download_url || item.url || null;
    if (!url) throw new Error('The audio API did not return a download link');
    return { url, title: item.title || 'Tsala audio' };
}

async function fetchVideoUrl(youtubeUrl) {
    const data = await get('/download/ytmp4', { url: youtubeUrl });
    const item = data.result || data.download || data;
    const url = item.url || item.downloadUrl || item.download_url || null;
    if (!url) throw new Error('The video API did not return a download link');
    return { url, title: item.title || 'Tsala video' };
}

async function searchVideos(query) {
    try {
        const response = await get('/search/ytsearch', { q: query });
        const videos = videoItems(response);
        if (videos.length) return videos;
    } catch (error) {
        console.error('EliteProTech YouTube search failed:', responseError(error));
    }
    const fallback = await yts(query);
    return fallback?.videos || [];
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

        const video = (await searchVideos(q))[0] || null;

        if (!video) return reply(tiny("❌ Couldn't find any results on YouTube."));

        const title = video.title;
        const duration = video.timestamp || video.duration || 'N/A';
        const views = video.views ? Number(video.views).toLocaleString() : 'N/A';
        const url = video.url || video.link || (video.videoId ? `https://www.youtube.com/watch?v=${video.videoId}` : '');
        const thumbnail = video.thumbnail || video.image || video.thumbnailUrl;
        if (!url) return reply(tiny('❌ Search returned a result without a video link.'));

        const infoText = 
`│ 🎵 *Title:* ${title}
│ ⏱️ *Duration:* ${duration}
│ 👀 *Views:* ${views}
│ 🔗 *URL:* ${url}
│ 
│ 👇 *Select media format below:*`;

        const cardContent = `╭───〔 🌸 *Tsala Media Downloader* 🌸 〕───⬣\n${infoText}\n╰──────────────────────⬣`;
        const styledText = tiny(cardContent);

        // Native flow interactive buttons triggering specialized sub-commands
        const buttons = [
            B.cmdBtn('🎶 Audio', `ytaudio ${url}`),
            B.cmdBtn('📹 Video', `ytvideo ${url}`),
            B.cmdBtn('📁 Menu', 'menu')
        ];

        const image = thumbnail ? { url: thumbnail } : undefined;

        // Send card only, do not stream automatically
        await B.sendButtons(conn, from, {
            text: styledText,
            image: image,
            footer: '✨ Tsala Yame | PᴏᴡᴇRᴇD ʙY MᴜLᴀX PʀIᴍE',
            buttons: buttons
        }, { quoted: mek });

    } catch (err) {
        console.error("Song command error:", responseError(err));
        reply(tiny(`❌ Search failed: ${responseError(err)}`));
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
            fileName: `${(audioData.title || 'audio').replace(/[\\/:*?"<>|]+/g, '_')}.mp3`,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("Audio download error:", responseError(err));
        reply(tiny(`❌ Audio download failed: ${responseError(err)}`));
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
        console.error("Video download error:", responseError(err));
        reply(tiny(`❌ Video download failed: ${responseError(err)}`));
    }
});
