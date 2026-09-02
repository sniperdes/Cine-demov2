// /functions/mi-referidos.js
// GET /mi-referidos — progreso de invitaciones del usuario (cuántos amigos
// invitados ya vieron algo, y si ya cobró el premio de 10 días).

const REFERIDOS_META = 10;

async function validarInitData(initData, botToken) {
    if (!initData || !botToken) return null;

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');

    const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

    const enc = new TextEncoder();
    const claveWebAppData = await crypto.subtle.importKey(
        'raw', enc.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const secretKeyBytes = await crypto.subtle.sign('HMAC', claveWebAppData, enc.encode(botToken));

    const claveFirma = await crypto.subtle.importKey(
        'raw', secretKeyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const firma = await crypto.subtle.sign('HMAC', claveFirma, enc.encode(dataCheckString));
    const hashCalculado = [...new Uint8Array(firma)].map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashCalculado !== hash) return null;

    const authDate = parseInt(params.get('auth_date') || '0', 10) * 1000;
    if (!authDate || Date.now() - authDate > 24 * 60 * 60 * 1000) return null;

    const userRaw = params.get('user');
    if (!userRaw) return null;
    try { return JSON.parse(userRaw); } catch { return null; }
}

function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequest(context) {
    const { request, env } = context;

    const initData = request.headers.get('X-Telegram-Init-Data') || '';
    const user = await validarInitData(initData, env.BOT_TOKEN);
    if (!user) return json({ progreso: 0, meta: REFERIDOS_META, otorgado: false });

    try {
        const raw = await env.PELICULAS_KV.get(`referidos:${user.id}`);
        const data = raw ? JSON.parse(raw) : { lista: [], otorgado: false };
        return json({ progreso: data.lista.length, meta: REFERIDOS_META, otorgado: !!data.otorgado });
    } catch (e) {
        return json({ progreso: 0, meta: REFERIDOS_META, otorgado: false });
    }
}
