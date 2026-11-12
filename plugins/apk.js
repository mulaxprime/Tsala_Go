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
    pattern: "apk",
    alias: ["app", "getapk"],
    react: "📲",
    desc: "Search and download APK files.",
    category: "downloader",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {

    if (!q) return reply(tiny("❌ Please provide an application name.\nExample: .apk whatsapp"));

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const response = await get('/tools/apk', { q });
        const apkData = response.result?.apk || response.result || response.apk || response.data || response;
        const downloadLink = apkData.downloadLink || apkData.downloadUrl || apkData.url || apkData.link;
        if (!downloadLink) {
            return reply(tiny("❌ Could not find the requested APK file."));
        }

        const name = apkData.name || "Unknown App";
        const version = apkData.lastUpdated || "N/A";
        const packageName = apkData.package || "N/A";
        const iconUrl = apkData.icon || apkData.thumbnail || apkData.image;

        const infoText = 
`│ 📦 *App Name:* ${name}
│ 🏷️ *Package:* ${packageName}
│ 🔄 *Last Updated:* ${version}
│ 
│ ⏳ *Sending document file below...*`;

        const cardContent = `╭───〔 🌸 *Tsala APK Downloader* 🌸 〕───⬣\n${infoText}\n╰──────────────────────⬣`;
        const styledText = tiny(cardContent);

        const photoPath = getRandomPhoto();
        const image = photoPath && fs.existsSync(photoPath) 
            ? { url: photoPath } 
            : (iconUrl ? { url: iconUrl } : undefined);

        const buttons = [
            B.cmdBtn('📱 Re-search', `apk ${q}`),
            B.cmdBtn('📁 Menu', 'menu')
        ];

        // 1. Send the detail card with buttons
        await B.sendButtons(conn, from, {
            text: styledText,
            image: image,
            footer: '✨ Tsala Yame | PᴏᴡᴇRᴇD ʙY MᴜLᴀX PʀIᴍE',
            buttons: buttons
        }, { quoted: mek });

        // 2. Direct document stream for .apk file
        await conn.sendMessage(from, {
            document: { url: downloadLink },
            mimetype: 'application/vnd.android.package-archive',
            fileName: `${name.replace(/\s+/g, '_')}.apk`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("APK Downloader error:", responseError(err));
        reply(tiny(`❌ APK search failed: ${responseError(err)}`));
    }
});
