/*
╭────────────────────────────────────────
𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑  𝐗𝐌𝐃  𝐕𝐄𝐑𝐒𝐈𝐎𝐍
OWNER : 𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑  𝐂𝐉
OWN NO : 255740016011
KING THRONE OF PROFESSOR XMD BOTS
╰─────────────────────────────────────────
*/

const Boom = require('@hapi/boom');
console.clear();
console.log('starting...');
require('./fuckyou');
process.on("uncaughtException", console.error);

// Import fetch for Node.js environment
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidDecode,
  downloadContentFromMessage,
  generateWAMessageFromContent,
  generateWAMessage,
  relayWAMessage,
  getContentType
} = require("@whiskeysockets/baileys");

const chalk = require('chalk');
const pino = require('pino');
const FileType = require('file-type');
const readline = require("readline");
const fs = require('fs');
const crypto = require("crypto");
const path = require("path");
const qrcode = require("qrcode-terminal");
const { color } = require('./lib/color');
const { smsg, sleep, getBuffer } = require('./lib/myfunction');
const {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
  addExif
} = require('./lib/exif');

// Define global variables referenced in the script:
global.status = true;  // set bot public status
global.welcome = true; // enable welcome messages
global.linkch = 'https://your-channel-link'; // promotional link or similar

const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => rl.question(text, answer => {
    rl.close();
    resolve(answer);
  }));
};

async function professorstart() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const usePairingCode = true;

  const professor = makeWASocket({
    printQRInTerminal: false,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    generateHighQualityLinkPreview: true,
    patchMessageBeforeSending: (message) => {
      const requiresPatch = !!(
        message.buttonsMessage ||
        message.templateMessage ||
        message.listMessage
      );
      if (requiresPatch) {
        message = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...message,
            },
          },
        };
      }
      return message;
    },
    version: (await (await fetch('https://cdn.jsdelivr.net/npm/@whiskeysockets/baileys@6.7.18/lib/Defaults/baileys-version.json')).json()).version,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    logger: pino({ level: 'fatal' }),
    auth: state // <-- Correct usage for Baileys v6.7.18, do NOT use makeCacheableSignalKeyStore
  });

  if (usePairingCode && !professor.authState.creds.registered) {
    const phoneNumber = await question(chalk.blue.bold('Please provide your WhatsApp number... Do not start with (0), start with country code. Example: 255740016011\n'));
    const code = await professor.requestPairingCode(phoneNumber, global.pairing);
    console.log(`${chalk.blue.bold('Your pairing code:')} : ${chalk.white.bold(code)}`);
  }

  professor.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
      if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
      if (!professor.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
      if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
      if (mek.key.id.startsWith('FatihArridho_')) return;
      const m = smsg(professor, mek);
      require("./professor-xmd")(professor, m, chatUpdate);
    } catch (err) {
      console.log(err);
    }
  });

  professor.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return decode.user && decode.server && decode.user + '@' + decode.server || jid;
    } else return jid;
  };

  professor.ev.on('contacts.update', update => {
    for (let contact of update) {
      let id = professor.decodeJid(contact.id);
      // Contact management if needed
    }
  });

  professor.public = global.status;

  professor.ev.on('connection.update', (update) => {
    const { konek } = require('./lib/response/data');
    konek({ professor, update, professorstart, DisconnectReason, Boom });
  });

  professor.ev.on('group-participants.update', async (anu) => {
    if (global.welcome) {
      console.log(anu);
      let botNumber = await professor.decodeJid(professor.user.id);
      if (anu.participants.includes(botNumber)) return;
      try {
        let metadata = await professor.groupMetadata(anu.id);
        let namagc = metadata.subject;
        let participants = anu.participants;
        for (let num of participants) {
          let check = anu.author !== num && anu.author.length > 1;
          let tag = check ? [anu.author, num] : [num];
          let ppuser;
          try {
            ppuser = await professor.profilePictureUrl(num, 'image');
          } catch {
            ppuser = 'https://telegra.ph/file/de7c8230aff02d7bd1a93.jpg';
          }
          if (anu.action == 'add') {
            professor.sendMessage(anu.id, {
              text: check ? `hello @${num.split("@")[0]} welcome to *${namagc}*` : `hello @${num.split("@")[0]} welcome to *${namagc}*`,
              contextInfo: {
                mentionedJid: [...tag],
                externalAdReply: {
                  thumbnailUrl: "https://pomf2.lain.la/f/ic51evmj.jpg",
                  title: '© Welcome Message',
                  body: '',
                  renderLargerThumbnail: true,
                  sourceUrl: global.linkch,
                  mediaType: 1
                }
              }
            });
          }
          if (anu.action == 'kick') {
            professor.sendMessage(anu.id, {
              text: check ? `@${num.split("@")[0]} has left group *${namagc}*` : `@${num.split("@")[0]} has left group *${namagc}*`,
              contextInfo: {
                mentionedJid: [...tag],
                externalAdReply: {
                  thumbnailUrl: "https://pomf2.lain.la/f/7afhwfrz.jpg",
                  title: '© Leaving Message',
                  body: '',
                  renderLargerThumbnail: true,
                  sourceUrl: global.linkch,
                  mediaType: 1
                }
              }
            });
          }
          if (anu.action == "promote") {
            professor.sendMessage(anu.id, {
              text: `@${anu.author.split("@")[0]} has promote @${num.split("@")[0]} as grup admin`,
              contextInfo: {
                mentionedJid: [...tag],
                externalAdReply: {
                  thumbnailUrl: "https://pomf2.lain.la/f/ibiu2td5.jpg",
                  title: '© Promote Message',
                  body: '',
                  renderLargerThumbnail: true,
                  sourceUrl: global.linkch,
                  mediaType: 1
                }
              }
            });
          }
          if (anu.action == "demote") {
            professor.sendMessage(anu.id, {
              text: `@${anu.author.split("@")[0]} has demote @${num.split("@")[0]} as grup admin`,
              contextInfo: {
                mentionedJid: [...tag],
                externalAdReply: {
                  thumbnailUrl: "https://pomf2.lain.la/f/papz9tat.jpg",
                  title: '© Demote Message',
                  body: '',
                  renderLargerThumbnail: true,
                  sourceUrl: global.linkch,
                  mediaType: 1
                }
              }
            });
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
  });

  professor.deleteMessage = async (chatId, key) => {
    try {
      await professor.sendMessage(chatId, { delete: key });
      console.log(`Pesan dihapus: ${key.id}`);
    } catch (error) {
      console.error('Gagal menghapus pesan:', error);
    }
  };

  professor.sendText = async (jid, text, quoted = '', options) => {
    professor.sendMessage(jid, {
      text: text,
      ...options
    }, { quoted });
  };

  professor.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  };

  professor.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
        ? Buffer.from(path.split`, `[1], 'base64')
        : /^https?:\/\//.test(path)
          ? await (await getBuffer(path))
          : fs.existsSync(path)
            ? fs.readFileSync(path)
            : Buffer.alloc(0);
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifImg(buff, options);
    } else {
      buffer = await addExif(buff);
    }
    await professor.sendMessage(jid, {
      sticker: { url: buffer },
      ...options
    }, { quoted });
    return buffer;
  };

  professor.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || "";
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    let type = await FileType.fromBuffer(buffer);
    let trueFileName = attachExtension ? filename + "." + type.ext : filename;
    await fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
  };

  professor.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
        ? Buffer.from(path.split`, `[1], 'base64')
        : /^https?:\/\//.test(path)
          ? await (await getBuffer(path))
          : fs.existsSync(path)
            ? fs.readFileSync(path)
            : Buffer.alloc(0);
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifVid(buff, options);
    } else {
      buffer = await videoToWebp(buff);
    }
    await professor.sendMessage(jid, {
      sticker: { url: buffer },
      ...options
    }, { quoted });
    return buffer;
  };

  professor.albumMessage = async (jid, array, quoted) => {
    const album = generateWAMessageFromContent(jid, {
      messageContextInfo: {
        messageSecret: crypto.randomBytes(32),
      },
      albumMessage: {
        expectedImageCount: array.filter(a => a.hasOwnProperty("image")).length,
        expectedVideoCount: array.filter(a => a.hasOwnProperty("video")).length,
      },
    }, {
      userJid: professor.user.jid,
      quoted,
      upload: professor.waUploadToServer
    });
    await professor.relayMessage(jid, album.message, { messageId: album.key.id });
    for (let content of array) {
      const img = await generateWAMessage(jid, content, { upload: professor.waUploadToServer });
      img.message.messageContextInfo = {
        messageSecret: crypto.randomBytes(32),
        messageAssociation: {
          associationType: 1,
          parentMessageKey: album.key,
        },
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast",
        forwardingScore: 99999,
        isForwarded: true,
        mentionedJid: [jid],
        starred: true,
        labels: ["Y", "Important"],
        isHighlighted: true,
        businessMessageForwardInfo: {
          businessOwnerJid: jid,
        },
        dataSharingContext: { showMmDisclosure: true }
      };
      img.message.forwardedNewsletterMessageInfo = {
        newsletterJid: "0@newsletter",
        serverMessageId: 1,
        newsletterName: `WhatsApp`,
        contentType: 1,
        timestamp: new Date().toISOString(),
        senderName: "✧ Professor XMD⚡",
        content: "Text Message",
        priority: "high",
        status: "sent",
      };
      img.message.disappearingMode = {
        initiator: 3,
        trigger: 4,
        initiatorDeviceJid: jid,
        initiatedByExternalService: true,
        initiatedByUserDevice: true,
        initiatedBySystem: true,
        initiatedByServer: true,
        initiatedByAdmin: true,
        initiatedByUser: true,
        initiatedByApp: true,
        initiatedByBot: true,
        initiatedByMe: true,
      };
      await professor.relayMessage(jid, img.message, {
        messageId: img.key.id,
        quoted: {
          key: {
            remoteJid: album.key.remoteJid,
            id: album.key.id,
            fromMe: true,
            participant: professor.user.jid,
          },
          message: album.message,
        },
      });
    }
    return album;
  };

  professor.ev.on('creds.update', saveCreds);
  return professor;
}

professorstart();

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
  delete require.cache[file];
  require(file);
});
