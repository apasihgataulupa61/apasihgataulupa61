require("./database")
const { 
    default: makeWASocket, 
    DisconnectReason, 
    makeInMemoryStore, 
    jidDecode, 
    proto,
    groupproto,
    Browsers,
    getPlatformId,
    BufferJSON,
    getKeyAuthor,
    writeRandomPadMax16,
    unpadRandomMax16,
    encodeWAMessage,
    generateRegistrationId,
    encodeBigEndian,
    toNumber,
    unixTimestampSeconds,
    debouncedTimeout,
    delay,
    delayCancellable,
    promiseTimeout,
    generateMessageIDV2,
    generateMessageID,
    bindWaitForEvent,
    bindWaitForConnectionUpdate,
    printQRIfNecessaryListener,
    fetchLatestBaileysVersion,
    fetchLatestWaWebVersion,
    generateMdTagPrefix,
    getStatusFromReceiptType,
    getErrorCodeFromStreamError,
    getCallStatusFromNode,
    getCodeFromWSError,
    isWABusinessPlatform,
    trimUndefined,
    bytesToCrockford,
    NO_MESSAGE_FOUND_ERROR_TEXT,
    MISSING_KEYS_ERROR_TEXT,
    NACK_REASONS,
    decodeMessageNode,
    decryptMessageNode,
    extractUrlFromText,
    generateLinkPreviewIfRequired,
    prepareWAMessageMedia,
    prepareDisappearingMessageSettingContent,
    generateForwardMessageContent,
    generateWAMessageContent,
    generateWAMessageFromContent,
    generateWAMessage,
    getContentType,
    normalizeMessageContent,
    extractMessageContent,
    getDevice,
    updateMessageWithReceipt,
    updateMessageWithReaction,
    updateMessageWithPollUpdate,
    getAggregateVotesInPollMessage,
    aggregateMessageKeysNotFromMe,
    downloadMediaMessage,
    assertMediaContent,
    hkdfInfoKey,
    getMediaKeys,
    extractImageThumb,
    encodeBase64EncodedStringForUpload,
    generateProfilePicture,
    mediaMessageSHA256B64,
    getAudioDuration,
    getAudioWaveform,
    toReadable,
    toBuffer,
    getStream,
    generateThumbnail,
    getHttpStream,
    encryptedStream,
    getUrlFromDirectPath,
    downloadContentFromMessage,
    downloadEncryptedContent,
    extensionForMediaMessage,
    getWAUploadToServer,
    encryptMediaRetryRequest,
    decodeMediaRetryNode,
    decryptMediaRetryData,
    getStatusCodeForMediaRetry,
    generateLoginNode,
    generateRegistrationNode,
    configureSuccessfulPairing,
    encodeSignedDeviceIdentity,
    generateSignalPubKey,
    Curve,
    signedKeyPair,
    aesEncryptGCM,
    aesDecryptGCM,
    aesEncryptCTR,
    aesDecryptCTR,
    aesDecrypt,
    aesDecryptWithIV,
    aesEncrypt,
    aesEncrypWithIV,
    hmacSign,
    sha256,
    md5,
    hkdf,
    derivePairingCodeKey,
    useMultiFileAuthState
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const readline = require("readline");
const PhoneNumber = require('awesome-phonenumber');
const { Readable } = require('stream');
const path = require('path');


const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(text, resolve));
};

let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = ms => new Promise(resolve => setTimeout(resolve, ms));


const jidCache = new Map();
const nameCache = new Map();
const mediaCache = new Map();

const caseModule = require("./case");

async function startBotz() {
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const ptz = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    version: (await fetchLatestBaileysVersion()).version, // Get latest version
    browser: Browsers.ubuntu("Chrome"), 
    keepAliveIntervalMs: 10000,
    simpleAutoPresence: true,
    emitOwnEvents: true,
    shouldRejectCalls: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
  });

  if (!ptz.authState.creds.registered) {
    const phoneNumber = await question('Enter Phone Number :\n');
    let code = await ptz.requestPairingCode(phoneNumber);
    code = code?.match(/.{1,4}/g)?.join("-") || code;
    console.log(`Pairing Code :`, code);
  }

  store.bind(ptz.ev);
  


  ptz.ev.on('messages.upsert', async (chatUpdate) => {
  try {
    if (!chatUpdate || !Array.isArray(chatUpdate.messages) || chatUpdate.messages.length === 0) return;
    for (const rawMsg of chatUpdate.messages) {
      if (!rawMsg.message) {
        
        continue;
      }
      let messageContent = rawMsg.message;
      const messageTypeKey = Object.keys(messageContent)[0];
      if (messageTypeKey === 'ephemeralMessage' && messageContent.ephemeralMessage.message) {
        messageContent = messageContent.ephemeralMessage.message;
      }
      rawMsg.message = messageContent;
      if (!rawMsg.key) {
        
        continue;
      }
      if (!rawMsg.key.id || !rawMsg.key.remoteJid) {
        
        continue;
      }
      if (rawMsg.key.remoteJid === 'status@broadcast') continue;
      if (!ptz.public && !rawMsg.key.fromMe && chatUpdate.type === 'notify') continue;
      if (rawMsg.key.id.startsWith('BAE5') && rawMsg.key.id.length === 16) continue;
      rawMsg.messageTimestamp = rawMsg.messageTimestamp || Date.now();
      const m = smsg(ptz, rawMsg, store);
      await caseModule(ptz, m, chatUpdate, store);
    }
  } catch (err) {
    console.error("Error processing message:", err);
  }
});

  

  ptz.decodeJid = (jid) => {
    if (!jid) return jid;
    if (jidCache.has(jid)) return jidCache.get(jid);
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      const result = decode.user && decode.server && decode.user + '@' + decode.server || jid;
      jidCache.set(jid, result);
      return result;
    } else return jid;
  };

  ptz.getName = (jid, withoutContact = false) => {
    const cached = nameCache.get(jid);
    if (cached) return cached;

    const id = ptz.decodeJid(jid);
    withoutContact = ptz.withoutContact || withoutContact;
    let v;

    if (id.endsWith("@g.us")) {
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = ptz.groupMetadata(id) || {};
        const result = v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international');
        nameCache.set(jid, result);
        resolve(result);
      });
    } else {
      v = id === '0@s.whatsapp.net' ? {
        id,
        name: 'WhatsApp'
      } : id === ptz.decodeJid(ptz.user.id) ?
        ptz.user :
        (store.contacts[id] || {});
      const result = (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
      nameCache.set(jid, result);
      return result;
    }
  };

  
  ptz.serializeM = (m) => smsg(ptz, m, store);

  
ptz.ev.on('connection.update', async (update) => {
  try {
    const { connection, lastDisconnect, qr, isNewLogin } = update;
    console.log("▷ Connection State:", connection, "| QR:", qr ? "Received" : "None");
    
    // Handle QR Code
    if (qr && !ptz.authState.creds.registered) {
      console.log("⎔ QR Code Regenerated!");
      await ptz.sendMessage(global.owner[0][0] + '@s.whatsapp.net', { 
        image: { url: 'https://files.catbox.moe/w1javo.webp' },
        caption: `⚠️ New QR Code Generated!\nExpires in 60 seconds`
      });
    }

    if (connection === 'open') {
      reconnectAttempts = 0;
      
      // Enhanced Connection Info
      const connectionInfo = `╭─「 🔌 Connection Established 」
│ ➠ User ID: ${ptz.user.id}
│ ➠ Device: ${ptz.user?.device || 'Unknown'}
│ ➠ Platform: ${ptz.user?.platform || 'Web'}
│ ➠ Server: ${ptz.user?.server || 'Not Available'}
╰───────────────────────⊷`;

      console.log(connectionInfo);

      // Enhanced Status Message
      const statusMsg = {
        text: connectionInfo,
        contextInfo: {
          externalAdReply: {
            title: `${global.botname} Connected`,
            body: `Version: 2.0 | Mode: ${ptz.public ? 'Public' : 'Private'}`,
            thumbnailUrl: global.image.menu,
            sourceUrl: global.gh,  // Changed from global.ch to global.gh
            mediaType: 1,
            renderLargerThumbnail: true,
            showAdAttribution: true,
            mediaUrl: global.gh
          }
        }
      };

      // Send to all owners
      for(const owner of global.owner) {
        await ptz.sendMessage(owner[0] + '@s.whatsapp.net', statusMsg)
          .catch(err => console.error('Failed to notify owner:', owner[0], err));
      }

    } else if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = [
        DisconnectReason.badSession,
        DisconnectReason.connectionClosed,
        DisconnectReason.connectionLost,
        DisconnectReason.connectionReplaced,
        DisconnectReason.restartRequired,
        DisconnectReason.timedOut
      ].includes(reason);

      console.log(`⌧ Connection Closed | Reason: ${DisconnectReason[reason]} (${reason})`);

      if (shouldReconnect && lastDisconnect.error?.output?.statusCode !== 401) {
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = 5000 * Math.pow(2, reconnectAttempts); // Exponential backoff
          console.log(`⟳ Reconnecting in ${delay/1000} seconds... (Attempt ${++reconnectAttempts}/${maxReconnectAttempts})`);
          
          await reconnectDelay(delay);
          await startBotz();
        } else {
          console.error('⌧ Maximum reconnection attempts reached!');
          await ptz.sendMessage(global.owner[0][0] + '@s.whatsapp.net', { 
            text: `❌ Bot Disconnected!\nReason: ${DisconnectReason[reason]}\nMax reconnect attempts reached!`
          });
          process.exit(1);
        }
      } else if (reason === DisconnectReason.loggedOut) {
        console.error('⌧ Permanent Logout Detected!');
        await ptz.sendMessage(global.owner[0][0] + '@s.whatsapp.net', { 
          text: '⚠️ BOT LOGGED OUT!\nPlease re-register using new QR code!'
        });
        process.exit(0);
      }
    }

    // Handle new logins
    if (isNewLogin) {
      console.log('⚠️ New login detected from different device!');
      await ptz.sendMessage(global.owner[0][0] + '@s.whatsapp.net', {
        text: '🚨 New Login Alert!\nAccount accessed from new device!'
      });
    }
  } catch (err) {
    console.error("⚠️ Connection Handler Error:", err);
    // Emergency restart
    if(!ptz.user) {
      console.log('⏳ Attempting emergency restart...');
      await reconnectDelay(10000);
      await startBotz();
    }
  }
});
  ptz.ev.on('creds.update', saveCreds);

  ptz.sendText = (jid, text, quoted = '', options) => ptz.sendMessage(jid, { text: text, ...options }, { quoted });

  ptz.downloadMediaMessage = async (message, options = {}) => {
    const {
      buffer = true,
      cache = true,
      throwOnError = false
    } = options;

    try {
      if (!message || !message.message) {
        throw new Error("Invalid message object");
      }

      const mime = (message.msg || message).mimetype || '';
      const messageType = message.mtype ? 
        message.mtype.replace(/Message/gi, '') : 
        mime.split('/')[0].toLowerCase();

      const cacheKey = message.key.id;
      if (cache && mediaCache.has(cacheKey)) {
        return mediaCache.get(cacheKey);
      }

      const stream = await downloadContentFromMessage(message, messageType);
      
      let bufferData = Buffer.alloc(0);
      for await (const chunk of stream) {
        bufferData = Buffer.concat([bufferData, chunk]);
      }

      const metadata = {
        mimeType: mime,
        fileSize: bufferData.length,
        fileName: message.msg?.fileName || null,
        caption: message.msg?.caption || null,
        isViewOnce: !!message.message?.viewOnceMessage
      };

      const result = {
        buffer: bufferData,
        metadata,
        stream: () => Readable.from(bufferData),
        cached: false
      };

      if (cache) {
        result.cached = true;
        mediaCache.set(cacheKey, result);
      }

      return result;

    } catch (error) {
      console.error('[Media Download Error]', error);
      if (throwOnError) throw new Error(`Media download failed: ${error.message}`);
      return null;
    }
  };
  
  return ptz;
}

startBotz();

function smsg(ptz, m, store) {
  if (!m) return m;
  const M = proto.WebMessageInfo;

  // Decode JID and set basic message properties
  const decodeJid = (jid) => {
    if (!jid) return jid;
    if (jidCache.has(jid)) return jidCache.get(jid);
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      const result = decode?.user && decode?.server ? `${decode.user}@${decode.server}` : jid;
      jidCache.set(jid, result);
      return result;
    }
    return jid;
  };

  // Resolve participant and sender
  m.key = m.key || {};
  const { key: { id, remoteJid, fromMe, participant, timestamp, status } = {}, messageTimestamp } = m;
  m.id = id;
  m.isBaileys = id?.startsWith('BAE5') && id.length === 16;
  m.chat = remoteJid;
  m.fromMe = fromMe;
  m.isGroup = m.chat?.endsWith('@g.us');
  m.sender = decodeJid(fromMe && ptz.user.id || participant || m.key?.participant || m.chat || '');
  m.device = participant?.split(':')[0] || '0';
  m.timestamp = messageTimestamp || timestamp;
  m.status = status || status;

  if (m.isGroup) {
    m.participant = decodeJid(m.key.participant) || '';
    m.groupMetadata = store.contacts[m.chat] || {};
  }

  // Process message content
  if (m.message) {
    m.mtype = getContentType(m.message);
    m.msg = m.mtype === 'viewOnceMessage'
      ? m.message[m.mtype]?.message[getContentType(m.message[m.mtype]?.message)]
      : m.message[m.mtype];

    const { conversation, caption, text, singleSelectReply, selectedButtonId } = m.msg || {};

    m.body = conversation
      || caption
      || text
      || (m.mtype === 'listResponseMessage' && singleSelectReply?.selectedRowId)
      || (m.mtype === 'buttonsResponseMessage' && selectedButtonId)
      || (m.mtype === 'viewOnceMessage' && caption)
      || m.text;

    const contextInfo = m.msg?.contextInfo || {};
    m.expiration = contextInfo.expiration;
    m.isForwarded = contextInfo.isForwarded;
    m.forwardingScore = contextInfo.forwardingScore;

    // Process quoted message
    let quoted = m.quoted = contextInfo.quotedMessage;
    m.mentionedJid = contextInfo.mentionedJid || [];

    if (m.quoted) {
      let type = getContentType(quoted);
      m.quoted = m.quoted[type];

      if (['productMessage'].includes(type)) {
        type = getContentType(m.quoted);
        m.quoted = m.quoted[type];
      }

      m.quoted = typeof m.quoted === 'string'
        ? { text: m.quoted }
        : m.quoted;

      m.quoted.mtype = type;
      m.quoted.id = contextInfo.stanzaId;
      m.quoted.chat = contextInfo.remoteJid || m.chat;
      m.quoted.isBaileys = m.quoted.id
        ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16
        : false;
      m.quoted.sender = decodeJid(contextInfo.participant);
      m.quoted.fromMe = m.quoted.sender === decodeJid(ptz.user.id);
      m.quoted.text = m.quoted.text
        || m.quoted.caption
        || m.quoted.conversation
        || m.quoted.contentText
        || m.quoted.selectedDisplayText
        || m.quoted.title
        || '';
      m.quoted.mentionedJid = contextInfo.mentionedJid || [];
      m.quoted.device = contextInfo.participant?.split(':')[0] || '0';

      m.getQuotedObj = async () => {
        if (!m.quoted.id) return false;
        try {
          const q = await store.loadMessage(m.chat, m.quoted.id, ptz);
          const quotedMsg = smsg(ptz, q, store);
          quotedMsg.rawProto = q;
          return quotedMsg;
        } catch (err) {
          console.error("Failed to load quoted message:", err);
          return false;
        }
      };

      let vM = m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id,
          participant: m.quoted.sender
        },
        message: quoted,
        messageTimestamp: m.timestamp,
        status: M.Status.READ,
        ...(m.isGroup ? { participant: m.quoted.sender } : {})
      });

      m.quoted.delete = () => ptz.sendMessage(m.quoted.chat, { delete: vM.key });
      m.quoted.copyNForward = (jid, forceForward = false, options = {}) =>
        ptz.copyNForward(jid, vM, forceForward, options);
      m.quoted.download = () => ptz.downloadMediaMessage(m.quoted);
    }
  }

  m.rawProto = M.fromObject(M.toObject(m));

  if (m.msg?.url) {
    m.download = () => ptz.downloadMediaMessage(m.msg).catch(err => {
      console.error("Download media message failed:", err);
      throw err; // Re-throw the error to be caught by the caller if needed
    });
    m.mediaType = m.mtype.replace('Message', '').toLowerCase();
    m.fileSize = m.msg.fileLength || m.msg[Object.keys(m.msg)[0]]?.fileLength;
  }

  m.text = m.msg?.text
    || m.msg?.caption
    || m.message.conversation
    || m.msg?.contentText
    || m.msg?.selectedDisplayText
    || m.msg?.title
    || '';

  m.reply = async (text, chatId = m.chat, options = {}) => {
    try {
      if (Buffer.isBuffer(text)) {
        await ptz.sendMedia(chatId, text, 'file', '', m, { ...options });
      } else {
        await ptz.sendText(chatId, text, m, { ...options });
      }
    } catch (e) {
      console.error('Reply error:', e);
      throw e;
    }
  };

  m.copy = () => smsg(ptz, M.fromObject(M.toObject(m)));
  m.copyNForward = (jid = m.chat, forceForward = false, options = {}) =>
    ptz.copyNForward(jid, m, forceForward, options);

  return m;
}


// Watch for file changes
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(`Update ${__filename}`);
    delete require.cache[file];
    require(file);
});