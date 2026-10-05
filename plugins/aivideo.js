const { cmd } = require('../command');
const axios = require('axios');
const B = require('../lib/buttons');
const { tiny } = require("../lib/fancy_font/fancy");

cmd({
    pattern: "aivideo",
    alias: ["txt2vid", "aivid"],
    react: "🎬",
    desc: "Generate an AI video from text prompt.",
    category: "ai",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {

    if (!q) return reply(tiny("❌ Please provide a prompt.\nExample: .aivideo a cat walking on the beach at sunset, cinematic"));

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const apiUrl = `https://apis.davidcyril.name.ng/ai/txt2vid?prompt=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl, { timeout: 60000 });

        if (!res.data?.success || !res.data?.result?.url) {
            return reply(tiny("❌ Failed to generate AI video. The API might be busy or offline."));
        }

        const videoUrl = res.data.result.url;
        const promptText = res.data.result.prompt || q;

        const infoText = 
`╭───〔 🎬 *Tsala AI Video Generator* 🎬 〕───⬣
│ 
│ 📝 *Prompt:* ${promptText}
│ ⚙️ *Aspect Ratio:* Auto
│ 
╰──────────────────────⬣`;

        const styledText = tiny(infoText);

        // 1. Send the actual video directly with caption
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: styledText,
            mimetype: 'video/mp4'
        }, { quoted: mek });

        // 2. Send interactive action buttons below video
        const buttons = [
            B.cmdBtn('🎬 Regenerate', `aivideo ${q}`),
            B.cmdBtn('📁 Menu', 'menu')
        ];

        await B.sendButtons(conn, from, {
            text: tiny("👇 *Quick Actions*"),
            footer: '✨ Tsala Yame | PᴏᴡᴇRᴇD ʙY MᴜLᴀX PʀIᴍE',
            buttons: buttons
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("AI Video error:", err.message);
        reply(tiny("❌ Error occurred while generating the AI video."));
    }
});