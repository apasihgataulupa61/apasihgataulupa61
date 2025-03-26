
global.owner = [
    ["6281546543913", "MANS", true], // Format: [number, name, isDeveloper]
    // Add more owners here
];
global.ownername = "MANSX"; 
global.social = {
    github: "https://github.com/Mansybot"
};
global.copyright = `ꜱɪᴍᴘʟᴇ ᴡʜᴀᴛꜱᴀᴘᴘ ʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ᴍᴀɴꜱ`;
global.botname = "MANSX";
global.botname2 = "MansX offcial";
global.image = {
  menu: "https://files.catbox.moe/w1javo.webp",
  reply: "https://files.catbox.moe/w1javo.webp",
};
global.ch = `120363396526885568@newsletter`;
global.gh = `https://chat.whatsapp.com/DCgaZIiF9uc8TdYlmd9yeE`



let fs = require('fs');
// Watch for file changes
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(`Update ${__filename}`);
    delete require.cache[file];
    require(file);
});

