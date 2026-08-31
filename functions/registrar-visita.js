// /functions/registrar-visita.js
// POST /registrar-visita — se llama una vez al abrir la Mini App. Guarda/actualiza
// `visita:${userId}` en KV con la primera y la última vez que entró, validando la
// identidad vía el initData de Telegram (mismo esquema que /mi-suscripcion).
// Sirve de base para el comando /estadisticas del bot.

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

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') return new Response('Método no permitido', { status: 405 });

    const initData = request.headers.get('X-Telegram-Init-Data') || '';
    const user = await validarInitData(initData, env.BOT_TOKEN);
    if (!user) return new Response('OK'); // silencioso — no rompe la app si falla

    try {
        const key = `visita:${user.id}`;
        const raw = await env.PELICULAS_KV.get(key);
        const now = Date.now();
        const existente = raw ? JSON.parse(raw) : null;

        await env.PELICULAS_KV.put(key, JSON.stringify({
            nombre: [user.first_name, user.last_name].filter(Boolean).join(' '),
            primeraVisita: existente?.primeraVisita || now,
            ultimaVisita: now,
        }));
    } catch (e) {
        // no bloqueamos la app si esto falla
    }

    return new Response('OK');
}
