const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
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
    pattern: "url2",
    alias: ["tourl2", "upload2", "cdn2"],
    react: "📤",
    desc: "Upload media to direct URL via API uploader.",
    category: "tools",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {

    try {
        const mime = (m.quoted ? m.quoted : m).mimetype || '';
        const isMedia = /image|video|audio|document/.test(mime);

        if (!isMedia && !q) {
            return reply(tiny("❌ Please reply to a media file (image/video/audio) or provide a direct file URL.\nExample: .url2 (replying to media)"));
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        let resultUrl = '';

        if (isMedia) {
            // Download the quoted media buffer from WhatsApp
            const targetMessage = m.quoted ? m.quoted : m;
            const mediaBuffer = await targetMessage.download();

            if (!mediaBuffer) {
                return reply(tiny("❌ Failed to download media attachment."));
            }

            // Construct multipart form-data for upload
            const form = new FormData();
            form.append('file', mediaBuffer, {
                filename: `upload_${Date.now()}.${mime.split('/')[1] || 'bin'}`,
                contentType: mime
            });

            const res = await axios.post('https://apis.davidcyril.name.ng/uploader/', form, {
                headers: {
                    ...form.getHeaders()
                },
                timeout: 60000
            });

            if (res.data && res.data.success && res.data.url) {
                resultUrl = res.data.url;
            }
        } else if (q && q.startsWith('http')) {
            // Fallback via URL query parameter if direct link was passed
            const res = await axios.get(`https://apis.davidcyril.name.ng/uploader/?url=${encodeURIComponent(q.trim())}`, {
                timeout: 30000
            });

            if (res.data && res.data.success && res.data.url) {
                resultUrl = res.data.url;
            }
        }

        if (!resultUrl) {
            return reply(tiny("❌ Upload failed. Invalid response from server."));
        }

        const infoText = 
`│ 🌐 *Uploaded URL:*
${resultUrl}`;

        const cardContent = `╭───〔 🌸 *Tsala File Uploader* 🌸 〕───⬣\n${infoText}\n╰──────────────────────⬣`;
        const styledText = tiny(cardContent);

        const photoPath = getRandomPhoto();
        const image = photoPath && fs.existsSync(photoPath) 
            ? { url: photoPath } 
            : undefined;

        const buttons = [
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
        console.error("URL2 Uploader error:", err.message);
        reply(tiny("❌ Error occurred during file upload."));
    }
});