// Button helpers for Baileys (native-flow "interactiveButtons")
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')
const config = require('../config')

const P = () => config.PREFIX || '.'

// ---- Local Photo Picker ---------------------------------------------------
function getRandomPhoto() {
    const photosDir = path.join(__dirname, 'photos')
    if (!fs.existsSync(photosDir)) return null

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    const photoFiles = fs.readdirSync(photosDir).filter(file =>
        validExtensions.includes(path.extname(file).toLowerCase())
    )

    if (photoFiles.length === 0) return null

    const randomFile = photoFiles[Math.floor(Math.random() * photoFiles.length)]
    return path.join(photosDir, randomFile)
}

// ---- Button builders -------------------------------------------------------
const qr   = (text, id) => ({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: text, id }) })
const url  = (text, link) => ({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: text, url: link, merchant_url: link }) })
const copy = (text, code) => ({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: text, id: code, copy_code: code }) })
const call = (text, number) => ({ name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: text, phone_number: number }) })
const list = (title, sections) => ({ name: 'single_select', buttonParamsJson: JSON.stringify({ title, sections }) })

// Quick reply that runs a bot command, e.g. cmdBtn('📋 Menu', 'menu')
const cmdBtn = (text, command) => qr(text, P() + command)

// Default row shown under every reply
const defaultButtons = () => [
  cmdBtn('📋 Menu', 'menu'),
  cmdBtn('⚡ Ping', 'ping'),
]

// ---- Helper to build native flow interactive content ----------------------
async function buildInteractiveContent(conn, data) {
  const { text = '', footer = config.BOT_NAME || 'Bot', title, buttons, image } = data
  const interactiveButtons = buttons && buttons.length ? buttons : defaultButtons()

  const interactiveMessage = {
    body: proto.Message.InteractiveMessage.Body.create({ text: text || '' }),
    footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || '' }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons: interactiveButtons
    })
  }

  // 1. Check if caller passed an image explicitly
  // 2. Otherwise pick a random local photo from disk
  let imageSource = image
  if (!imageSource) {
    const photoPath = getRandomPhoto()
    if (photoPath && fs.existsSync(photoPath)) {
      imageSource = { url: photoPath }
    }
  }

  // Handle header media cleanly without raw buffer locks
  if (imageSource) {
    try {
      const mediaMessage = await prepareWAMessageMedia({ image: imageSource }, { upload: conn.waUploadToServer })

      interactiveMessage.header = proto.Message.InteractiveMessage.Header.create({
        title: title || '',
        hasMediaAttachment: true,
        imageMessage: mediaMessage.imageMessage
      })
    } catch (err) {
      console.error('[buttons] Failed to prepare header image, falling back to text header:', err.message)
      if (title) {
        interactiveMessage.header = proto.Message.InteractiveMessage.Header.create({
          title: title,
          hasMediaAttachment: false
        })
      }
    }
  } else if (title) {
    interactiveMessage.header = proto.Message.InteractiveMessage.Header.create({
      title: title,
      hasMediaAttachment: false
    })
  }

  return {
    viewOnceMessage: {
      message: {
        interactiveMessage: interactiveMessage
      }
    }
  }
}

// ---- Sending ---------------------------------------------------------------
async function sendButtons(conn, jid, data, options = {}) {
  const { text = '' } = data

  try {
    const messageContent = await buildInteractiveContent(conn, data)
    const waMessage = generateWAMessageFromContent(jid, messageContent, {
      quoted: options.quoted,
      userJid: conn.user?.id
    })

    return await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
  } catch (e) {
    console.error('[buttons] interactive send failed, falling back to text:', e.message)
    return conn.sendMessage(jid, { text }, options)
  }
}

// ---- Auto-buttons for outgoing text/image/video messages ------------------
const SKIP_KEYS = ['react', 'delete', 'edit', 'forward', 'poll', 'contacts', 'location',
  'sticker', 'audio', 'document', 'interactiveButtons', 'buttons', 'sections',
  'templateButtons', 'listMessage', 'interactiveMessage', 'disappearingMessagesInChat', 'groupInvite']

function enableAutoButtons(sock) {
  const original = sock.sendMessage.bind(sock)

  sock.sendMessage = async (jid, content, options) => {
    if (config.AUTO_BUTTONS === 'False' || config.AUTO_BUTTONS === 'false') {
      return original(jid, content, options)
    }
    if (!content || typeof content !== 'object') return original(jid, content, options)
    if (!jid || jid.endsWith('@newsletter') || jid === 'status@broadcast') return original(jid, content, options)
    if (SKIP_KEYS.some(k => content[k] !== undefined)) return original(jid, content, options)

    const hasText = typeof content.text === 'string' && content.text.length > 0
    if (!hasText) return original(jid, content, options)

    try {
      return await sendButtons(sock, jid, { text: content.text }, options)
    } catch (e) {
      console.error('[buttons] auto-button send failed, retrying plain:', e.message)
      return original(jid, content, options)
    }
  }

  return sock
}

// ---- Reading button taps ---------------------------------------------------
function extractSelectedId(type, msg) {
  if (!msg) return ''
  try {
    if (type === 'buttonsResponseMessage')       return msg.selectedButtonId || ''
    if (type === 'templateButtonReplyMessage')   return msg.selectedId || ''
    if (type === 'listResponseMessage')          return msg.singleSelectReply?.selectedRowId || ''
    if (type === 'interactiveResponseMessage') {
      const p = msg.nativeFlowResponseMessage?.paramsJson
      if (p) {
        const parsed = JSON.parse(p)
        return parsed.id || parsed.selectedId || parsed.selected_row_id || ''
      }
    }
  } catch {}
  return ''
}

module.exports = { qr, url, copy, call, list, cmdBtn, defaultButtons, sendButtons, enableAutoButtons, extractSelectedId }