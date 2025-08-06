/*
╭────────────────────────────────────────
𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑  𝐗𝐌𝐃 𝐕𝐄𝐑𝐒𝐈𝐎𝐍
OWNER : 𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑 CJ
OWN NO : 255740016011
KING THRONE OF PROFESSOR BOTS
╰─────────────────────────────────────────
*/

const fs = require('fs')

//~~~~~~~~~ Setting Owner ~~~~~~~~~~//
global.owner = "255740016011"
global.namaowner = "PROFESSOR CJ"
global.namabot = "PROFESSOR XMD BOT"

//~~~~~~~~~ Setting Channel ~~~~~~~~~~//
global.susidch = "120363419165851564@newsletter"
global.susmuller = "𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑  𝐗𝐌𝐃 𝐁𝐎𝐓𝐒 𝟐𝟎𝟐𝟓 𝐕𝐄𝐑𝐒𝐈𝐎𝐍𝐒"
global.linksus = "https://wa.me/255740016011"  // Mbadala wa link channel kama unataka

//~~~~~~~~~ Setting Packname ~~~~~~~~~~//
global.packname = "𝙿𝚁𝙾𝙵𝙴𝚂𝚂𝙾𝚁 𝚇𝙼𝙳 𝙱𝙰𝚂𝙴 𝙱𝚈 𝙻𝙾𝚁𝙳 𝚇𝙼𝙳"
global.author = "https://wa.me/255740016011"

//~~~~~~~~~ Other global settings ~~~~~~~~~~//
global.status = true
global.welcome = true

global.pairing = Buffer.from("U1VTQ09ERVM=", 'base64').toString(); //CODED BY LORD XMD=================\\

global.mess = {
    owner: "┃Not my owner idiot⚠️⚠️!┃", 
    group: "┃Used in groups only⚠️⚠️!┃", 
    private: "┃Only in private chat⚠️⚠️!┃", 
}

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
