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
      professor.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages?.[0];
        const jid = msg?.key?.remoteJid;

        if (!msg || msg.key.fromMe) return;

        const isGroup = jid.endsWith('@g.us');

        if (global.autotype) {
          if (
            (global.autotypeTarget === 'group' && isGroup) ||
            (global.autotypeTarget === 'dm' && !isGroup) ||
            (global.autotypeTarget === 'all')
          ) await professor.sendPresenceUpdate('composing', jid);
        }

        if (global.autorecord) {
          if (
            (global.autorecordTarget === 'group' && isGroup) ||
            (global.autorecordTarget === 'dm' && !isGroup) ||
            (global.autorecordTarget === 'all')
          ) await professor.sendPresenceUpdate('recording', jid);
        }
      });

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
┃ ❒ getpp
┃ ❒ edward
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
┃ ❒ groupdesc
┃ ❒ listonline
┃ ❒ getgp
┃ ❒ link
┗━━━━━━━━━━━━━━❒
╭━━━━━━━━━━━━━━❒
┃   *❒ANTI-SPAM MENU*
┃ ❒ antilink on/off
┃ ❒ antidelete on/off
┃ ❒ antideletesendinbox on/off
┃ ❒ warn 
┃ ❒ delete
┗━━━━━━━━━━━━━━❒
╭━━━━━━━━━━━━━━❒
┃   *❒FUN MENU*
┃ ❒ truth
┃ ❒ dare
┃ ❒ love 
┃ ❒ hack 
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
          function extractTargetJid(text, m) {
    // Ikiwa kuna mtu ametagwa
              if (m.mentionedJid && m.mentionedJid.length > 0) {
                  return m.mentionedJid[0];
    }
    // Ikiwa kuna namba imeandikwa moja kwa moja
              if (text && /^\d+$/.test(text)) {
                  return text + "@s.whatsapp.net";
              }
              return null;
          }
            case 'hack': {
              const targetJid = extractTargetJid(text, m);
              if (!targetJid) {
               await professor.sendMessage(m.chat, { text: 'Usage: .hack @number (reply/mention)' }, { quoted: m });
               break;
              }

              const handle = `@${targetJid.replace('@s.whatsapp.net','')}`;

              const header = [
                '╔═════════════════════════════╗',
                '║ 🔐 SYSTEM SECURITY ALERT ║',
                '╚═════════════════════════════╝',
                `⛔ Breach signal linked to ${handle}`,
                'Initializing containment protocol...'
              ].join('\n');

              await simulateType(professor, m.chat, 1000);
              await professor.sendMessage(m.chat, { text: header, mentions: [targetJid] });
              await sleep(1200);

              const effects = [
                '🔎 Tracing digital footprint...',
                '🛰️ Pinging satellite proxies...',
                '💾 Extracting data clusters...',
                '🧬 Matching biometric hash...',
                '🪞 Analyzing browser shadows...',
                '🧠 Syncing behavioral mesh...',
                '⚡ Injecting trace algorithm...',
                '🔗 Linking synthetic profile...',
                '💣 Queueing firewall override...'
              ];

              for (const step of effects) {
                await simulateType(professor, m.chat, 800);
                await professor.sendMessage(m.chat, { text: step, mentions: [targetJid] });
                await sleep(1100);
              }

              const finale = [
                '🚨 ACCESS GRANTED TO CORE NODE',
                `📍 Target ${handle} synchronized`,
                '⌛ Final verification underway...'
              ].join('\n');

              await simulateType(professor, m.chat, 900);
              await professor.sendMessage(m.chat, { text: finale, mentions: [targetJid] });
            }
            break;
            case 'listonline': {
              if (!isGroup) return reply('⚠️ This command can only be used in group chats.');

              const groupMetadata = await professor.groupMetadata(m.chat);
              const onlineNow = [];

              for (const participant of groupMetadata.participants) {
                const jid = participant.id;

                try {
                  await professor.presenceSubscribe(jid); // subscribe to presence
                  await delay(200); // allow time for sync

                  const presenceData = await professor.getPresence(jid);

                  if (presenceData?.lastKnownPresence === 'available') {
                    const name = groupMetadata?.participants?.find(p => p.id === jid)?.name || jid.split('@')[0];
                    onlineNow.push(`🟢 ${name} is currently online`);
                  }
                } catch (error) {
                  continue;
                }
              }

              if (onlineNow.length === 0) {
                return reply('😴 No members are online at the moment.');
              }

              const response = [
                '📶 Online Members (Live Detection)',
                '────────────────────────────',
                ...onlineNow,
                '────────────────────────────',
                `🕒 Checked at: ${new Date().toLocaleTimeString()}`
              ].join('\n');

              await professor.sendMessage(m.chat, { text: response }, { quoted: m });
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
              if (!isGroup) return reply('⚠️ This command only works in groups.');
              if (!isGroupAdmins && !Access) return reply('🛑 You need to be an admin to do that.');

              const target = m.mentionedJid?.[0] 
                || (text?.match(/^\d{9,15}$/) ? `${text.trim()}@s.whatsapp.net` : null);

              if (!target) return reply('👤 Mention a user or enter their number (e.g., 2557xxxxxxx)');

              try {
                await professor.groupParticipantsUpdate(m.chat, [target], 'promote');

                const imageUrl = 'https://files.catbox.moe/y96u7s.jpg';
                const userId = target.replace('@s.whatsapp.net', '');

                const badge = [
                  '╭━🎖️ *Group Authority Notification* ━╮',
                  `│ 👤 User: @${userId}`,
                  '│ 🛡️ Role: Admin',
                  '│ ⚡ Elevation: Success',
                  '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
                  '✨ Admin access granted. Use it wisely.'
                ].join('\n');

                await professor.sendMessage(m.chat, {
                  image: { url: imageUrl },
                  caption: badge,
                  mentions: [target]
                }, { quoted: m });

              } catch (err) {
                console.error('Promotion error:', err);
                reply('❌ Could not promote user. Ensure the number or tag is correct.');
              }
            }
            break;
            case 'demote': {
              if (!isGroup) return reply('⚠️ This command works only in groups.');
              if (!isGroupAdmins && !Access) return reply('🛑 You need admin privileges to do that.');

              const target = m.mentionedJid?.[0] 
                || (text?.match(/^\d{9,15}$/) ? `${text.trim()}@s.whatsapp.net` : null);

              if (!target) return reply('👤 Mention a user or type their number (e.g., 2557xxxxxxx)');

              try {
                await professor.groupParticipantsUpdate(m.chat, [target], 'demote');

                const userId = target.replace('@s.whatsapp.net', '');
                const imageUrl = 'https://files.catbox.moe/y96u7s.jpg';

                const badge = [
                  '╭─ ❎ *Demotion Executed* ─╮',
                  `│ 👤 *User:* @${userId}`,
                  '│ 📉 *New Role:* Member',
                  '│ 🔒 *Privileges:* Revoked',
                  '╰────────────────────────╯',
                  '🕶️ Admin access removed successfully.'
                ].join('\n');

                await professor.sendMessage(m.chat, {
                  image: { url: imageUrl },
                  caption: badge,
                  mentions: [target]
                }, { quoted: m });

              } catch (err) {
                console.error('Demotion error:', err);
                reply('❌ Failed to demote user. Please check the details and try again.');
              }
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
            case 'public': {
               if (!Access) return reply('🛑 Owner access required to change bot mode.');

               professor.public = true;

               const message = [
                 '╭─ 🔓 *Mode Change Confirmed* ─╮',
                 '│ 🔧 Status: Public',
                 '│ 🌐 Visibility: Global Access Enabled',
                 `│ 📅 Time: ${new Date().toLocaleString()}`,
                 '╰────────────────────────────╯'
               ].join('\n');

               await professor.sendMessage(m.chat, {
                 image: { url: 'https://files.catbox.moe/y96u7s.jpg' },
                 caption: message
               }, { quoted: m });
            }
            break;
            case 'self': {
              if (!Access) return reply('🛑 Owner access required to change bot mode.');

              professor.public = false;

              const message = [
                '╭─ 🔒 *Mode Change Confirmed* ─╮',
                '│ 🔧 Status: Self',
                '│ 🛡️ Visibility: Owner Only',
                `│ 📅 Time: ${new Date().toLocaleString()}`,
                '╰────────────────────────────╯'
              ].join('\n');

              await professor.sendMessage(m.chat, {
                image: { url: 'https://files.catbox.moe/y96u7s.jpg' },
                caption: message
              }, { quoted: m });
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
            case 'owner': {
              try {
                const botJid = professor.user.id; // e.g., '255740016011@s.whatsapp.net'
                const botNumber = botJid.split('@')[0];
                const botName = 'PROFESSOR XMD'; // optional custom alias

                const vcard = [
                  'BEGIN:VCARD',
                  'VERSION:3.0',
                  `FN:${botName}`,
                  `TEL;waid=${botNumber}:${botNumber}`,
                  'END:VCARD'
              ].join('\n');

              const contactMsg = await generateWAMessageFromContent(m.chat, {
                contactMessage: {
                  displayName: botName,
                  vcard
                }
              }, {
                userJid: m.chat,
                quoted: m
              });

              await professor.relayMessage(m.chat, contactMsg.message, {
                messageId: contactMsg.key.id
              });

            } catch (err) {
              console.error('Owner command error:', err);
              reply('❌ Unable to fetch owner details from session.');
            }
            }
            break;
            case "hidetag": {
                if (!isGroup) return reply('⚠️ This command works only in group');
                if (!isAdmins && !Access) return reply('You need admin privileges to do that.');
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
                "Who do you love most in this group?",
                "If you could spy on one group member for 24 hours, who would it be?",
                "Have you ever stalked someone's profile without liking anything?",
                "What’s a lie you've told to avoid drama?",
                "Who do you secretly admire but pretend not to?",
                "What’s one thing on your phone you don’t want anyone to see?",
                "Have you ever been caught talking behind someone's back?",
                "What's your most shameless moment on social media?",
                "If your chats were leaked, which one would ruin you?",
                "Have you ever flirted just to get attention or favors?",
                "What’s your worst habit in relationships?",
                "Have you ever rejected someone and later regretted it?",
                "What's the weirdest DM you've received?",
                "Have you ever ignored a message intentionally and lied about it?",
                "Which emoji do you overuse when trying to flirt?",
                "What’s something you pretend to understand but secretly don’t?",
                "If your search history was exposed, what would embarrass you most?",
                "What's a childish habit you still secretly enjoy?",
                "Have you ever posted something just to provoke someone?",
              ];
                reply(truths[Math.floor(Math.random() * truths.length)]);
            }
            break;
            case 'dare': {
              let dares = [
                "Send a 10-second voice note saying: 'I am a bot in training' with your most dramatic voice.",
                "Tag the group owner and say: 'I need AI upgrades, boss!' with a 🫡 emoji.",
                "Change your About/Status to 'System: Updating… ⏳' for 10 minutes.",
                "Reply to your last message with: 'System Rebooted ✅'.",
                "Type the alphabet backwards in one go: Z to A — no mistakes allowed.",
                "Send one message using only 5 emojis to describe your current mood.",
                "Share one lyric line from the last song you listened to (no links).",
                "Send a 5–10 second humming or beatbox voice note of your favorite tune.",
                "Answer the next question in the chat using exactly 7 words.",
                "Send a meme or GIF that matches today's vibe.",
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
              const isCreator = m.key.fromMe || ownerNumber.includes(m.sender);
              if (!isCreator) return reply('🛑 Only the owner can change autotype settings.');

              const input = args[0]?.toLowerCase();
              const options = ['all', 'group', 'dm', 'off'];

              if (!input) return reply(`🧠 Autotype Menu
            🔹 .autotype all     → Enable everywhere
            🔹 .autotype group   → Groups only
            🔹 .autotype dm      → Private chats
            🔹 .autotype off     → Turn off`);

              if (!options.includes(input)) {
                return reply(`❌ Invalid choice: *${input}*\n✅ Use: all / group / dm / off`);
              }

              if (input === 'off') {
                global.autotype = false;
                return reply('🔕 Autotype disabled.');
              }

              global.autotype = true;
              global.autotypeTarget = input;

              const scope =
                input === 'group' ? 'in groups 🫂' :
                input === 'dm'    ? 'in private chats 💬' :
                'everywhere 🌐';

              return reply(`✅ Autotype active ${scope}. Typing status will appear automatically.`);
            }
            break;
            case 'autorecord': {
              const isCreator = m.key.fromMe || ownerNumber.includes(m.sender);
              if (!isCreator) return reply('🔐 Only the owner can manage autorecord.');

              const input = args[0]?.toLowerCase();
              const modes = ['all', 'group', 'dm', 'off'];

              if (!input) {
                return reply(`🎙️ *Autorecord Menu*
            🔹 .autorecord all     → Enable in all chats
            🔸 .autorecord group   → Groups only
            🔸 .autorecord dm      → DMs only
            🚫 .autorecord off     → Disable autorecord\n\n🧩 Current mode: *${global.autorecord ? global.autorecordTarget : 'off'}*`);
              }

              if (!modes.includes(input)) {
                return reply(`❌ Invalid mode: *${input}*\n✅ Try one of: all / group / dm / off`);
              }

              global.autorecord = input !== 'off';
              global.autorecordTarget = input;

              const label = {
                all:   '🌐 everywhere',
                group: '👥 group chats',
                dm:    '💬 private chats',
                off:   '🚫 disabled'
              };

              return reply(`🎤 Autorecord has been set to *${label[input]}*.\nSilent recording indicator will activate accordingly.`);
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
                if (!isGroup) return reply('👥 This command works in group chats only');
                if (!isGroupAdmins && !Access) return reply('Only admins can use this command');
                if (!m.quoted) return reply('Reply to the message to delete!');
                await professor.deleteMessage(m.chat, m.quoted.key);
                reply('Message deleted!');
            }
            break;
            case 'welcome': {
              if (!isGroup) return reply('👥 This command works in group chats only.');
              const mode = text?.toLowerCase();
              if (!['on', 'off'].includes(mode)) {
                return reply(`🎚️ *Welcome Setup Menu*

             🟢 .welcome on   → Enable welcome messages
            🔴 .welcome off  → Disable welcome messages`);
              }

              global.welcome = mode === 'on';
              return reply(`✅ *Welcome messages* have been ${global.welcome ? '*enabled* 🟢' : '*disabled* 🔴'}`);
            }
            break;

// 🎉 Auto Listener — Send Welcome Badge on Member Join
            sock.ev.on('group-participants.update', async (anu) => {
              if (!global.welcome || anu.action !== 'add') return;
              try {
                const meta = await sock.groupMetadata(anu.id);
                for (const user of anu.participants) {
                  const tag = user.split('@')[0];
                  const imageUrl = 'https://files.catbox.moe/y96u7s.jpg'; // HD badge image

                  await professor.sendMessage(anu.id, {
                    image: { url: imageUrl },
                    caption: `╔═══━░★░━═══╗
                 👋 𝗛𝗲𝗹𝗹𝗼 @${tag}  
                 🏠 𝗚𝗿𝗼𝘂𝗽: *${meta.subject}*  
                 🎯 Enjoy your stay & vibe freely!
                 ╚═══━░★░━═══╝`,
                    mentions: [user]
                  });
                }
              } catch (err) {
                console.error('Error sending welcome:', err);
              }
            });
            case 'goodbye': {
                if (!isGroup) return reply('👥 This command works in group chats only.');

                const mode = text?.toLowerCase();
                if (!['on', 'off'].includes(mode)) {
                  return reply(`🎚️ *Goodbye Setup Menu*

            🔴 .goodbye off  → Disable goodbye messages
             🟢 .goodbye on   → Enable goodbye messages`);
                }

                global.goodbye = mode === 'on';
                return reply(`✅ *Goodbye messages* have been ${global.goodbye ? '*enabled* 🟢' : '*disabled* 🔴'}`);
            }
            break;

// 🎯 Auto Listener — Send Goodbye Badge on Member Leave
            professor.ev.on('group-participants.update', async (anu) => {
                if (!global.goodbye || anu.action !== 'remove') return;
                try {
                    const meta = await professor.groupMetadata(anu.id);
                    for (const user of anu.participants) {
                        const tag = user.split('@')[0];
                        const imageUrl = 'https://files.catbox.moe/y96u7s.jpg'; // Badge yako ya custom

                        await professor.sendMessage(anu.id, {
                            image: { url: imageUrl },
                            caption: `╔═══━░★░━═══╗
                         👋 𝗚𝗼𝗼𝗱𝗯𝘆𝗲 @${tag}  
                         🏠 𝗙𝗿𝗼𝗺: *${meta.subject}*  
                         💌 We’ll miss you, take care!  
                         ╚═══━░★░━═══╝`,
                            mentions: [user]
                        });
                   }
               } catch (err) {
                   console.error(err);
               }
            });
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
            case 'getgp': {
                if (!isGroup) return reply('🚫 This command can only be used in *groups*!');

                reply('🌀 Fetching group profile picture...');
                try {
                  const ppUrl = await professor.profilePictureUrl(m.chat, 'image');
                  await professor.sendMessage(
                      m.chat,
                      { image: { url: ppUrl }, caption: `✅ Here’s the group profile picture for *${groupMetadata.subject}*` },
                      { quoted: m }
                  );
                } catch {
                     reply('⚠️ Could not fetch group profile picture. The group might not have one.');
                }
            }
            break;

             case 'link': {
                if (!isGroup) return reply('🚫 This command can only be used in *groups*.');
                if (!isGroupAdmins && !Access) return reply('🔒 Only group *admins* can get the link.');

                reply('⏳ Generating group invite link...');
                try {
                    const link = await professor.groupInviteCode(m.chat);
                    reply(`📌 *Group Name:* ${groupMetadata.subject}\n🔗 *Invite Link:* https://chat.whatsapp.com/${link}`);
                } catch {
                    reply('⚠️ Failed to retrieve group link. Make sure I have admin permissions.');
                }
            }
            break;
             case 'getpp': {
                if (isGroup) return reply('🚫 This command works only in *private chats*.');

                let user = m.quoted ? m.quoted.sender : (text && text.includes('@')) ? text.replace(/[^0-9@]/g, '') : null;
                if (!user) return reply('❌ Please *tag* or *mention* the user whose profile picture you want.');

                try {
                    const ppUrl = await professor.profilePictureUrl(user, 'image');
                    await professor.sendMessage(
                        m.chat,
                        {
                            image: { url: ppUrl },
                            caption: `🖼 *Profile Picture of @${user.split('@')[0]}*`
                        },
                        { quoted: m, mentions: [user] }
                    );
                } catch {
                    reply('⚠️ Could not fetch profile picture.');             }
            }
            break;
            case 'edward': {
                if (!m.quoted) return reply('❌ Please reply to a view once message.');

    // Jaribu kupata message ya ndani ya view once
                const viewOnce = m.quoted.message?.viewOnceMessageV2?.message || m.quoted.message?.viewOnceMessage?.message;
                if (!viewOnce) return reply('❌ The replied message is not a view once message.');

                try {
                    const type = Object.keys(viewOnce)[0]; // imageMessage / videoMessage / audioMessage
                    const mediaMsg = viewOnce[type];

                    const mediaBuffer = await downloadContentFromMessage(mediaMsg, type.replace('Message', ''));
                    let buffer = Buffer.from([]);
                    for await (const chunk of mediaBuffer) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }

                    await professor.sendMessage(m.chat, { [type.includes('image') ? 'image' : type.includes('video') ? 'video' : 'audio']: buffer }, { quoted: m });

                } catch (err) {
                    console.error(err);
                    reply('⚠️ Failed to retrieve the view once media.');
                }
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
