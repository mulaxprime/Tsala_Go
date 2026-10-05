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
    pattern: "lyrics",
    alias: ["lyric", "songlyrics"],
    react: "🎤",
    desc: "Search for track lyrics.",
    category: "downloader",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {

    if (!q) return reply(tiny("❌ Please provide a song name or artist.\nExample: .lyrics faded | alan walker or .lyrics faded"));

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Parse optional title and artist separated by '|'
        let titleParam = q.trim();
        let artistParam = '';

        if (q.includes('|')) {
            const parts = q.split('|');
            titleParam = parts[0].trim();
            artistParam = parts[1].trim();
        }

        const apiUrl = `https://apis.davidcyril.name.ng/lyrics?t=${encodeURIComponent(titleParam)}${artistParam ? `&a=${encodeURIComponent(artistParam)}` : ''}`;
        const res = await axios.get(apiUrl, { timeout: 30000 });

        if (!res.data || !res.data.lyrics) {
            return reply(tiny("❌ Couldn't find lyrics for that song."));
        }

        const songTitle = res.data.title || titleParam;
        const songArtist = res.data.artist || artistParam || "Unknown Artist";
        const lyricsText = res.data.lyrics;
        const thumbnail = res.data.thumbnail;

        const infoText = 
`│ 🎵 *Title:* ${songTitle}
│ 🎤 *Artist:* ${songArtist}
│ 
│ 📜 *Lyrics:*
${lyricsText}`;

        const cardContent = `╭───〔 🌸 *Tsala Lyrics Finder* 🌸 〕───⬣\n${infoText}\n╰──────────────────────⬣`;
        const styledText = tiny(cardContent);

        const photoPath = getRandomPhoto();
        const image = photoPath && fs.existsSync(photoPath) 
            ? { url: photoPath } 
            : (thumbnail ? { url: thumbnail } : undefined);

        const buttons = [
            B.cmdBtn('🎶 Play Audio', `song ${songTitle} ${songArtist}`),
            B.cmdBtn('📹 Play Video', `video ${songTitle} ${songArtist}`),
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
        console.error("Lyrics error:", err.message);
        reply(tiny("❌ Error occurred while fetching lyrics."));
    }
});