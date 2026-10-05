const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault;
}

module.exports = {
    SESSION_ID: process.env.SESSION_ID || "",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/lztgy3.png",
    ALIVE_MSG: process.env.ALIVE_MSG || "🌸 *Tsala_Go is Active and Running!*",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "26775462914",
    PRO_USERS: process.env.PRO_USERS || "26778388528",
    MODE: process.env.MODE || "public",
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "Tsala_Yame",
    AUTO_READ_STATUS: convertToBool(process.env.AUTO_READ_STATUS, "True"),
    OWNER_NAME: process.env.OWNER_NAME || "MULAX PRIME",
    AUTO_BUTTONS: convertToBool(process.env.AUTO_BUTTONS, "True"),
    AUTO_CHATBOT: convertToBool(process.env.AUTO_CHATBOT, "True"),
    DEFAULT_SUBTEXT: process.env.DEFAULT_SUBTEXT || "Good day sir my name is ",
    NEWSLETTER_JID: process.env.NEWSLETTER_JID || "120363420003990090@newsletter",
    NEWSLETTER_NAME: process.env.NEWSLETTER_NAME || "⏤͟͟͞͞Tsala Yame ͟͞͞⏤"
};
