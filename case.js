process.on('unhandledRejection', error => {
    console.error('Unhandled Promise Rejection:', error);
});



require("./database")

const fs = require('fs')
const util = require('util')
const axios = require('axios')
const { exec } = require("child_process")
const path = require('path');
const moment = require('moment-timezone');

module.exports = async (ptz, m, chatUpdate, store) => {
try {
    const body = 
        (m.message?.conversation) ||
        (m.message?.imageMessage?.caption) ||
        (m.message?.documentMessage?.caption) ||
        (m.message?.videoMessage?.caption) ||
        (m.message?.extendedTextMessage?.text) ||
        (m.message?.buttonsResponseMessage?.selectedButtonId) ||
        (m.message?.templateButtonReplyMessage?.selectedId) || 
        '';

const budy = (typeof m.text === 'string') ? m.text : '';
    const prefixRegex = /^([°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]+)/;
    const prefixMatch = body.match(prefixRegex);
    const prefix = prefixMatch ? prefixMatch[0] : '.';
    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const text = q = args.join(" ");

    const sender = m.key.fromMe 
        ? (ptz.user.id.split(':')[0] + '@s.whatsapp.net' || ptz.user.id) 
        : (m.key.participant || m.key.remoteJid);

    let botNumber;
    try {
        botNumber = await ptz.decodeJid(ptz.user.id) || "";
    } catch (e) {
        console.error("Error decoding JID:", e);
        botNumber = "";
    }
    
    const nama = global.botname
    const senderNumber = sender.split('@')[0];
    const ownerList = Array.isArray(global.owner) ? global.owner : [];
    const isCreator = [ptz.user.id, ...global.owner.map(([number]) => number + "@s.whatsapp.net")].includes(m.sender);
    const pushname = (m.pushName && typeof m.pushName === 'string') ? m.pushName : senderNumber || 'Guest';
    const isBot = botNumber.includes(senderNumber);

    
    
    const qtext = { 
    key: { 
        remoteJid: "user@c.us", 
        participant: "0@s.whatsapp.net" 
    }, 
    message: { 
        extendedTextMessage: { 
            text: `${prefix}${command}` 
        } 
    } 
};

const qtext2 = { 
    key: { 
        remoteJid: "status@broadcast", 
        participant: "0@s.whatsapp.net" 
    }, 
    message: { 
        extendedTextMessage: { 
            text:` BOT BY ${nama}` 
        } 
    } 
};


// 1. Quoted Broadcast (Pesan Siaran)
const qBroadcast = {
  key: { 
    remoteJid: 'status@broadcast', 
    participant: '0@s.whatsapp.net' 
  },
  message: { 
    extendedTextMessage: { 
      text: `📢 Broadcast by ${nama}\n` +
            `👉 Jangan lupa join channel: ${global.linkSaluran}`
    } 
  }
};

const qMusicPlayer = {
  key: { 
    participant: '0@s.whatsapp.net', 
    remoteJid: 'status@broadcast' 
  },
  message: {
    viewOnceMessage: {
      message: {
        audioMessage: {
          title: "Lofi Chill Mix",
          artist: `${nama} Radio`,
          jpegThumbnail: global.image.menu,
          contextInfo: {
            externalAdReply: {
              title: "🎵 Now Playing",
              body: "24/7 Lofi Stream",
              thumbnailUrl: global.image.menu
            }
          }
        }
      }
    }
  }
};

// 4. Quoted Event Reminder
const qEventReminder = {
  key: { 
    remoteJid: 'events@broadcast', 
    participant: '0@s.whatsapp.net' 
  },
  message: {
    extendedTextMessage: {
      text: `📅 Event Reminder:\n` +
            `🗓️ 25 Desember 2024\n` +
            `🎉 ${global.botname} Anniversary!`,
      contextInfo: {
        mentionedJid: [m.sender]
      }
    }
  }
};

// 5. Quoted Fake Payment (OVO/Gopay)
const qFakePayment = {
  key: { 
    participant: '0@s.whatsapp.net', 
    remoteJid: 'status@broadcast' 
  },
  message: {
    paymentInviteMessage: {
      serviceType: 3,
      expiryTimestamp: "1893456000",
      noteMessage: {
        extendedTextMessage: {
          text: `💳 Payment Method:\n` +
                `• OVO: 0812-3456-7890\n` +
                `• GOPAY: 0812-3456-7890\n` +
                `⚠️ Ini hanya simulasi!`
        }
      }
    }
  }
};



// 7. Quoted Fake Instagram Story
const qIGStory = {
  key: { 
    remoteJid: 'instagram@s.whatsapp.net', 
    participant: '0@s.whatsapp.net' 
  },
  message: {
    viewOnceMessage: {
      message: {
        imageMessage: {
          url: "https://i.ibb.co/ygX5ZPv/ig-story.jpg",
          caption: `📸 Follow ${nama} on IG:\n` +
                   `https://instagram.com/${nama}`,
          mimetype: "image/jpeg"
        }
      }
    }
  }
};

// 8. Quoted Fake Document (PDF)
const qFakePDF = {
  key: { 
    participant: '0@s.whatsapp.net', 
    remoteJid: 'status@broadcast' 
  },
  message: {
    documentMessage: {
      title: `${global.botname}_Documentation.pdf`,
      fileName: "Bot_Commands_Guide.pdf",
      mimetype: "application/pdf",
      fileLength: "2097152", // 2MB
      caption: `BOT BY ${nama}`
    }
  }
};

const newsletterQuote = {
  key: {
    remoteJid: global.ch, // Gunakan JID channel dari database.js
    participant: '0@s.whatsapp.net'
  },
  message: {
    newsletterMessage: {
      newsletterJid: global.ch,
      messageType: 'TEXT',
      contentText: `Join official ${global.botname} channel!`
    }
  }
};
        switch (command) {
case 'menu': case 'help': case 'allmenu': {
    // Get current time
    const time = moment.tz('Asia/Jakarta').format('HH:mm:ss')
    const date = moment.tz('Asia/Jakarta').format('DD/MM/YYYY')
    
    // Count total groups
    const totalGc = await store.chats.all().filter(v => v.id.endsWith('@g.us')).map(v => v);
    
    const menuText = `*${global.botname}*

⌚ Time: ${time} WIB
📅 Date: ${date}
🏃‍♂️ Runtime: ${runtime(process.uptime())}
👥 Total Group: ${totalGc.length}
Mode publik: ${ptz.public ? "AKTIF" : "NON-AKTIF"}

乂 *MAIN MENU*
${prefix}pushkontak [text]
${prefix}pushkontakv2 [text]
${prefix}pushid [idgroup]|[text]
${prefix}getidgc
${prefix}jpm
${prefix}cekidch

乂 *GROUP MENU*
${prefix}opengroup
${prefix}closegroup
${prefix}promote [tag/reply]
${prefix}demote [tag/reply]
${prefix}hidetag [text]
${prefix}tagall [text]
${prefix}add [number]
${prefix}kick [tag/reply]
${prefix}admins
${prefix}leave
${prefix}listgc

乂 *DOWNLOAD MENU*
${prefix}tt

乂 *OWNER MENU*
${prefix}owner
${prefix}speeed
${prefix}ping
${prefix}public


Note: 

• Example: ${prefix}help pushkontak

${global.copyright}
`;

    const docPath = "./package.json";
    if (!fs.existsSync(docPath)) return ptz.sendMessage(m.chat, { text: "⚠️ File tidak ditemukan!" });
    const document = fs.readFileSync(docPath);
    await ptz.sendMessage(m.key.remoteJid, {
        document: document,
        fileName: "MansX", 
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileLength: '100000000000000',
					pageCount: '999',
					caption: menuText,
					footer: global.copyright,
					contextInfo: {
						mentionedJid: [m.sender, '0@s.whatsapp.net', owner[0] + '@s.whatsapp.net'],
						forwardingScore: 999,
						isForwarded: true,
						forwardedNewsletterMessageInfo: {
							newsletterJid: global.ch,
							serverMessageId: null,
							newsletterName: 'MansX'
						},
						externalAdReply: {
							title: nama,
							body: nama,
							showAdAttribution: true,
							thumbnailUrl: global.image.menu,
							mediaType: 1,
							previewType: 0,
							renderLargerThumbnail: true,
							mediaUrl: global.gh,
							sourceUrl: global.gh,
						}
					}
				}, { quoted: qFakePDF })
			}
			break
			// Tambahkan case ini di dalam switch (command)

			
			case "jpm":
            case "broadcasttag":
                {
                    if (!isCreator)
                        return m.reply("⚠️ *Perintah ini hanya untuk Owner!*");

                    if (!text)
                        return m.reply(
                            `❌ *Format Salah!*\nGunakan: ${prefix}jpm [pesan]`
                        );

                    try {
                        // Dapatkan semua grup
                        const allGroups =
                            await ptz.groupFetchAllParticipating();
                        const groupList = Object.values(allGroups);

                        if (groupList.length === 0)
                            return m.reply(
                                "⚠️ Bot belum masuk ke grup manapun!"
                            );

                        // Proses broadcast
                        m.reply(
                            `🚀 *Memulai Broadcast ke ${groupList.length} Grup...*`
                        );

                        let successCount = 0;
                        let failedCount = 0;

                        for (const group of groupList) {
                            try {
                                const groupId = group.id;
                                const metadata =
                                    await ptz.groupMetadata(groupId);
                                const participants = metadata.participants.map(
                                    v => v.id
                                );

                                // Membuat tag tidak terlihat dengan zero-width space
                                const hiddenMentions = "";

                                // Format pesan
                                const broadcastMsg =
                                    `📢 *JPM BROADCAST* 📢\n\n` +
                                    `${text}\n\n` +
                                    `${hiddenMentions}\n\n` +
                                    `_*${global.copyright}*_`;

                                await ptz.sendMessage(groupId, {
                                    text: broadcastMsg,
                                    mentions: participants
                                });

                                successCount++;
                                await new Promise(resolve =>
                                    setTimeout(resolve, 2500)
                                ); // Anti-spam delay
                            } catch (groupError) {
                                console.error(
                                    `Gagal di grup ${groupId}:`,
                                    groupError
                                );
                                failedCount++;
                            }
                        }

                        // Laporan akhir
                        const reportMsg =
                            `✅ *Broadcast Selesai!*\n\n` +
                            `✳️ Berhasil: ${successCount} grup\n` +
                            `✖️ Gagal: ${failedCount} grup\n\n` +
                            `📢 Channel: ${global.gh}`;

                        await m.reply(reportMsg);
                    } catch (err) {
                        console.error("JPM Error:", err);
                        m.reply(`❌ *Gagal Broadcast!*\nError: ${err.message}`);
                    }
                }
                break;

case "public":
                {
                    if (!isCreator)
                        return m.reply(
                            "Hanya pemilik bot yang dapat menggunakan perintah ini."
                        );
                    const mode = args[0]?.toLowerCase();
                    if (!["on", "off"].includes(mode))
                        return m.reply(`Contoh: ${prefix}public on/off`);

                    ptz.public = mode === "on";
                    m.reply(
                        `Mode publik: ${ptz.public ? "AKTIF" : "NON-AKTIF"}`
                    );
                }
                break;


case "cekidch": case "idch": {
if (!text) return m.reply(example("linkchnya"))
if (!text.includes("https://whatsapp.com/channel/")) return m.reply("Link tautan tidak valid")
let result = text.split('https://whatsapp.com/channel/')[1]
let res = await ptz.newsletterMetadata("invite", result)
let teks = `
* *ID :* ${res.id}
* *Nama :* ${res.name}
* *Total Pengikut :* ${res.subscribers}
* *Status :* ${res.state}
* *Verified :* ${res.verification == "VERIFIED" ? "Terverifikasi" : "Tidak"}
`
return m.reply(teks)
}
break
case "ping":
                {
                    const start = Date.now();

                    // Kirim pesan awal dan simpan key-nya
                    const initialMsg = await ptz.sendMessage(
                        m.chat,
                        { text: "📡 _Mengukur kecepatan..._" },
                        { quoted: qFakePDF }
                    );

                    const latency = Date.now() - start;

                    // Edit pesan menggunakan key dari pesan awal
                    await ptz.sendMessage(
                        m.chat,
                        {
                            text: `🏓 *Pong!*\n💨 Latency: ${latency}ms`,
                            edit: initialMsg.key // Gunakan key pesan yang ingin diedit
                        },
                        { quoted: qFakePDF }
                    );
                }
                break;
case "tiktok": case "tt": {
    try {
        // Get current date time
        const getCurrentTime = () => {
            return new Date().toISOString().replace('T', ' ').slice(0, 19);
        };

        if (!args[0]) {
            return ptz.sendMessage(m.chat, {
                text: `⚠️ *TIKTOK DOWNLOADER*

📝 *Format:* 
${prefix}tiktok [link video]

📌 *Contoh:* 
${prefix}tiktok https://vt.tiktok.com/xxxxx

${global.copyright}`,
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: true,
                        title: global.botname,
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: qFakePDF });
        }

        // Validate URL
        const url = args[0];
        if (!url.match(/^https?:\/\/(vm\.|vt\.|www\.|)?tiktok\.com/)) {
            throw new Error('Invalid TikTok URL format');
        }

        // Loading reaction
        await ptz.sendMessage(m.chat, {
            react: {
                text: "⏱️",
                key: m.key
            }
        });

        const cleanUrl = encodeURIComponent(url.trim());
        const endpoint = `https://api.suraweb.online/download/tiktok?url=${cleanUrl}`;

        const { data } = await axios.get(endpoint, {
            headers: {
                'Accept-Encoding': 'gzip,deflate,compress',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            },
            timeout: 10000
        });

        if (!data?.status || !data?.data) {
            throw new Error('Invalid API response structure');
        }

        const result = data.data;
        const videoUrl = result.media?.video?.nowm || result.media?.video?.wm;
        
        if (!videoUrl) {
            throw new Error('No video URL found in response');
        }

        // Format statistics numbers
        const formatNumber = (num) => {
            if (!num) return '0';
            if (num >= 1000000) {
                return (num/1000000).toFixed(1) + 'M';
            } else if (num >= 1000) {
                return (num/1000).toFixed(1) + 'K';
            }
            return num.toString();
        };

        // Send video with metadata
        await ptz.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: `🎶 *TikTok Downloader*

📝 *Description:* 
${result.description || "No description"}

📊 *Statistics:*
▶️ *Views:* ${formatNumber(result.stats?.plays)}
❤️ *Likes:* ${formatNumber(result.stats?.likes)}
💬 *Comments:* ${formatNumber(result.stats?.comments)}
🔄 *Shares:* ${formatNumber(result.stats?.shares)}

⏰ *Downloaded:* ${getCurrentTime()}

${global.copyright}`,
        }, { quoted: m });

        // Send audio if available
        if (result.media?.video?.audio) {
            await ptz.sendMessage(m.chat, {
                audio: { url: result.media.video.audio },
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m });
        }

        // Success reaction
        await ptz.sendMessage(m.chat, {
            react: {
                text: "✅",
                key: m.key
            }
        });

    } catch (error) {
        console.error("TikTok Downloader Error:", error);
        
        await ptz.sendMessage(m.chat, {
            text: `❌ *ERROR TIKTOK DOWNLOADER*

📌 *Message:* ${error.message}
⚠️ *Solution:* Please check your TikTok URL and try again!

*Example:*
${prefix}tiktok https://vt.tiktok.com/xxxxx

${global.copyright}`
        }, { quoted: m });

        await ptz.sendMessage(m.chat, {
            react: {
                text: "❌",
                key: m.key
            }
        });
    }
}
break;
case "listgc": case "listgrup": {
    if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");

    try {
        const allGroups = await ptz.groupFetchAllParticipating();
        const groupList = Object.values(allGroups);

        let teks = `\n*乂 List All Group Chat*\n\n`;
        teks += `*Total Group :* ${groupList.length}\n\n`;

        for (const group of groupList) {
            const groupId = group.id;
            const groupName = group.subject || "Tanpa Nama";
            const memberCount = group.participants.length;
            const groupStatus = group.announce === false ? "Terbuka" : "Hanya Admin";
            const groupOwner = group.subjectOwner ? group.subjectOwner.split("@")[0] : "Sudah Keluar";

            teks += `*ID :* ${groupId}\n`;
            teks += `*Nama :* ${groupName}\n`;
            teks += `*Member :* ${memberCount}\n`;
            teks += `*Status :* ${groupStatus}\n`;
            teks += `*Pembuat :* ${groupOwner}\n\n`;
        }

        await m.reply(teks);

    } catch (error) {
        console.error("Error fetching group list:", error);
        await m.reply("Terjadi kesalahan saat mengambil daftar grup.");
    }
}
break;


            case "pushkontak": {
                if (!text) return m.reply(`Contoh: ${prefix}${command} Hello`);
                if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
                if (!m.isGroup) return m.reply("Perintah ini hanya dapat digunakan di grup.");
                
                const participants = await ptz.groupMetadata(m.chat).then(meta => meta.participants);
                const get = participants.filter(v => v.id.endsWith('.net')).map(v => v.id);
                
                m.reply('*_Sedang Push Kontak..._*');
                for (let member of get) {
                    await ptz.sendMessage(member, { text });
                }
                m.reply(`*_Berhasil Push Kontak:_*\nPesan telah dikirim.`);
            }
            break;
            
            
            case "pushkontakv2": {
              if (!text) return m.reply(`Contoh: ${prefix}${command} Hello`);
              if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
              if (!m.isGroup) return m.reply("Perintah ini hanya dapat digunakan di grup.");
              
              const participants = await ptz.groupMetadata(m.chat).then(meta => meta.participants);
              const get = participants.filter(v => v.id.endsWith('.net')).map(v => v.id).slice(0, 100); // Membatasi hingga 100 anggota
              
              m.reply('*_Sedang Push Kontak..._*');
              for (let member of get) {
                  await ptz.sendMessage(member, { text });
                  await new Promise(resolve => setTimeout(resolve, 2000)); // Delay 2 detik
              }
              m.reply(`*_Berhasil Push Kontak:_*\nPesan telah dikirim.`);
                }
            break;


            case "pushid": {
                if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
                let idgc = text.split("|")[0];
                let pesan = text.split("|")[1];
                if (!idgc || !pesan) return m.reply(`Contoh: ${prefix + command} idgc|pesan`);
                
                let getDATA = await ptz.groupMetadata(idgc).then(meta => meta.participants.filter(v => v.id.endsWith('.net')).map(v => v.id));
                m.reply('*_Sedang Push ID..._*');
                for (let id of getDATA) {
                    await ptz.sendMessage(id, { text: pesan });
                }
                m.reply(`Semua pesan telah dikirim!`);
            }
            break;


            case "getidgc": {
                if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
                if (!m.isGroup) return m.reply("Perintah ini hanya dapat digunakan di grup.");
                m.reply(m.chat);
            }
            break;
            
            case "opengroup": {
                if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
                await ptz.groupSettingUpdate(m.chat, 'unlocked');
                m.reply("Group telah dibuka!");
            }
            break;

            case "closegroup": {
                if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
                try {
                    await ptz.groupSettingUpdate(m.chat, 'locked');
                    m.reply("Group telah ditutup!");
                } catch (error) {
                    console.error(error);
                    m.reply("Gagal menutup grup. Pastikan bot memiliki izin yang tepat.");
             }
             break;
}


case "promote": {
    if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
    if (!m.mentionedJid[0]) return m.reply("Silakan sebutkan pengguna yang ingin dipromosikan.");
    await ptz.groupParticipantsUpdate(m.chat, [m.mentionedJid[0]], 'promote');
    m.reply("Pengguna telah dipromosikan menjadi admin!");
}
break;

case "demote": {
    if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
    if (!m.mentionedJid[0]) return m.reply("Silakan sebutkan pengguna yang ingin diturunkan.");
    
    try {
        // Attempt to demote the mentioned user
        await ptz.groupParticipantsUpdate(m.chat, [m.mentionedJid[0]], 'demote');
        m.reply("Pengguna telah diturunkan dari posisi admin!");
    } catch (error) {
        console.error(error);
        m.reply("Gagal menurunkan pengguna. Pastikan bot memiliki izin yang tepat dan pengguna tersebut adalah admin.");
    }
}
break;


case "hidetag": {
    if (!m.isGroup) return m.reply("Perintah ini hanya dapat digunakan di grup.");
    const participants = await ptz.groupMetadata(m.chat).then(meta => meta.participants);
    const tags = participants.map(v => v.id);
    await ptz.sendMessage(m.chat, { text: `@${tags.join(' @')}`, mentions: tags });
}
break;

case "tagall": {
    if (!m.isGroup) return m.reply("Perintah ini hanya dapat digunakan di grup.");
    const message = args.join(' ') || "Pesan tidak ditentukan"; // Get the message from arguments
    const participants = await ptz.groupMetadata(m.chat).then(meta => meta.participants);
    const tags = participants.map(v => v.id);

    await ptz.sendMessage(m.chat, { text: message, mentions: tags });
}
    break;

case "add": {
    if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
    const numberToAdd = args[0] + '@s.whatsapp.net';
    await ptz.groupParticipantsUpdate(m.chat, [numberToAdd], 'add');
    m.reply(`Member ${numberToAdd} telah ditambahkan!`);
}
break;

case "kick": {
    if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
    if (!m.mentionedJid[0]) return m.reply("Silakan sebutkan pengguna yang ingin dikeluarkan.");
    await ptz.groupParticipantsUpdate(m.chat, [m.mentionedJid[0]], 'remove');
    m.reply("Pengguna telah dikeluarkan dari grup!");
}
break;

case "admins": {
    const admins = await ptz.groupMetadata(m.chat).then(meta => meta.participants.filter(v => v.admin !== null).map(v => v.id));
    if (admins.length === 0) return m.reply("Tidak ada admin di grup ini.");
    m.reply(`List Admin: @${admins.join(' @')}`, { mentions: admins });
}
break;

case "leave": {
    if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
    await ptz.groupLeave(m.chat);
    m.reply("Bot telah meninggalkan grup!");
}
break;

case "delete":
case "del": {
    if (!isCreator) return m.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
    if (!m.quoted) return m.reply("Balas pesan yang ingin dihapus.");
    
    try {
        await m.quoted.delete();
        
    } catch (error) {
        console.error("Error deleting message:", error);
        await m.reply("❌ Gagal menghapus pesan. Pastikan bot memiliki izin admin di grup ini.");
    }
    break;
}




case "owner": {
    const ownerData = global.owner.filter(v => v !== ""); 
    if (ownerData.length === 0) return m.reply("🚫 Nomor owner belum diatur di database!");

    const contacts = ownerData.map(number => {
        const cleanedNumber = number.replace(/[^0-9]/g, ''); // Bersihkan karakter non-angka
        const intlNumber = cleanedNumber.startsWith('0') ? '62' + cleanedNumber.slice(1) : cleanedNumber;
        
        return {
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${global.botname} Owner\nTEL;type=CELL;waid=${intlNumber}:+${intlNumber}\nEND:VCARD`
        };
    });

    const caption = `👑 *Kontak Resmi Owner ${global.botname}* 👑\n\n` +
                   `Jangan ragu untuk menghubungi kami!`;

    // Kirim kontak dengan quoted PDF
    await ptz.sendMessage(m.chat, {
        contacts: {
            displayName: `Owner ${global.botname}`,
            contacts: contacts
        },
        caption: caption
    }, { 
        quoted: qFakePDF, // Gunakan template PDF palsu
        ephemeralExpiration: 86400 // Pesan hilang setelah 24 jam
    });

}
break;


 case "speed": {
    if (!isCreator) return m.reply("⚠️ Owner Only");
    
    const start = performance.now();
    
    // Test various bot functions
    const tests = {
        database: async () => {
            // Test database operations
            const dbStart = performance.now();
            // Add your database test here
            return performance.now() - dbStart;
        },
        messaging: async () => {
            const msgStart = performance.now();
            await ptz.sendMessage(m.chat, { text: 'test' });
            return performance.now() - msgStart;
        },
        media: async () => {
            const mediaStart = performance.now();
            // Test media processing
            return performance.now() - mediaStart;
        }
    };
    
    try {
        const results = await Promise.all([
            tests.database(),
            tests.messaging(),
            tests.media()
        ]);
        
        const end = performance.now();
        const ping = end - start;
        
        const perfReport = `
⚡ *PERFORMANCE REPORT* ⚡

*Overall Latency:* ${ping.toFixed(2)}ms

*Individual Tests:*
• Database: ${results[0].toFixed(2)}ms
• Messaging: ${results[1].toFixed(2)}ms
• Media Processing: ${results[2].toFixed(2)}ms

*System Load:*
• CPU: ${(process.cpuUsage().user / 1000000).toFixed(2)}%
• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
• Uptime: ${runtime(process.uptime())}
`;
        
        await m.reply(perfReport);
    } catch (error) {
        console.error(error);
        await m.reply("❌ Error running performance tests");
    }
}
break;

// Helper Functions
function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    const hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    const sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}
        default:
            if (budy.startsWith('=>')) {
                if (!isCreator) return;
                function Return(sul) {
                    let sat = JSON.stringify(sul, null, 2);
                    let bang = util.format(sat);
                    if (sat === undefined) {
                        bang = util.format(sul);
                    }
                    return m.reply(bang);
                }
                try {
                    m.reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)));
                } catch (e) {
                    m.reply(String(e));
                }
            }

                    if (budy.startsWith('>')) {
  if (!isCreator) return; // Hanya owner yang bisa menggunakan perintah ini

  try {
    // Ambil kode yang dikirim setelah '>'
    const kode = budy.slice(1).trim();

    // Evaluasi kode dan tangkap hasilnya
    const hasil = await eval(`(async () => {
      return ${kode};
    })()`);

    // Format hasil evaluasi ke dalam string yang rapi
    const formattedResult = util.inspect(hasil, {
      depth: null, // Tampilkan semua level nested object
      colors: false, // Nonaktifkan warna (opsional)
      showHidden: true, // Tampilkan properti tersembunyi
      compact: false, // Format output agar lebih mudah dibaca
    });

    // Kirim hasil ke pengguna
    await m.reply(formattedResult);
  } catch (error) {
    // Tangani error jika terjadi
    await m.reply(`Error: ${error.message}`);
  }
}


            if (budy.startsWith('$')) {
                if (!isCreator) return;
                exec(budy.slice(2), (err, stdout) => {
                    if (err) return m.reply(`${err}`);
                    if (stdout) return m.reply(stdout);
                });
            }
    }

} catch (err) {
    console.error(util.format(err));
}

};


let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(`Update ${__filename}`);
    delete require.cache[file];
    require(file);
});