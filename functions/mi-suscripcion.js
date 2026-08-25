// /functions/mi-suscripcion.js
// GET /mi-suscripcion — devuelve { activo, expiraEn } para el usuario que pega la llamada.
// El usuario se identifica validando el initData que manda la Mini App (header
// X-Telegram-Init-Data), NO por un userId que venga suelto en la URL — así nadie
// puede consultar (ni falsear) la suscripción de otra persona.

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

    // secret_key = HMAC_SHA256(bot_token, key="WebAppData")
    const claveWebAppData = await crypto.subtle.importKey(
        'raw', enc.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const secretKeyBytes = await crypto.subtle.sign('HMAC', claveWebAppData, enc.encode(botToken));

    // hash = HMAC_SHA256(data_check_string, key=secret_key)
    const claveFirma = await crypto.subtle.importKey(
        'raw', secretKeyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const firma = await crypto.subtle.sign('HMAC', claveFirma, enc.encode(dataCheckString));
    const hashCalculado = [...new Uint8Array(firma)].map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashCalculado !== hash) return null;

    // Descarta initData viejos (más de 24hs), por las dudas
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
    if (!user) return json({ activo: false });

    try {
        const raw = await env.PELICULAS_KV.get(`sub:${user.id}`);
        if (!raw) return json({ activo: false });

        const sub = JSON.parse(raw);
        const activo = !!sub.activo && sub.expiraEn > Date.now();
        return json({ activo, expiraEn: sub.expiraEn });
    } catch (e) {
        return json({ activo: false });
    }
}
