# Tsala_Go

Powered by Mulax Prime (由 Mulax Prime 强力驱动)

Tsala_Go is a WhatsApp automation system built using Node.js and the @whiskeysockets/baileys library. It handles group moderation, multi-device identifier mapping, media processing, and command execution.

---

## Session Pairing

To generate and retrieve your session credentials, use the official deployment scanner:

https://tsala-sessison-go.onrender.com/

---

## Features

- Multi-Device Support: Handles JID normalization across standard WhatsApp IDs and LID accounts.
- Group Administration: Tools for member management, status changes, and administrative locks.
- Media Download Engine: Native handlers for images, videos, stickers, voice notes, and documents.
- Modular Architecture: Plugin-based architecture for custom commands.

---

## Installation and Setup

### Prerequisites
- Node.js (v18 or higher)
- Git

### Media API configuration
Media, search, lyrics, and chatbot commands use the EliteProTech API at `https://eliteprotech-apis.zone.id`. Its current public documentation says the endpoints do not require an API key. Keep the API host and credentials out of source files if the provider adds authentication later.

Available commands include `.play`, `.ytaudio`, `.ytvideo`, `.tiktok`, `.instagram`, `.mediafire`, `.lyrics`, `.transcript`, `.apk`, `.tempemail`, `.shazam`, `.webzip`, `.getpp`, and `.fetchpage`. The automatic DM chatbot is controlled by the owner with `.chatbot on` and `.chatbot off`; its setting is saved in `config.json`.

The legacy `.tempnum` command needs `TEMP_NUMBER_API_KEY` in the deployment environment. API keys and WhatsApp session files should stay out of source control.

### 1. Clone the Repository
```bash
git clone [https://github.com/mulaxprime/Tsala_Go.git](https://github.com/mulaxprime/Tsala_Go.git)
cd Tsala_Go
