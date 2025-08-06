/*
𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑  𝐗𝐌𝐃  𝐕𝐄𝐑𝐒𝐈𝐎𝐍
OWNER : 𝐏𝐑𝐎𝐅𝐄𝐒𝐒𝐎𝐑 𝐂𝐉
OWN NO : 255740016011
KING THRONE OF PROFESSOR XMD BOTS
*/

const chalk = require('chalk')

// Stylish color function: blue by default, or user choice
const color = (text, clr) => {
  return !clr ? chalk.cyanBright(text) : chalk.keyword(clr)(text)
}

// Stylish background color: default magenta bg, or user choice
const bgcolor = (text, bgclr) => {
  return !bgclr ? chalk.bgMagenta.whiteBright(text) : chalk.bgKeyword(bgclr).whiteBright(text)
}

// Enhanced log function: prefix with stylish '[PROFESSOR XMD]' and colored text
const professorLog = (text, clr) => {
  return chalk.bgBlueBright.white(' [ PROFESSOR XMD ] ') +
    (!clr ? chalk.cyanBright(text) : chalk.keyword(clr)(text))
}

module.exports = {
  color,
  bgcolor,
  professorLog
}
