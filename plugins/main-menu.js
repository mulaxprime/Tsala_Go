const config = require('../config');
const { cmd, commands } = require('../command');
const fs = require('fs');
const path = require('path');
const B = require('../lib/buttons');
const { tiny } = require("../lib/fancy_font/fancy");

const mediaPath = {
    audio: path.join(__dirname, '../lib/media/menu-audio.mp3')
};

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

const CATEGORIES = {
    ai: '𝙰𝙸', main: '𝙼𝙰𝙸𝙽', anime: '𝙰𝙽𝙸𝙼𝙴', whatsapp: '𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿', group: '𝙶𝚁𝙾𝚄𝙿',
    admin: '𝙰𝙳𝙼𝙸𝙽', fun: '𝙵𝚄𝙽', other: '𝙾𝚃𝙷𝙴𝚁', owner: '𝙾𝚆𝙽𝙴𝚁', settings: '𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂',
    general: '𝙶𝙴𝙽𝙴𝚁𝙰𝙻', tools: '𝚃𝙾𝙾𝙻𝚂',
};

function cmdsOf(category) {
    return commands.filter(c => c.pattern && !c.dontAddCommandList && c.category === category);
}

cmd({
    pattern: "menu",
    alias: ["help", "list"],
    desc: "Button menu",
    category: "main",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const P = config.PREFIX || '.';
        const quoted = { quoted: mek };
        const pick = (args[0] || '').toLowerCase();

        // ===== Sub-menu: commands of one category as a tap-to-run list =====
        if (pick && CATEGORIES[pick]) {
            const rows = cmdsOf(pick).map(c => ({
                title: P + c.pattern,
                description: (c.desc || 'No description').slice(0, 70),
                id: P + c.pattern
            }));
            if (!rows.length) return reply(tiny('No commands in this category.'));

            return B.sendButtons(conn, from, {
                text: tiny(`╭───〔 ${CATEGORIES[pick]} 〕───⬣\n│ ${rows.length} commands\n│ Tap below to run one\n╰──────────────⬣`),
                footer: config.BOT_NAME,
                buttons: [
                    B.list('Select command', [{ title: pick.toUpperCase(), rows: rows.slice(0, 50) }]),
                    B.cmdBtn('⬅️ Back', 'menu'),
                ]
            }, quoted);
        }

        // ===== Main menu: pick a category =====
        const up = process.uptime();
        const d = Math.floor(up / 86400), h = Math.floor((up % 86400) / 3600),
              mi = Math.floor((up % 3600) / 60), se = Math.floor(up % 60);
        const date = new Date().toLocaleDateString('en-US', { timeZone: 'Africa/Lagos', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const time = new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', hour12: true });

        const rows = Object.entries(CATEGORIES)
            .filter(([k]) => cmdsOf(k).length)
            .map(([k, title]) => ({
                title,
                description: `${cmdsOf(k).length} commands`,
                id: `${P}menu ${k}`
            }));

        const text = tiny(
`╭───〔 🌸 *Tsala Yame* 🌸 〕───⬣
│ 📅 *Date:* ${date}
│ 🕐 *Time:* ${time}
│ ⏱️ *Uptime:* ${d}d ${h}h ${mi}m ${se}s
│ 👑 *Owner:* ${config.OWNER_NAME}
│ 🔧 *Prefix:* ${P}
╰──────────────⬣
Tap *Categories* to browse 👇`);

        const buttons = [
            B.list('📂 Categories', [{ title: 'Command categories', rows }]),
            B.cmdBtn('👑 Owner', 'owner'),
            B.cmdBtn('⚡ Ping', 'ping'),
            B.url('📁 Repo', 'https://github.com/mulaxprime/Tsala_Go'),
        ];

        const photoPath = getRandomPhoto();
        // Pass file path directly instead of buffer to reduce memory corruption
        const image = photoPath && fs.existsSync(photoPath) ? { url: photoPath } : undefined;

        await B.sendButtons(conn, from, { text, image, footer: 'Powered by Mulax Prime', buttons }, quoted);

        // Delayed Audio to prevent key sync conflict on fresh session
        if (fs.existsSync(mediaPath.audio)) {
            setTimeout(async () => {
                await conn.sendMessage(from, { 
                    audio: { url: mediaPath.audio }, 
                    mimetype: 'audio/mp4', 
                    ptt: false 
                }, { quoted: mek }).catch(e => console.log('Menu Audio Sync Skip'));
            }, 1000);
        }
    } catch (e) {
        console.error('Menu Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});