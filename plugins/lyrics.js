const { cmd } = require('../command');
const { get, responseError } = require('../lib/eliteprotech');
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

        const query = [titleParam, artistParam].filter(Boolean).join(' ');
        const response = await get('/search/lyrics', { query });
        const song = response.result || response.data || response;
        const lyricsText = song.plainLyrics || song.syncedLyrics || song.lyrics || '';

        if (!lyricsText) {
            return reply(tiny("❌ Couldn't find lyrics for that song."));
        }

        const songTitle = song.trackName || song.name || titleParam;
        const songArtist = song.artistName || artistParam || "Unknown Artist";
        const thumbnail = song.thumbnail || song.image || null;

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
        console.error("Lyrics error:", responseError(err));
        reply(tiny(`❌ Error occurred while fetching lyrics: ${responseError(err)}`));
    }
});
