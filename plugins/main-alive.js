const config = require('../config');
const { cmd, commands } = require('../command');
const fs = require('fs');
const path = require('path');
const B = require('../lib/buttons');

// Function to get a random photo safely (supports jpg, jpeg, png, webp)
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
    pattern: "alive",
    desc: "Check bot online or no.",
    category: "main",
    react: "👋",
    filename: __filename
},
async(conn, mek, m, { from, sender, reply }) => {
    try {
        const photoPath = getRandomPhoto();
        const imageSource = (photoPath && fs.existsSync(photoPath)) 
            ? { url: photoPath } 
            : { url: config.ALIVE_IMG };

        const buttons = [
            B.cmdBtn('📁 Menu', 'menu'),
            B.cmdBtn('ℹ️ System', 'systeminfo'),
            B.cmdBtn('👥 Admins', 'admins')
        ];

        await B.sendButtons(conn, from, {
            text: config.ALIVE_MSG || "🌸 *Tsala_Go is Active and Running!*",
            image: imageSource,
            footer: 'Tsala Yame | Powered by Mulax Prime',
            buttons: buttons
        }, { quoted: mek, mentions: [sender] });

    } catch (e) {
        console.error("Alive command error:", e);
        reply(`${e.message || e}`);
    }
});
