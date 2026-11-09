// /functions/registrar-anuncio.js
// Recompensas por ver anuncios:
//   GET  /registrar-anuncio → progreso de hoy (cuántos anuncios vio y el próximo tramo)
//   POST /registrar-anuncio → suma un anuncio visto completo; si llega a un tramo,
//                             regala horas de Premium
// Los tramos son acumulados del día: llegar a 20 anuncios deja 12 h en total (se
// le suman las 6 h que le faltaban), no 12 h encima de las 6. El contador se
// reinicia cada día, así que la recompensa completa se gana 1 vez por día.
// Solo cuentan los anuncios vistos desde el cartel o desde el botón
// "Ver anuncio" del Perfil (no los de antes de cada video).
//
// OJO: el "lo vio completo" lo informa la app, el servidor no puede
// comprobarlo. Por eso hay un mínimo entre anuncios y un tope diario (el último
// tramo): el daño máximo de alguien que falsee llamadas es 12 h de Premium por día.

const TRAMOS = [
    { anuncios: 10, horasTotales: 6 },
    { anuncios: 20, horasTotales: 12 },
];
const TOPE_DIARIO = TRAMOS[TRAMOS.length - 1].anuncios;
const INTERVALO_MIN_MS = 20 * 1000; // mínimo entre un anuncio contado y el siguiente
const HORA_MS = 60 * 60 * 1000;

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

const json = (obj) => new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' } });

export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'GET' && request.method !== 'POST') {
        return new Response('Método no permitido', { status: 405 });
    }

    const user = await validarInitData(request.headers.get('X-Telegram-Init-Data') || '', env.BOT_TOKEN);
    if (!user) return json({ contado: false });

    try {
        const now = Date.now();

        // Día en hora de Argentina (UTC-3)
        const dia = new Date(now - 3 * HORA_MS).toISOString().slice(0, 10);
        const claveDia = `anuncios:${user.id}:${dia}`;
        const raw = await env.PELICULAS_KV.get(claveDia);
        const data = raw ? JSON.parse(raw) : { total: 0, horas: 0, ultimo: 0 };

        const proximoTramo = () => TRAMOS.find(t => t.anuncios > data.total) || null;

        // Consulta de progreso (no cuenta nada)
        if (request.method === 'GET') {
            return json({ total: data.total, proximo: proximoTramo(), tramos: TRAMOS });
        }

        // Si ya tiene un Premium que NO viene de recompensas (pago, referidos o
        // regalado a mano) no hace falta contar. Pero si su Premium activo es el
        // de recompensas, sigue contando: así puede llegar al siguiente tramo del
        // día (ej: pasar de 10 a 20 anuncios mientras tiene las primeras 6 h).
        // El tope diario evita que se encadene más de lo previsto.
        const subRaw = await env.PELICULAS_KV.get(`sub:${user.id}`);
        const sub = subRaw ? JSON.parse(subRaw) : null;
        const subActiva = !!(sub && sub.activo && sub.expiraEn > now);
        const subDeRecompensa = subActiva && sub.ultimoPago?.chargeId === 'recompensa';
        if (subActiva && !subDeRecompensa) return json({ contado: false, premium: true });

        if (data.total >= TOPE_DIARIO) return json({ contado: false, tope: true, total: data.total });
        if (now - data.ultimo < INTERVALO_MIN_MS) return json({ contado: false, total: data.total, proximo: proximoTramo() });

        data.total += 1;
        data.ultimo = now;

        // Horas acumuladas a las que tiene derecho hoy con este total de anuncios
        const horasObjetivo = TRAMOS.filter(t => data.total >= t.anuncios).reduce((m, t) => Math.max(m, t.horasTotales), 0);
        let premio = 0;
        let expiraEn = null;

        if (horasObjetivo > data.horas) {
            premio = horasObjetivo - data.horas;
            data.horas = horasObjetivo;
            // Si todavía tiene horas de recompensa, las nuevas se suman al final
            expiraEn = (subDeRecompensa ? sub.expiraEn : now) + premio * HORA_MS;

            await env.PELICULAS_KV.put(`sub:${user.id}`, JSON.stringify({
                activo: true,
                expiraEn,
                // true: que el aviso diario de "vence en 3 días" no se mande por unas pocas horas regaladas
                avisoEnviado: true,
                // chargeId 'recompensa' = NO es pago real (no habilita +18)
                ultimoPago: { chargeId: 'recompensa', stars: 0, fecha: now },
            }));

            const hora = new Date(expiraEn).toLocaleTimeString('es-AR', {
                hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires'
            });
            await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: user.id,
                    text: `🎁 ¡Viste ${data.total} anuncios hoy en NovaPlay! Te regalamos ${premio} h de Premium — sin anuncios hasta las ${hora} 💎`,
                }),
            }).catch(() => {});
        }

        await env.PELICULAS_KV.put(claveDia, JSON.stringify(data), { expirationTtl: 2 * 24 * 60 * 60 });

        return json({ contado: true, total: data.total, premio: premio || null, expiraEn, proximo: proximoTramo() });
    } catch (e) {
        return json({ contado: false });
    }
}
