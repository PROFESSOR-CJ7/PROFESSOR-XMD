/*
╭────────────────────────────────────────
𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑  𝐗𝐌𝐃  𝐕𝐄𝐑𝐒𝐈𝐎𝐍
OWNER : 𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑 𝐂𝐉
OWNER NO : 255740016011
KING THRONE OF PROFESSOR XMD BOTS
╰─────────────────────────────────────────
*/

const fs = require("fs");

const fquoted = {
    forder: {
        key: {
            fromMe: false,
            participant: "13135550002@s.whatsapp.net",
            remoteJid: "status@broadcast"
        },
        message: {
            orderMessage: {
                orderId: "2009",
                thumbnail: fs.readFileSync('./lib/media/professor-xmd.png'),
                itemCount: "505",
                status: "INQUIRY",
                surface: "CATALOG",
                message: `Professor XMD API`,
                token: "AR6xBKbXZn0Xwmu76Ksyd7rnxI+Rx87HfinVlW4lwXa6JA=="
            }
        }
    }
};

module.exports = { fquoted };
