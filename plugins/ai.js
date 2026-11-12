const { cmd } = require('../command');
const { get, responseError } = require('../lib/eliteprotech');
const { tiny } = require("../lib/fancy_font/fancy");

cmd({
    pattern: "ai",
    alias: ["gpt", "chatgpt"],
    react: "🤖",
    desc: "Chat with AI",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, q, sender, reply }) => {
    try {
        // 1. Check if the user provided a question
        if (!q) return reply(tiny("❌ Please provide a prompt.\nExample: `.ai Hello, how are you?`"));

        await conn.sendMessage(from, { react: { text: '🤖', key: mek.key } });

        const response = await get('/ai/chatgpt', { prompt: q });
        const aiResponse = response.text || response.result?.text || response.result || response.message;

        if (!aiResponse) {
            return reply(tiny("❌ Failed to get a response from AI. All free APIs are currently busy."));
        }

        // 3. Format the response with Tsala Yame layout
        const infoText = 
`│ 🤖 *Tsala AI*
│
│ ${aiResponse}`;

        const cardContent = 
            `╭───〔 🌸 *Tsala AI Chat* 🌸 〕───⬣
${infoText}
╰──────────────────────⬣
> *✨ Tsala Yame | Pᴏᴡᴇʀᴇᴅ ʙʏ Mᴜʟᴀx Pʀɪᴍᴇ*`;

        const styledText = tiny(cardContent);

        const contextInfo = {
            mentionedJid: [sender],
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363420003990090@newsletter',
                newsletterName: '⏤͟͟͞͞Tsala Yame  ͟͞͞⏤'
            },
            externalAdReply: {
                showAdAttribution: false,
                containsAutoReply: true,
                title: "✧ Tsala AI ✧",
                body: "Powered By Mulax Prime",
                thumbnailUrl: "https://files.catbox.moe/bt7a3x.jpeg", 
                sourceUrl: "https://github.com/mulaxprime/Tsala_Yame",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        };

        // 4. Send the message
        await conn.sendMessage(from, {
            text: styledText,
            contextInfo
        }, { quoted: mek });

    } catch (e) {
        console.error("AI Command Error:", responseError(e));
        reply(tiny(`❌ Error occurred: ${responseError(e)}`));
    }
});
