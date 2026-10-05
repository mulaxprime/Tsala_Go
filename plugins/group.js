const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const { tiny } = require("../lib/fancy_font/fancy");
const config = require('../config');
const B = require('../lib/buttons');

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

// Clean ID helper to isolate raw user numbers/identifiers
const getRawId = (jid = '') => {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0];
};

// Fixed user admin checker with LID and multi-device support
async function isUserAdmin(conn, from, sender) {
    try {
        const metadata = await conn.groupMetadata(from);
        const senderNum = getRawId(sender);

        const participant = metadata.participants.find(p => {
            const pNum = getRawId(p.id);
            const lidNum = p.lid ? getRawId(p.lid) : null;
            return pNum === senderNum || (lidNum && lidNum === senderNum);
        });

        return participant ? (participant.admin === 'admin' || participant.admin === 'superadmin') : false;
    } catch (e) {
        console.error("isUserAdmin Error:", e);
        return false;
    }
}

// Fixed bot admin checker with LID and multi-device support
async function isBotAdmin(conn, from) {
    try {
        const metadata = await conn.groupMetadata(from);
        const botJid = conn.user?.id || conn.user?.jid;
        const botNum = getRawId(botJid);

        const participant = metadata.participants.find(p => {
            const pNum = getRawId(p.id);
            const lidNum = p.lid ? getRawId(p.lid) : null;
            return pNum === botNum || (lidNum && lidNum === botNum);
        });

        return participant ? (participant.admin === 'admin' || participant.admin === 'superadmin') : false;
    } catch (e) {
        console.error("isBotAdmin Error:", e);
        return false;
    }
}

async function sendTsalaGroupCard(conn, mek, from, sender, title, content, mentions = []) {
    const infoText = 
`│ 👥 *${title}*
│
│ ${content}`;

    const cardContent = 
        `╭───〔 🌸 *Tsala Group* 🌸 〕───⬣\n${infoText}\n╰──────────────────────⬣\n> *✨ Tsala Yame | PᴏᴡᴇRᴇD ʙY MᴜLᴀX PʀIᴍE*`;

    const styledText = tiny(cardContent);
    const photoPath = getRandomPhoto();
    const image = photoPath && fs.existsSync(photoPath) ? { url: photoPath } : undefined;

    const buttons = [
        B.cmdBtn('👥 Admins', 'admins'),
        B.cmdBtn('ℹ️ Info', 'ginfo'),
        B.cmdBtn('📁 Menu', 'menu')
    ];

    await B.sendButtons(conn, from, {
        text: styledText,
        image: image,
        footer: 'Tsala Yame Group Manager',
        buttons: buttons
    }, { quoted: mek, mentions: mentions.length > 0 ? mentions : [sender] });
}

// 1. Admins
cmd({
    pattern: "admins",
    desc: "Get a list of group admins.",
    react: "👥",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command is only for groups."));
        
        const groupMetadata = await conn.groupMetadata(from);
        const adminParticipants = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        const adminsText = adminParticipants.map(admin => `@${admin.id.split('@')[0]}`).join('\n');
        const mentionsList = adminParticipants.map(admin => admin.id);

        await sendTsalaGroupCard(conn, mek, from, sender, "Group Admins", adminsText, mentionsList);
    } catch (e) {
        console.error(e);
        reply(tiny(`Error: ${e.message}`));
    }
});

// 2. Group Description
cmd({
    pattern: "gdesc",
    desc: "Change the group description.",
    use: '.gdesc <New Description>',
    react: "👥",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, sender, args, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command is only for groups."));
        if (!(await isUserAdmin(conn, from, sender))) return reply(tiny("You Must Be Admin To Use This Command"));
        if (!(await isBotAdmin(conn, from))) return reply(tiny("I need to be an admin to change the description."));
        if (args.length === 0) return reply(tiny('Please provide a new group description.'));

        const newDesc = args.join(' ');
        await conn.groupUpdateDescription(from, newDesc);
        await sendTsalaGroupCard(conn, mek, from, sender, "Group Description Updated", `New Description:\n${newDesc}`);
    } catch (e) {
        console.error(e);
        reply(tiny(`Error: ${e.message}`));
    }
});

// 3. Group Info
cmd({
    pattern: "ginfo",
    desc: "Get information about the group.",
    react: "👥",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command is only for groups."));
        
        const groupMetadata = await conn.groupMetadata(from);
        const groupInfo = 
`Group Name: ${groupMetadata.subject}
Description: ${groupMetadata.desc || 'No Description'}
Members: ${groupMetadata.participants.length}
Created On: ${new Date(groupMetadata.creation * 1000).toLocaleString()}`;

        await sendTsalaGroupCard(conn, mek, from, sender, "Group Information", groupInfo);
    } catch (e) {
        console.error(e);
        reply(tiny(`Error: ${e.message}`));
    }
});

// 4. Group Invite Link
cmd({
    pattern: "glink",
    desc: "Get the group's invite link.",
    react: "👥",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command is only for groups."));
        if (!(await isBotAdmin(conn, from))) return reply(tiny("I need to be a group admin."));
        
        const inviteLink = await conn.groupInviteCode(from);
        await sendTsalaGroupCard(conn, mek, from, sender, "Group Invite Link", `https://chat.whatsapp.com/${inviteLink}`);
    } catch (e) {
        console.error(e);
        reply(tiny(`Error: ${e.message}`));
    }
});

// 5. Change Group Name
cmd({
    pattern: "gname",
    desc: "Change the group name",
    use: ".gname <New Group Name>",
    react: "✏️",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, sender, args, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command can only be used in groups."));
        if (!(await isUserAdmin(conn, from, sender))) return reply(tiny("You must be an admin."));
        if (!(await isBotAdmin(conn, from))) return reply(tiny("I'm not an admin in this group."));
        
        const newName = args.join(" ");
        if (!newName) return reply(tiny("Please provide a new group name."));

        await conn.groupUpdateSubject(from, newName);
        await sendTsalaGroupCard(conn, mek, from, sender, "Group Name Changed", `New Name: ${newName}`);
    } catch (error) {
        console.error('Error changing group name:', error);
        reply(tiny("Failed to change the group name."));
    }
});

cmd({
    pattern: "setsubject",
    desc: "Change the group subject.",
    use: '.setsubject <New Subject>',
    react: "👥",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, sender, args, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command is only for groups."));
        if (!(await isUserAdmin(conn, from, sender))) return reply(tiny("You Must Be Admin To Use This Command"));
        if (!(await isBotAdmin(conn, from))) return reply(tiny("I'm not an admin in this group."));
        if (args.length === 0) return reply(tiny('Please provide a new group subject.'));

        const newSubject = args.join(' ');
        await conn.groupUpdateSubject(from, newSubject);
        await sendTsalaGroupCard(conn, mek, from, sender, "Group Subject Updated", `New Subject: ${newSubject}`);
    } catch (e) {
        console.error(e);
        reply(tiny(`Error: ${e.message}`));
    }
});

// 6. Tagall
cmd({
    pattern: "tagall",
    desc: "Mention all group members.",
    react: "👥",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command is only for groups."));
        if (!(await isUserAdmin(conn, from, sender))) return reply(tiny("You Must Be Admin To Use This Command"));
        
        const groupMetadata = await conn.groupMetadata(from);
        const members = groupMetadata.participants.map(p => `@${p.id.split('@')[0]}`).join('\n');
        const mentions = groupMetadata.participants.map(p => p.id);

        await sendTsalaGroupCard(conn, mek, from, sender, "Mentioning Everyone", members, mentions);
    } catch (e) {
        console.error(e);
        reply(tiny(`Error: ${e.message}`));
    }
});

// 7. Requests
cmd({
    pattern: "requests",
    desc: "View pending join requests",
    react: "📝",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command can only be used in groups."));
        if (!(await isBotAdmin(conn, from))) return reply(tiny("I'm not an admin in this group."));

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return reply(tiny("No pending join requests."));

        let msg = "";
        requests.forEach((request, index) => {
            msg += `${index + 1}. @${request.jid.split("@")[0]}\n`;
        });
        
        await sendTsalaGroupCard(conn, mek, from, sender, "Pending Join Requests", msg);
    } catch (error) {
        console.error(error);
        reply(tiny("Failed to retrieve join requests."));
    }
});

cmd({
    pattern: "accept",
    desc: "Accept group join request(s)",
    use: ".accept <numbers>",
    react: "✔️",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, sender, args, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command can only be used in groups."));
        if (!(await isUserAdmin(conn, from, sender))) return reply(tiny("You must be an admin."));
        if (!(await isBotAdmin(conn, from))) return reply(tiny("I'm not an admin in this group."));

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return reply(tiny("No pending join requests."));
        
        const match = args.join(" ");
        if (!match) return reply(tiny("Provide the number(s) of the request(s) to accept, separated by commas."));
        
        const indexes = match.split(",").map(num => parseInt(num.trim()) - 1);
        const validIndexes = indexes.filter(index => index >= 0 && index < requests.length);
        if (validIndexes.length === 0) return reply(tiny("Invalid request number(s)."));
        
        for (let index of validIndexes) {
            await conn.groupRequestParticipantsUpdate(from, [requests[index].jid], "accept");
        }
        await sendTsalaGroupCard(conn, mek, from, sender, "Requests Accepted", `Successfully accepted ${validIndexes.length} join request(s).`);
    } catch (error) {
        console.error(error);
        reply(tiny("Failed to accept join requests."));
    }
});

cmd({
    pattern: "reject",
    desc: "Reject group join request(s)",
    use: ".reject <numbers>",
    react: "❌",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, sender, args, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command can only be used in groups."));
        if (!(await isUserAdmin(conn, from, sender))) return reply(tiny("You must be an admin."));
        if (!(await isBotAdmin(conn, from))) return reply(tiny("I'm not an admin in this group."));

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return reply(tiny("No pending join requests."));
        
        const match = args.join(" ");
        if (!match) return reply(tiny("Provide the number(s) of the request(s) to reject, separated by commas."));

        const indexes = match.split(",").map(num => parseInt(num.trim()) - 1);
        const validIndexes = indexes.filter(index => index >= 0 && index < requests.length);

        if (validIndexes.length === 0) return reply(tiny("Invalid request number(s)."));
        for (let index of validIndexes) {
            await conn.groupRequestParticipantsUpdate(from, [requests[index].jid], "reject");
        }

        await sendTsalaGroupCard(conn, mek, from, sender, "Requests Rejected", `Rejected ${validIndexes.length} join request(s).`);
    } catch (error) {
        console.error(error);
        reply(tiny("Failed to reject join requests."));
    }
});

// 8. Kick
cmd({
    pattern: "kick",
    alias: ["remove"],
    desc: "Kicks replied/quoted, mentioned, or explicitly specified phone number.",
    react: "🚪",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny('This command is only for groups.'));
        if (!(await isUserAdmin(conn, from, sender))) return reply(tiny("You must be an admin."));
        if (!(await isBotAdmin(conn, from))) return reply(tiny("I need to be a group admin."));

        let user = null;
        if (m.quoted) {
            user = m.quoted.sender || m.quoted.participant;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            user = m.mentionedJid[0];
        } else if (args[0]) {
            const cleanNum = args[0].replace(/[^0-9]/g, '');
            if (cleanNum.length >= 7) {
                user = cleanNum + '@s.whatsapp.net';
            }
        }

        if (!user) return reply(tiny('Please reply to a message, @mention a user, or provide a phone number to kick.'));

        const targetNum = getRawId(user);
        const botNum = getRawId(conn.user?.id || conn.user?.jid);
        if (targetNum === botNum) return reply(tiny("I cannot kick myself."));

        // Match participant in metadata to obtain full, exact JID
        const metadata = await conn.groupMetadata(from);
        const targetParticipant = metadata.participants.find(p => {
            const pNum = getRawId(p.id);
            const lidNum = p.lid ? getRawId(p.lid) : null;
            return pNum === targetNum || (lidNum && lidNum === targetNum);
        });

        const jidToKick = targetParticipant ? targetParticipant.id : `${targetNum}@s.whatsapp.net`;

        await conn.groupParticipantsUpdate(from, [jidToKick], "remove");
        await sendTsalaGroupCard(conn, mek, from, sender, "User Kicked", `@${targetNum} has been removed from the group!`, [jidToKick]);
    } catch (e) {
        console.error("Kick Error:", e);
        reply(tiny('Error occurred while trying to kick the user.'));
    }
});

// 9. Unlock & Lock
cmd({
    pattern: "unlock",
    desc: "Allow all participants to modify the group's settings",
    react: "🔓",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command is only for groups."));
        if (!(await isUserAdmin(conn, from, sender))) return reply(tiny("You must be an admin."));
        if (!(await isBotAdmin(conn, from))) return reply(tiny("I need to be a group admin."));

        await conn.groupSettingUpdate(from, 'unlocked');
        await sendTsalaGroupCard(conn, mek, from, sender, "Group Unlocked", "All participants can now modify group settings.");
    } catch (e) {
        console.error(e);
        reply(tiny(`Error: ${e.message}`));
    }
});

cmd({
    pattern: "lock",
    desc: "Only allow admins to modify the group's settings",
    react: "🔒",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command is only for groups."));
        if (!(await isUserAdmin(conn, from, sender))) return reply(tiny("You must be an admin."));
        if (!(await isBotAdmin(conn, from))) return reply(tiny("I need to be a group admin."));

        await conn.groupSettingUpdate(from, 'locked');
        await sendTsalaGroupCard(conn, mek, from, sender, "Group Locked", "Only admins can now modify group settings.");
    } catch (e) {
        console.error(e);
        reply(tiny(`Error: ${e.message}`));
    }
});

// 10. Approve Specific Country
cmd({
    pattern: "approve",
    desc: "Automatically approve Specific Country users in the waiting list",
    react: "✅",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command is only for groups."));
        if (!(await isUserAdmin(conn, from, sender))) return reply(tiny("You must be an admin."));
        if (!(await isBotAdmin(conn, from))) return reply(tiny("I need to be a group admin."));

        const response = await conn.groupRequestParticipantsList(from);
        if (!response || response.length === 0) return reply(tiny("No participants are in the waiting list."));
        
        const countryCode = config.AUTO_ADD_Country_Code || "267";
        const toAddUsers = response.filter(user => user.jid.startsWith(countryCode));

        if (toAddUsers.length === 0) return reply(tiny(`No users from code ${countryCode} found in the waiting list.`));

        const userJids = toAddUsers.map(user => user.jid);
        await conn.groupRequestParticipantsUpdate(from, userJids, "approve");

        await sendTsalaGroupCard(conn, mek, from, sender, "Auto Approved", `Approved users:\n${userJids.map(j => '@' + j.split('@')[0]).join('\n')}`, userJids);
    } catch (e) {
        console.error(e);
        reply(tiny(`Error: ${e.message}`));
    }
});

// 11. Poll
cmd({
    pattern: "poll",
    desc: "Create a poll",
    use: ".poll <Question> | <Option1> | <Option2> | ...",
    react: "📊",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny("This command can only be used in groups."));
        
        const match = args.join(" ");
        const [question, ...options] = match.split("|").map(item => item.trim());
        if (!question || options.length < 2) return reply(tiny("Usage: .poll <Question> | <Option1> | <Option2> | ..."));

        await conn.sendMessage(from, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1
            }
        });
    } catch (error) {
        console.error(error);
        reply(tiny("Failed to create poll."));
    }
});

// 12. Get Profile Picture
cmd({
    pattern: "getpic",
    desc: "Get the group profile picture.",
    category: "group",
    react: "🖼",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        if (!m.isGroup) return reply(tiny('This command can only be used in a group.'));

        const groupPic = await conn.profilePictureUrl(from, 'image');
        await sendTsalaGroupCard(conn, mek, from, sender, "Group Profile Picture", groupPic);
    } catch (e) {
        console.error(e);
        reply(tiny(`Error: Profile picture could not be fetched or group has no picture.`));
    }
});