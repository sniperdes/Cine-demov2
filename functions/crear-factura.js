// /functions/crear-factura.js
// POST /crear-factura — genera un link de pago con Telegram Stars (createInvoiceLink)
// para que la Mini App lo abra con Telegram.WebApp.openInvoice().
//
// ⚠️ STARS_PRICE y PREMIUM_PAYLOAD tienen que coincidir exactamente con los que
// usa /functions/bot.js al validar el pre_checkout_query — si cambiás el precio,
// cambialo en los dos archivos.

const STARS_PRICE = 150;
const PREMIUM_PAYLOAD = 'novaplay_premium_30d';

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

    if (request.method !== 'POST') {
        return json({ error: 'Método no permitido' }, 405);
    }

    const initData = request.headers.get('X-Telegram-Init-Data') || '';
    const user = await validarInitData(initData, env.BOT_TOKEN);
    if (!user) return json({ error: 'No se pudo verificar el usuario de Telegram' }, 401);

    const BOT_API = `https://api.telegram.org/bot${env.BOT_TOKEN}`;

    try {
        const res = await fetch(`${BOT_API}/createInvoiceLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'NovaPlay Premium (30 días)',
                description: 'Mirá todo el catálogo sin anuncios durante 30 días.',
                payload: PREMIUM_PAYLOAD,
                currency: 'XTR', // XTR = Telegram Stars
                prices: [{ label: 'Premium 30 días', amount: STARS_PRICE }],
            }),
        });
        const data = await res.json();

        if (!data.ok) {
            return json({ error: data.description || 'Telegram rechazó la factura' }, 502);
        }
        return json({ link: data.result });
    } catch (e) {
        return json({ error: e?.message || 'Error inesperado' }, 500);
    }
}
