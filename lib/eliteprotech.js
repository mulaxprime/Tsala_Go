const axios = require('axios');

const BASE_URL = 'https://eliteprotech-apis.zone.id';
const client = axios.create({ baseURL: BASE_URL, timeout: 45000, maxContentLength: 80 * 1024 * 1024 });

async function get(endpoint, params = {}) {
    const { data } = await client.get(endpoint, { params });
    if (data?.success === false || data?.status === false) {
        throw new Error(data.error || data.message || 'EliteProTech API returned an error');
    }
    return data;
}

function findUrl(value, keys = /url|link|download|video|audio|file|image|thumbnail/i, parentKey = '') {
    if (!value || typeof value !== 'object') return null;
    for (const [key, item] of Object.entries(value)) {
        if (typeof item === 'string' && /^https?:\/\//i.test(item) && (keys.test(key) || keys.test(parentKey) || /^(result|data|media|download|image|video|audio)$/i.test(parentKey))) return item;
        if (item && typeof item === 'object') {
            const found = findUrl(item, keys, key);
            if (found) return found;
        }
    }
    return null;
}

function responseError(error) {
    const body = error?.response?.data;
    if (typeof body === 'string') return error?.response?.status ? `API request failed (HTTP ${error.response.status})` : body.slice(0, 240);
    if (error?.response?.status) return body?.error || body?.message || `API request failed (HTTP ${error.response.status})`;
    return body?.error || body?.message || error?.message || 'Request failed';
}

module.exports = { BASE_URL, get, findUrl, responseError };
