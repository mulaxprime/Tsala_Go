const { cmd } = require('../command');
const axios = require('axios');
const B = require('../lib/buttons');
const { tiny } = require("../lib/fancy_font/fancy");

const API_KEY = "dc_live_sa5YuqRhTl_DBeFpC-1aq0NzwiLaShN";
const BASE_URL = "https://apis.davidcyril.name.ng/tempnumber/receive-smss";

cmd({
    pattern: "tempnum",
    alias: ["fakephone", "tempno", "getnum"],
    react: "📱",
    desc: "Get temporary numbers and read received SMS messages.",
    category: "tools",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {

    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const args = q ? q.split(' ') : [];
        const subCommand = args[0] ? args[0].toLowerCase() : 'list';

        // 1. Fetch available numbers
        if (subCommand === 'list' || subCommand === 'get') {
            const res = await axios.get(`${BASE_URL}/numbers`, {
                headers: { 'X-API-Key': API_KEY },
                timeout: 15000
            });

            if (!res.data || !res.data.success) {
                return reply(tiny("❌ Failed to fetch temporary numbers from provider."));
            }

            const numbers = res.data.result?.numbers || [];
            if (numbers.length === 0) {
                return reply(tiny("⚠️ No temporary numbers are currently available from the provider. Try again later."));
            }

            let numList = `╭───〔 📱 *Available Temp Numbers* 〕───⬣\n\n`;
            numbers.slice(0, 10).forEach((item, index) => {
                numList += `*${index + 1}.* \`+${item.number || item.phone || item}\`\n`;
            });
            numList += `\n💡 *To read incoming SMS for a number:*\n.tempnum inbox <number>\n╰──────────────────────⬣`;

            const buttons = [
                B.cmdBtn('📁 Menu', 'menu'),
                B.cmdBtn('⚡ Ping', 'ping')
            ];

            await B.sendButtons(conn, from, {
                text: tiny(numList),
                footer: '✨ Tsala Yame | PᴏᴡᴇRᴇD ʙY MᴜLᴀX PʀIᴍE',
                buttons: buttons
            }, { quoted: mek });

            return await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        }

        // 2. Read Inbox for a specific phone number
        if (subCommand === 'inbox' || subCommand === 'sms') {
            const phoneNumber = args[1] ? args[1].replace(/[^0-9]/g, '') : null;

            if (!phoneNumber) {
                return reply(tiny("❌ Please provide a phone number to check.\nExample: .tempnum inbox 1234567890"));
            }

            const res = await axios.get(`${BASE_URL}/messages/${phoneNumber}`, {
                headers: { 'X-API-Key': API_KEY },
                timeout: 15000
            });

            if (!res.data || !res.data.success) {
                return reply(tiny(`❌ Failed to retrieve messages for +${phoneNumber}. Ensure the number is correct.`));
            }

            const messages = res.data.result?.messages || res.data.result || [];
            if (!Array.isArray(messages) || messages.length === 0) {
                return reply(tiny(`📥 Inbox for +${phoneNumber} is currently empty.`));
            }

            let smsList = `╭───〔 📥 *SMS Inbox for +${phoneNumber}* 〕───⬣\n\n`;
            messages.slice(0, 5).forEach((msg, idx) => {
                smsList += `*From:* ${msg.from || msg.sender || 'Unknown'}\n`;
                smsList += `*Message:* ${msg.text || msg.message || msg.body}\n`;
                smsList += `*Time:* ${msg.time || msg.date || 'Recently'}\n`;
                smsList += `──────────────────\n`;
            });
            smsList += `╰──────────────────────⬣`;

            const buttons = [
                B.cmdBtn('📁 Menu', 'menu'),
                B.cmdBtn('⚡ Ping', 'ping')
            ];

            await B.sendButtons(conn, from, {
                text: tiny(smsList),
                footer: '✨ Tsala Yame | PᴏᴡEʀᴇD ʙY MᴜLᴀX PʀIᴍE',
                buttons: buttons
            }, { quoted: mek });

            return await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        }

        reply(tiny("❌ Invalid command usage.\n• *.tempnum list* - View numbers\n• *.tempnum inbox <number>* - Read SMS"));

    } catch (err) {
        console.error("TempNum Error:", err?.response?.data || err.message);
        const errorMsg = err?.response?.data?.message || "Provider API is currently unresponsive.";
        reply(tiny(`❌ Error: ${errorMsg}`));
    }
});