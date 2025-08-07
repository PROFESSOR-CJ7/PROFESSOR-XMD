/* jshint esversion: 8 */
/* jshint node: true */

/*
╭────────────────────────────────────────
PROFESSOR XMD  VERSION
OWNER : PROFESSOR XMD
OWN NO : 255740016011
KING THRONE OF PROFESSOR BOTS
╰─────────────────────────────────────────
*/

const fs = require('fs');
const chalk = require("chalk");
const { Boom } = require('@hapi/boom');
const { WA_DEFAULT_EPHEMERAL } = require('@adiwajshing/baileys');
const { exec } = require('child_process');
const { generateWAMessageFromContent } = require("@whiskeysockets/baileys");

// Owner Management System
const ownersFile = './lib/database/owner.json';
let owners = [];
function loadOwners() {
    if (fs.existsSync(ownersFile)) {
        owners = JSON.parse(fs.readFileSync(ownersFile));
    } else {
        owners = [];
        saveOwners();
    }
}
function saveOwners() {
    fs.writeFileSync(ownersFile, JSON.stringify(owners, null, 2));
}
function isOwner(user) {
    return owners.includes(user);
}
async function handleSetOwner(m, args, user, reply) {
    if (!isOwner(user)) return reply('🚫 You are not authorized.');
    if (!args[0]) return reply('⚠️ Provide number to set as owner.');
    let newOwner = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    owners = [newOwner];
    saveOwners();
    reply(`✅ Owner set to @${newOwner.split('@')[0]}`);
}
async function handleAddOwner(m, args, user, reply) {
    if (!isOwner(user)) return reply('🚫 You are not authorized.');
    if (!args[0]) return reply('⚠️ Provide number to add as owner.');
    let newOwner = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (!owners.includes(newOwner)) {
        owners.push(newOwner);
        saveOwners();
        reply(`✅ Added @${newOwner.split('@')[0]} as owner.`);
    } else {
        reply('⚠️ This number is already an owner.');
    }
}
async function handleDelOwner(m, args, user, reply) {
    if (!isOwner(user)) return reply('🚫 You are not authorized.');
    if (!args[0]) return reply('⚠️ Provide number to delete as owner.');
    let delOwner = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (owners.includes(delOwner)) {
        owners = owners.filter(owner => owner !== delOwner);
        saveOwners();
        reply(`✅ Deleted owner @${delOwner.split('@')[0]}`);
    } else {
        reply('⚠️ This number is not an owner.');
    }
}
async function handleListOwners(m, reply) {
    if (owners.length === 0) return reply('❌ No owners set.');
    let ownerList = owners.map(o => `@${o.split('@')[0]}`).join('\n');
    reply(`👑 Current Owners:\n${ownerList}`);
}

const prefixPath = './lib/database/prefix.json';
const autoreplyPath = './lib/database/autoreply.json';
const warningsPath = './lib/database/warnings.json';

function loadJSON(path, fallback) {
    try { return JSON.parse(fs.readFileSync(path)); } catch (e) { return fallback; }
}
function saveJSON(path, data) { fs.writeFileSync(path, JSON.stringify(data, null, 2)); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = async function(professor, m, chatUpdate, store) {
    loadOwners();
    try {
        let prefix = '.';
        let prefixData = loadJSON(prefixPath, {prefix: '.'});
        if (prefixData.prefix) prefix = prefixData.prefix;

        const body =
            m.mtype === "conversation" ? m.message.conversation :
            m.mtype === "imageMessage" ? m.message.imageMessage.caption :
            m.mtype === "videoMessage" ? m.message.videoMessage.caption :
            m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :
            m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
            m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
            m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
            m.mtype === "interactiveResponseMessage" ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id :
            m.mtype === "templateButtonReplyMessage" ? m.msg.selectedId :
            m.mtype === "messageContextInfo" ? (m.message.buttonsResponseMessage && m.message.buttonsResponseMessage.selectedButtonId) ||
                (m.message.listResponseMessage && m.message.listResponseMessage.singleSelectReply.selectedRowId) ||
                m.text : "";

        const sender = m.key.fromMe
            ? (professor.user.id.split(":")[0] + "@s.whatsapp.net" || professor.user.id)
            : m.key.participant || m.key.remoteJid;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const isInbox = !isGroup;

        const Access = isOwner(sender);

        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const text = args.join(" ");
        const quoted = m.quoted ? m.quoted : m;

        let groupMetadata = {};
        let groupOwner = "";
        let groupName = "";
        let participants = [];
        let groupAdmins = [];
        let groupMembers = [];
        let isGroupAdmins = false;
        let isBotGroupAdmins = false;
        let isAdmins = false;

        if (isGroup) {
            try {
                groupMetadata = await professor.groupMetadata(m.chat);
            } catch (e) {}
            groupOwner = groupMetadata.owner || "";
            groupName = groupMetadata.subject || "";
            participants = groupMetadata.participants || [];
            groupAdmins = participants.filter((v) => v.admin !== null).map((v) => v.id);
            groupMembers = participants;
            isGroupAdmins = groupAdmins.includes(sender);
            isBotGroupAdmins = groupAdmins.includes(await professor.decodeJid(professor.user.id));
            isAdmins = groupAdmins.includes(sender);
        }

        let autoreplies = loadJSON(autoreplyPath, {});
        let warnings = loadJSON(warningsPath, {});

        let autotype = global.autotype || false;
        let autorecord = global.autorecord || false;
        let autoReplyOn = global.autoreply || false;

        async function simulateType(chatid) {
            if (autotype) {
                await professor.sendPresenceUpdate('composing', chatid);
                await sleep(2000);
            }
        }
        async function simulateRecord(chatid) {
            if (autorecord) {
                await professor.sendPresenceUpdate('recording', chatid);
                await sleep(2000);
            }
         }

        const reply = async function(txt, chatid = m.chat) {
            await simulateType(chatid);
            await simulateRecord(chatid);
            
            professor.sendMessage(chatid, {
              text: txt,
              contextInfo: {
                mentionedJid: [sender],
                externalAdReply: {
                  title: "PROFESSOR XMD AI HUB",
                  body: "ADVANCED AI ENGINE 🚀",
                  thumbnailUrl: "https://files.catbox.moe/y96u7s.jpg",
                  sourceUrl: "https://whatsapp.com/channel/0029Vb5mgYNFi8xZirsFij2l",
                        renderLargerThumbnail: true,
                        showAdAttribution: true
                }
              }
            }, { quoted: m });
        };

        // --- Antilink System ---
        if (isGroup && /https:\/\//.test(body)) {
            const groupMetadata = await professor.groupMetadata(m.chat);
            const participant = groupMetadata.participants.find(p => p.id === sender);
            if (!participant?.admin) {
                await professor.sendMessage(m.chat, { text: `⚠️ Link Detected: @${sender.split('@')[0]} will be removed.`, mentions: [sender] });
                await professor.groupParticipantsUpdate(m.chat, [sender], 'remove');
            }
        }

        // --- AntiDelete Logic ---
        professor.ev.on('message-revoke', async (data) => {
            const { remoteJid, key } = data;
            const originalMsg = await store.loadMessage(remoteJid, key.id);
            if (originalMsg) {
                await professor.sendMessage(remoteJid, { text: `🔄 Anti-Delete: ${originalMsg.message.conversation || 'Media message'}` });
                if (global.antideletesendinbox) {
                    for (const owner of owners) {
                        await professor.sendMessage(owner, { text: `🗑 Deleted Message in ${remoteJid}: ${originalMsg.message.conversation || 'Media message'}` });
                    }
                }
            }
        });

        // --- Auto Typing/Recording for DM to owner and any command ---
        if ((isOwner(sender) || isCmd) && (autotype || autorecord)) {
            await simulateType(m.chat);
            await simulateRecord(m.chat);
        }

        // --- AutoReply system ---
        if (!isCmd && autoReplyOn && autoreplies && autoreplies[body?.toLowerCase()]) {
            await reply(autoreplies[body.toLowerCase()]);
            return;
        }

        switch (command) {
            case 'professor':
            case 'menu': {
                let dox = `*Hello ${pushname}...👋*
*WELCOME TO THE PROFESSOR XMD BOT  VAULT — WHERE COMMANDS TURN TO POWER ⚡💀*
*Words are cheap, actions are priceless. See you in the results. Professor XMD*

  ❒PROFESSOR XMD VERSIONS❒
╭━━━━━━━━━━━━━━❒
┃   *❒OWNER MENU*
┃ ❒ ${prefix}setowner
┃ ❒ ${prefix}addowner
┃ ❒ ${prefix}delowner
┃ ❒ ${prefix}listowners
┃ ❒ ${prefix}public
┃ ❒ ${prefix}self
┃ ❒ ${prefix}ping
┃ ❒ owner
┃ ❒ xowner
┗━━━━━━━━━━━━━━❒
╭━━━━━━━━━━━━━━❒
┃   *❒GROUP MENU*
┃ ❒ welcome
┃ ❒ goodbye
┃ ❒ remove/kick
┃ ❒ add
┃ ❒ leave
┃ ❒ ${prefix}hidetag
┃ ❒ tagall
┃ ❒ info
┃ ❒ promote @user
┃ ❒ demote @user
┃ ❒ gpclose
┃ ❒ gpopen
┃ ❒ groupdesc NewDesc
┃ ❒ listonline
┗━━━━━━━━━━━━━━❒
╭━━━━━━━━━━━━━━❒
┃   *❒ANTI-SPAM MENU*
┃ ❒ antilink on/off
┃ ❒ antidelete on/off
┃ ❒ antideletesendinbox on/off
┃ ❒ warn @user reason
┃ ❒ delete
┗━━━━━━━━━━━━━━❒
╭━━━━━━━━━━━━━━❒
┃   *❒FUN MENU*
┃ ❒ truth
┃ ❒ dare
┃ ❒ love @user
┃ ❒ hack @user
┗━━━━━━━━━━━━━━❒
╭━━━━━━━━━━━━━━❒
┃   *❒MUSIC & MEDIA*
┃ ❒ play song name
┗━━━━━━━━━━━━━━❒
╭━━━━━━━━━━━━━━❒
┃   *❒BOT SETTINGS*
┃ ❒ autoreply on/off
┃ ❒ setautoreply
┃ ❒ setprefix !
┃ ❒ uptime/runtime
┃ ❒ autotype on/off
┃ ❒ autorecord on/off
┗━━━━━━━━━━━━━━❒

*┃STAY UNSTOPPABLE┃*
`;
                await professor.sendMessage(m.chat, {
                    text: dox,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        mentionedJid: [sender],
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "PROFESSOR XMD",
                            newsletterJid: "120363424730632024@newsletter"
                        },
                        externalAdReply: {
                            title: "PROFESSOR XMD AI HUB",
                            body: "ADVANCED AI 	ENGINE 🚀",
                            thumbnailUrl: "https://files.catbox.moe/y96u7s.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029Vb5mgYNFi8xZirsFij2l",
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: m });

                try {
                    await professor.sendMessage(m.chat, {
                        audio: fs.readFileSync("./lib/media/professor.mp3"),
                        mimetype: "audio/mpeg",
                        ptt: false
                    }, { quoted: m });
                } catch (e) {}
            }
            break;
            case 'setowner': await handleSetOwner(m, args, sender, reply); break;
            case 'addowner': await handleAddOwner(m, args, sender, reply); break;
            case 'delowner': await handleDelOwner(m, args, sender, reply); break;
            case 'listowners': await handleListOwners(m, reply); break;
            case 'hack': {
                const target = text.match(/@\d+/)?.[0];
                if (target) {
                    await professor.sendMessage(m.chat, { text: `⚡ Initiating hack on ${target}...`, mentions: [target.replace('@', '') + '@s.whatsapp.net'] });
                    await simulateType(m.chat);
                    await sleep(3000);
                    await professor.sendMessage(m.chat, { text: `📡 Accessing files of ${target}...`, mentions: [target.replace('@', '') + '@s.whatsapp.net'] });
                    await sleep(3000);
                    await professor.sendMessage(m.chat, { text: `💥 Successfully hacked ${target}. Data compromised! (PRANKED 😂)`, mentions: [target.replace('@', '') + '@s.whatsapp.net'] });
                } else {
                    await professor.sendMessage(m.chat, { text: `❌ Please mention a user to hack.` });
                }
            }
            break;
            case 'listonline': {
                if (!isGroup) return reply('Group only');
                const groupMetadata = await professor.groupMetadata(m.chat);
                let onlineUsers = groupMetadata.participants.filter(p => p.isOnline).map(p => `@${p.id.split('@')[0]}`).join('\n');
                if (!onlineUsers) onlineUsers = 'No members are online.';
                await professor.sendMessage(m.chat, { text: `🟢 Online Members:\n${onlineUsers}`, mentions: groupMetadata.participants.map(p => p.id) });
            }
            break;
            case 'remove':
            case 'kick': {
                if (!isGroup) return reply('Group only');
                if (!isGroupAdmins && !Access) return reply('Admin only');
                if (!isBotGroupAdmins) return reply('I need to be admin');
                let target = m.mentionedJid && m.mentionedJid[0] || args[0];
                if (!target) return reply('Tag/number to kick');
                let jid = target.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                await professor.groupParticipantsUpdate(m.chat, [jid], 'remove');
                reply('Member removed!');
            }
            break;
            case 'add': {
                if (!isGroup) return reply('Group only');
                if (!isGroupAdmins && !Access) return reply('Admin only');
                if (!isBotGroupAdmins) return reply('I need to be admin');
                let num = args[0];
                if (!num) return reply('Usage: .add 255xxxxxxx');
                let jid = num.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                await professor.groupParticipantsUpdate(m.chat, [jid], 'add');
                reply('Member added!');
            }
            break;
            case 'leave': {
                if (!isGroup) return reply('Group only');
                await reply("Professor XMD bot is leaving the group. Goodbye!");
                await sleep(2000);
                await professor.groupLeave(m.chat);
            }
            break;
            case 'tagall': {
                if (!isGroup) return reply('Group only');
                if (!isGroupAdmins && !Access) return reply('Admin only');
                let mentions = participants.map(a => a.id);
                let order = mentions.map((x, i) => `${i + 1}. @${x.split('@')[0]}`).join('\n');
                let txt = args.join(' ') || '*Tagging all members*';
                await professor.sendMessage(m.chat, {
                    text: txt + '\n' + order,
                    mentions
                }, { quoted: m });
            }
            break;
            case 'promote': {
                if (!isGroup) return reply('Group only');
                if (!isGroupAdmins && !Access) return reply('Admin only');
                let target = m.mentionedJid && m.mentionedJid[0];
                if (!target) return reply('Tag the user to promote!');
                await professor.groupParticipantsUpdate(m.chat, [target], 'promote');
                reply('User promoted to admin!');
            }
            break;
            case 'demote': {
                if (!isGroup) return reply('Group only');
                if (!isGroupAdmins && !Access) return reply('Admin only');
                let target = m.mentionedJid && m.mentionedJid[0];
                if (!target) return reply('Tag the user to demote!');
                await professor.groupParticipantsUpdate(m.chat, [target], 'demote');
                reply('User demoted to member!');
            }
            break;
            case 'groupdesc': {
                if (!isGroup) return reply('Group only');
                if (!isGroupAdmins && !Access) return reply('Admin only');
                let newDesc = text;
                if (!newDesc) return reply('Provide new description');
                await professor.groupUpdateDescription(m.chat, newDesc);
                reply('Group description updated!');
            }
            break;
            case 'info': {
                if (!isGroup) return reply('Group only');
                let info = `Group Name: ${groupName}\nGroup ID: ${m.chat}\nMembers: ${participants.length}\nOwner: ${groupOwner}\nCreated: ${groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toLocaleString() : 'Unknown'}\nDesc: ${groupMetadata.desc || 'No description'}`;
                reply(info);
            }
            break;
            case "public": {
                if (!Access) return reply('Owner only');
                professor.public = true;
                reply(`successfully changed to ${command}`);
            }
            break;
            case "self": {
                if (!Access) return reply('Owner only');
                professor.public = false;
                reply(`successfully changed to ${command}`);
            }
            break;
            case "ping": {
                await professor.sendMessage(m.chat, { text: 'Loading...' });
                const speed = function() {
                    return new Date().getTime();
                };
                const latency = speed();
                await professor.sendMessage(m.chat, { text: `🔹 Pong: ${latency.toFixed(4)} MS ⚡` });
            }
            break;
            case "owner":
            case "xowner": {
                let namaown = `PROFESSOR XMD`;
                let NoOwn = `255740016011`;
                var contact = await generateWAMessageFromContent(m.chat, {
                  contactMessage: {
                    displayName: namaown,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;;;;\nFN:${namaown}\nitem1.TEL;waid=${NoOwn}:+${NoOwn}\nitem1.X-ABLabel:Ponsel\nX-WA-BIZ-DESCRIPTION: JavaScript coder\nX-WA-BIZ-NAME:[[ ༑ Professor-X5⿻ 𝐏𝐔𝐁𝐋𝐢𝐂 ༑ ]]\nEND:VCARD`
                  }
                }, {
                  userJid: m.chat,
                  quoted: m
                });
                professor.relayMessage(m.chat, contact.message, {
                    messageId: contact.key.id
                });
            }
            break;
            case "hidetag": {
                if (!isGroup) return reply('Group only');
                if (!isAdmins && !Access) return reply('Admin only');
                if (m.quoted) {
                    professor.sendMessage(m.chat, {
                        forward: m.quoted.fakeObj,
                        mentions: participants.map(a => a.id)
                    });
                }
                if (!m.quoted) {
                    professor.sendMessage(m.chat, {
                        text: text ? text : '',
                        mentions: participants.map(a => a.id)
                    }, { quoted: m });
                }
            }
            break;
            case 'truth': {
                let truths = [
                    "What was your most embarrassing moment?",
                    "Have you ever lied to your best friend?",
                    "What is your secret fear?",
                    "Who do you love most in this group?"
                ];
                reply(truths[Math.floor(Math.random() * truths.length)]);
            }
            break;
            case 'dare': {
                let dares = [
                    "Send a voice note saying 'I am a bot!'",
                    "Tag group owner and say 'I need airtime!'",
                    "Change your profile pic to a meme for 1 hour."
                ];
                reply(dares[Math.floor(Math.random() * dares.length)]);
            }
            break;
            case 'love': {
                let target = m.mentionedJid && m.mentionedJid[0];
                if (!target) return reply('Tag the user you love!');
                reply(`I Love You ❤️ @${target.split('@')[0]}`);
            }
            break;
            case 'play': {
                let song = text;
                if (!song) return reply('Write song name: .play song name');
                reply(`Searching for "${song}"...\n(Not implemented here, use ytdl-core or scraper backend for real download)`);
            }
            break;
            case 'autotype': {
                if (!['on','off'].includes(text)) return reply('Use: .autotype on/off');
                global.autotype = text === 'on';
                reply('Auto typing set to ' + text);
            }
            break;
            case 'autorecord': {
                if (!['on','off'].includes(text)) return reply('Use: .autorecord on/off');
                global.autorecord = text === 'on';
                reply('Auto recording set to ' + text);
            }
            break;
            case 'antilink': {
                if (!isGroup) return reply('Group only');
                if (!isGroupAdmins && !Access) return reply('Admin only');
                if (!['on','off'].includes(text)) return reply('Use: .antilink on/off');
                global.antilink = text === 'on';
                reply('Antilink set to ' + text);
            }
            break;
            case 'antidelete': {
                if (!['on','off'].includes(text)) return reply('Use: .antidelete on/off');
                global.antidelete = text === 'on';
                reply('Anti-delete set to ' + text);
            }
            break;
            case 'antideletesendinbox': {
                if (!['on','off'].includes(text)) return reply('Use: .antideletesendinbox on/off');
                global.antideletesendinbox = text === 'on';
                reply('Anti-delete (send inbox) set to ' + text);
            }
            break;
            case 'warn': {
                if (!isGroup) return reply('Group only');
                if (!isGroupAdmins && !Access) return reply('Admin only');
                let target = m.mentionedJid && m.mentionedJid[0];
                let reason = args.slice(1).join(' ') || 'No reason';
                if (!target) return reply('Tag user to warn!');
                warnings[target] = warnings[target] ? warnings[target] + 1 : 1;
                saveJSON(warningsPath, warnings);
                reply(`User warned! Reason: ${reason}\nTotal warnings: ${warnings[target]}`);
            }
            break;
            case 'delete': {
                if (!isGroup) return reply('Group only');
                if (!isGroupAdmins && !Access) return reply('Admin only');
                if (!m.quoted) return reply('Reply to the message to delete!');
                await professor.deleteMessage(m.chat, m.quoted.key);
                reply('Message deleted!');
            }
            break;
            case 'welcome': {
                if (!isGroup) return reply('Group only');
                if (!isGroupAdmins && !Access) return reply('Admin only');
                if (!['on','off'].includes(text)) return reply('Use: .welcome on/off');
                global.welcome = text === 'on';
                reply('Welcome message set to ' + text);
            }
            break;
            case 'goodbye': {
                if (!isGroup) return reply('Group only');
                if (!isGroupAdmins && !Access) return reply('Admin only');
                if (!['on','off'].includes(text)) return reply('Use: .goodbye on/off');
                global.goodbye = text === 'on';
                reply('Goodbye message set to ' + text);
            }
            break;
            case 'setprefix': {
                if (!Access) return reply('Owner only');
                let newPrefix = args[0];
                if (!newPrefix) return reply('Set prefix: .setprefix !');
                saveJSON(prefixPath, {prefix: newPrefix});
                reply('Command prefix set to: ' + newPrefix);
            }
            break;
            case 'autoreply': {
                if (!['on','off'].includes(text)) return reply('Use: .autoreply on/off');
                global.autoreply = text === 'on';
                reply('Auto reply set to ' + text);
            }
            break;
            case 'setautoreply': {
                if (!Access) return reply('Owner only');
                let [key, ...rest] = args;
                let value = rest.join(' ');
                if (!key || !value) return reply('Usage: .setautoreply hi Hello!');
                autoreplies[key.toLowerCase()] = value;
                saveJSON(autoreplyPath, autoreplies);
                reply(`Auto reply set: "${key}" => "${value}"`);
            }
            break;
            case 'uptime':
            case 'runtime': {
                let up = process.uptime();
                let hours = Math.floor(up / 3600);
                let minutes = Math.floor((up % 3600) / 60);
                let seconds = Math.floor(up % 60);
                reply(`Bot runtime: ${hours}h ${minutes}m ${seconds}s`);
            }
            break;
            default: {
                if (typeof m.text === "string") {
                    const budy = m.text;
                    if (budy.startsWith('/')) {
                        if (!Access) return;
                        exec(budy.slice(2), (err, stdout) => {
                            if (err) return reply(err);
                            if (stdout) return reply("\n" + stdout);
                        });
                    }
                    if (budy.startsWith('X')) {
                        if (!Access) return;
                        try {
                            let evaled = await eval(budy.slice(2));
                            if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
                            await m.reply(evaled);
                        } catch (err) {
                            m.reply(String(err));
                        }
                    }
                    if (budy.startsWith('-')) {
                        if (!Access) return;
                        let kode = budy.trim().split(/ +/)[0];
                        let teks;
                        try {
                            teks = await eval(`(async () => { ${kode === ">>" ? "return" : ""} ${text}})()`);
                        } catch (e) {
                            teks = e;
                        } finally {
                            await m.reply(require('util').format(teks));
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log(require("util").format(err));
    }
};

console.log(chalk.greenBright('✅ Advanced Bot System Loaded...'));

const file = require.resolve(__filename);
require('fs').watchFile(file, () => {
    require('fs').unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
    delete require.cache[file];
    require(file);
});
