const { cmd } = require('../command');
const axios = require('axios');
const B = require('../lib/buttons');
const { tiny } = require("../lib/fancy_font/fancy");

cmd({
    pattern: "imagine",
    alias: ["genimage", "aiimage", "draw"],
    react: "🎨",
    desc: "Generate AI images from prompt.",
    category: "ai",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {

    if (!q) return reply(tiny("❌ Please provide a prompt describing the image.\nExample: .imagine beautiful anime girl, cherry blossoms, sunset"));

    try {
        await conn.sendMessage(from, { react: { text: '🎨', key: mek.key } });

        const apiUrl = `https://apis.davidcyril.name.ng/imagegen/animagine?prompt=${encodeURIComponent(q.trim())}`;
        const res = await axios.get(apiUrl, { timeout: 60000 });

        if (!res.data || !res.data.success || !res.data.cdn_url) {
            return reply(tiny("❌ Image generation failed. Please try a different prompt."));
        }

        const imageUrl = res.data.cdn_url;
        const promptText = res.data.prompt || q;

        const infoText = 
`│ 🎨 *Prompt:* ${promptText}
│ 📐 *Ratio:* ${res.data.ratio || "1:1"}`;

        const cardContent = `╭───〔 🌸 *Tsala Image Generator* 🌸 〕───⬣\n${infoText}\n╰──────────────────────⬣`;
        const styledText = tiny(cardContent);

        const buttons = [
            B.cmdBtn('🔄 Regenerate', `imagine ${q}`),
            B.cmdBtn('📁 Menu', 'menu')
        ];

        await B.sendButtons(conn, from, {
            text: styledText,
            image: { url: imageUrl },
            footer: '✨ Tsala Yame | PᴏᴡᴇRᴇD ʙY MᴜLᴀX PʀIᴍE',
            buttons: buttons
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("Image generation error:", err.message);
        reply(tiny("❌ Error occurred while generating image."));
    }
});