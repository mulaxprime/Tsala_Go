const { cmd } = require('../command');
const { get, findUrl, responseError } = require('../lib/eliteprotech');
const { tiny } = require('../lib/fancy_font/fancy');

const label = '✨ Tsala Yame';
const pickText = value => typeof value === 'string' ? value : JSON.stringify(value, null, 2);

async function sendUrlMedia(conn, from, mek, data, kind) {
    const downloadUrl = findUrl(data, kind === 'video'
        ? /video|url|link|download|media/i
        : /url|link|download|media|file/i);
    if (!downloadUrl) throw new Error('The API response did not include a media URL.');

    const title = data.title || data.result?.title || data.fileName || data.filename || 'Download';
    if (kind === 'video') {
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            caption: tiny(`🎬 *${title}*\n\n> ${label}`),
            mimetype: 'video/mp4'
        }, { quoted: mek });
    } else {
        const safeName = String(title).replace(/[\\/:*?"<>|]+/g, '_');
        const fileName = /\.([a-z0-9]{2,5})$/i.test(safeName) ? safeName : `${safeName}${String(data.mime || '').includes('zip') ? '.zip' : ''}`;
        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: data.mime || data.mimetype || 'application/octet-stream',
            fileName
        }, { quoted: mek });
    }
}

cmd({ pattern: 'tiktok', alias: ['ttdownload', 'ttdl'], desc: 'Download a TikTok video.', category: 'downloader', filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply(tiny('Send a TikTok URL. Example: .tiktok https://www.tiktok.com/@user/video/123'));
    try {
        const data = await get('/download/tiktok', { url: q.trim() });
        const url = findUrl(data, /video|url|link|download|media/i);
        if (!url) throw new Error('The TikTok API did not return a video URL.');
        await conn.sendMessage(from, { video: { url }, caption: tiny(`🎵 ${data.title || data.author?.nickname || 'TikTok video'}\n\n> ${label}`), mimetype: 'video/mp4' }, { quoted: mek });
    } catch (e) { reply(tiny(`❌ TikTok download failed: ${responseError(e)}`)); }
});

cmd({ pattern: 'mediafire', alias: ['mfdownload', 'mf'], desc: 'Download a MediaFire file.', category: 'downloader', filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply(tiny('Send a MediaFire file URL.'));
    try { await sendUrlMedia(conn, from, mek, await get('/download/mediafire', { url: q.trim() }), 'file'); }
    catch (e) { reply(tiny(`❌ MediaFire download failed: ${responseError(e)}`)); }
});

cmd({ pattern: 'instagram', alias: ['igdownload', 'igreel'], desc: 'Download an Instagram post or reel.', category: 'downloader', filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply(tiny('Send an Instagram post or reel URL.'));
    try {
        const data = await get('/download/instagram', { url: q.trim() });
        const url = findUrl(data, /video|url|link|download|media|image/i);
        if (!url) throw new Error('The Instagram API did not return a media URL.');
        const isVideo = /video|reel/i.test(String(data.type || data.mediaType || '')) || /\.mp4(?:\?|$)/i.test(url);
        if (isVideo) await conn.sendMessage(from, { video: { url }, caption: tiny(`📸 ${data.title || 'Instagram media'}\n\n> ${label}`), mimetype: 'video/mp4' }, { quoted: mek });
        else await conn.sendMessage(from, { image: { url }, caption: tiny(`📸 ${data.title || 'Instagram media'}\n\n> ${label}`) }, { quoted: mek });
    } catch (e) { reply(tiny(`❌ Instagram download failed: ${responseError(e)}`)); }
});

cmd({ pattern: 'transcript', alias: ['yttranscript', 'transcribe'], desc: 'Get a YouTube transcript.', category: 'tools', filename: __filename },
async (conn, mek, m, { q, reply }) => {
    if (!q) return reply(tiny('Send a YouTube URL.'));
    try {
        const data = await get('/search/transcript', { url: q.trim() });
        const result = data.result || data.transcript || data.text || data;
        const text = typeof result === 'string' ? result : result.text || result.transcript || result.transcriptText || JSON.stringify(result);
        if (!text || text === '{}') throw new Error('No transcript was returned.');
        return reply(tiny(String(text).slice(0, 12000)));
    } catch (e) { return reply(tiny(`❌ Transcript failed: ${responseError(e)}`)); }
});

cmd({ pattern: 'tempemail', alias: ['tempmail', 'disposablemail'], desc: 'Create or check a temporary email inbox.', category: 'tools', filename: __filename },
async (conn, mek, m, { args, reply }) => {
    try {
        const email = args[0]?.toLowerCase() === 'inbox' ? args[1] : args[0];
        const data = await get('/tools/tempemail', email ? { email } : {});
        const result = data.result || data.data || data;
        const address = result.email || result.address || result.mail || '';
        const messages = result.messages || result.inbox || [];
        if (email) {
            const lines = Array.isArray(messages) ? messages.slice(0, 8).map(x => `${x.from || x.sender || 'Unknown'}: ${x.subject || x.text || x.message || ''}`).join('\n') : pickText(messages);
            return reply(tiny(lines || `Inbox ${email} is empty.`));
        }
        if (!address) throw new Error('The temporary email API did not return an email address.');
        return reply(tiny(`📧 Temporary email: ${address}\n\nCheck it with:\n.tempemail inbox ${address}`));
    } catch (e) { return reply(tiny(`❌ Temporary email failed: ${responseError(e)}`)); }
});

cmd({ pattern: 'shazam', alias: ['identify', 'songid'], desc: 'Identify music from an audio URL.', category: 'tools', filename: __filename },
async (conn, mek, m, { q, reply }) => {
    if (!q) return reply(tiny('Send a direct audio URL. Example: .shazam https://example.com/song.mp3'));
    try {
        const data = await get('/tools/shazam', { url: q.trim() });
        const result = data.result || data.data || data;
        const lines = [result.title || result.name, result.artist || result.artistName, result.album, result.releaseDate].filter(Boolean);
        return reply(tiny(lines.length ? `🎵 ${lines.join('\n')}` : pickText(result).slice(0, 3000)));
    } catch (e) { return reply(tiny(`❌ Shazam lookup failed: ${responseError(e)}`)); }
});

cmd({ pattern: 'webcopier', alias: ['webzip', 'sitezip'], desc: 'Package a website as a ZIP file.', category: 'tools', filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply(tiny('Send a website URL. Example: .webzip https://example.com'));
    try { await sendUrlMedia(conn, from, mek, await get('/tools/webcopier', { url: q.trim() }), 'file'); }
    catch (e) { reply(tiny(`❌ Website ZIP failed: ${responseError(e)}`)); }
});

cmd({ pattern: 'getpp', alias: ['profilepicgen'], desc: 'Generate a profile picture from a prompt.', category: 'tools', filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply(tiny('Describe the profile picture you want.'));
    try {
        const data = await get('/tools/getpp', { prompt: q.trim() });
        const imageUrl = findUrl(data, /image|url|link|download/i);
        if (!imageUrl) throw new Error('The profile picture API did not return an image URL.');
        await conn.sendMessage(from, { image: { url: imageUrl }, caption: tiny(`🖼️ ${data.title || q}`) }, { quoted: mek });
    } catch (e) { reply(tiny(`❌ Profile picture generation failed: ${responseError(e)}`)); }
});

cmd({ pattern: 'fetchpage', alias: ['pagefetch', 'fetch'], desc: 'Fetch a webpage as text.', category: 'tools', filename: __filename },
async (conn, mek, m, { q, reply }) => {
    if (!q) return reply(tiny('Send a website URL.'));
    try {
        const data = await get('/tools/fetchpage', { url: q.trim() });
        const result = data.result || data.content || data.text || data;
        return reply(tiny(String(typeof result === 'string' ? result : JSON.stringify(result, null, 2)).slice(0, 12000)));
    } catch (e) { return reply(tiny(`❌ Fetch page failed: ${responseError(e)}`)); }
});

