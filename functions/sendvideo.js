// /functions/sendvideo.js
export async function onRequest(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: corsHeaders });
    }

    const { userId, nombre, temporada, episodio, parte, tipo } = body;

    if (!userId) {
        return new Response(JSON.stringify({ ok: false, error: 'Falta userId' }), { headers: corsHeaders });
    }

    // Armar la key según el tipo
    const key = tipo === 'serie'
        ? `video:${nombre}:${temporada}:${episodio}`
        : `video:${nombre}:${parte}`;

    const fileIdOrUrl = await env.PELICULAS_KV.get(key);

    if (!fileIdOrUrl) {
        return new Response(JSON.stringify({ ok: false, error: 'Sin contenido' }), { headers: corsHeaders });
    }

    const BOT_TOKEN = env.BOT_TOKEN;
    const BOT_API   = `https://api.telegram.org/bot${BOT_TOKEN}`;
    const caption   = tipo === 'serie'
        ? `▶️ *${nombre}* T${temporada}E${episodio}`
        : `🎬 *${nombre}* Parte ${parte}`;

    const esUrl = fileIdOrUrl.startsWith('http');

    if (esUrl) {
        await fetch(`${BOT_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: userId,
                text: `${caption}\n\n${fileIdOrUrl}`,
                parse_mode: 'Markdown'
            })
        });
    } else {
        await fetch(`${BOT_API}/sendVideo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: userId,
                video: fileIdOrUrl,
                caption,
                parse_mode: 'Markdown',
                supports_streaming: true
            })
        });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
}
