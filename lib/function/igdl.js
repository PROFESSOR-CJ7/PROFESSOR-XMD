/*𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑  𝐗𝐌𝐃  𝐕𝐄𝐑𝐒𝐈𝐎𝐍
OWNER : 𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑 𝐂𝐉
OWN NO : 255740016011
KING THRONE OF PROFESSOR XMD BOTS
*/

const fetch = require('node-fetch');

async function igdl(query) {
  try {
    const response = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${query}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return error;
  }
}

module.exports = { igdl }
