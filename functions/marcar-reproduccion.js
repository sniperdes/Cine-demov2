// /functions/marcar-reproduccion.js
// POST /marcar-reproduccion — se llama la primera vez que un usuario reproduce
// algo (no solo al abrir la app). Si ese usuario había entrado por el link de
// invitación de alguien (/start ref_<id>, guardado en bot.js), le suma un
// referido válido a esa persona. Al llegar a 10, le regala 10 días de Premium
// UNA sola vez (no se repite si sigue sumando referidos después).

const REFERIDOS_META = 10;
const DIAS_PREMIO = 30;

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
    if (!user) return new Response('OK'); // silencioso, no rompe la reproducción

    try {
        // Si ya estaba marcado, esto NO era su primera reproducción — no procesamos de nuevo
        const yaReprodujo = await env.PELICULAS_KV.get(`reproducido:${user.id}`);
        if (yaReprodujo) return new Response('OK');
        await env.PELICULAS_KV.put(`reproducido:${user.id}`, '1');

        const referidorId = await env.PELICULAS_KV.get(`referido_por:${user.id}`);
        if (!referidorId) return new Response('OK'); // no vino de ningún link de invitación

        const key = `referidos:${referidorId}`;
        const raw = await env.PELICULAS_KV.get(key);
        const data = raw ? JSON.parse(raw) : { lista: [], otorgado: false };

        const idStr = String(user.id);
        if (data.lista.includes(idStr)) return new Response('OK'); // ya estaba contado (no debería pasar, pero por las dudas)
        data.lista.push(idStr);

        const BOT_API = `https://api.telegram.org/bot${env.BOT_TOKEN}`;

        if (data.lista.length >= REFERIDOS_META && !data.otorgado) {
            data.otorgado = true;

            // Otorgar el premio: mismo mecanismo que /darpremium, extendiendo desde
            // el vencimiento actual si ya tenía Premium
            const now = Date.now();
            const subRaw = await env.PELICULAS_KV.get(`sub:${referidorId}`);
            const subExistente = subRaw ? JSON.parse(subRaw) : null;
            const base = subExistente && subExistente.expiraEn > now ? subExistente.expiraEn : now;
            const expiraEn = base + DIAS_PREMIO * 24 * 60 * 60 * 1000;

            await env.PELICULAS_KV.put(`sub:${referidorId}`, JSON.stringify({
                activo: true,
                expiraEn,
                avisoEnviado: false,
                ultimoPago: { chargeId: 'referidos', stars: 0, fecha: now },
            }));

            const fechaTexto = new Date(expiraEn).toLocaleDateString('es-AR');
            await fetch(`${BOT_API}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: referidorId,
                    text: `🎉 ¡Invitaste a ${REFERIDOS_META} amigos y ya vieron contenido en NovaPlay! Te regalamos ${DIAS_PREMIO} días de Premium — activo hasta *${fechaTexto}* 💎`,
                    parse_mode: 'Markdown',
                }),
            }).catch(() => {});
        } else {
            // Aviso de progreso (no en cada uno, para no ser invasivo — solo cada 2)
            if (data.lista.length % 2 === 0) {
                await fetch(`${BOT_API}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: referidorId,
                        text: `👀 ${data.lista.length}/${REFERIDOS_META} amigos invitados ya vieron algo en NovaPlay. ¡Seguí compartiendo tu link para ganar Premium gratis!`,
                    }),
                }).catch(() => {});
            }
        }

        await env.PELICULAS_KV.put(key, JSON.stringify(data));
    } catch (e) {
        // no bloqueamos la reproducción del usuario si esto falla
    }

    return new Response('OK');
}
