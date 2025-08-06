/*
𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑  𝐗𝐌𝐃  𝐕𝐄𝐑𝐒𝐈𝐎𝐍
OWNER : 𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑 𝐂𝐉
OWN NO : 255740016011
KING THRONE OF PROFESSOR XMD BOTS
*/

const fetch = require('node-fetch')

async function ytmp3(url) {
  const headers = {
    "accept": "*/*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": "\"Android\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "Referer": "https://id.ytmp3.mobi/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };

  const initial = await fetch(`https://d8.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`, { headers });
  const init = await initial.json();

  const id = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?/]+)/)?.[1];

  const getDownloadURL = async (format) => {
    let convertURL = init.convertURL + `&v=${id}&f=${format}&_=${Math.random()}`;
    const converts = await fetch(convertURL, { headers });
    const convert = await converts.json();

    if (convert.error !== 0) {
      throw new Error("Gagal mendapatkan URL konversi");
    }

    let info = {};
    for (let i = 0; i < 5; i++) {
      const j = await fetch(convert.progressURL, { headers });
      info = await j.json();
      if (info.progress === 3) break;
      await new Promise(res => setTimeout(res, 2000));
    }

    if (info.progress !== 3) {
      throw new Error("Konversi gagal au terlalu lama");
    }

    return { url: convert.downloadURL, title: info.title || "Unknown Title" };
  };

  const mp3Result = await getDownloadURL('mp3');
  const mp4Result = await getDownloadURL('mp4');

  return {
    urlmp3: mp3Result.url,
    urlmp4: mp4Result.url,
    title: mp4Result.title
  };
}

module.exports = { ytmp3 }
