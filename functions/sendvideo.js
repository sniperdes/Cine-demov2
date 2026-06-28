// /functions/sendvideo.js
// Manda el video al usuario via bot de Telegram

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
        return new Response(JSON.stringify({ error: 'Falta userId' }), { status: 400, headers: corsHeaders });
    }

    // Armar la key según el tipo
    let key;
    if (tipo === 'serie') {
        key = `video:${nombre}:${temporada}:${episodio}`;
    } else {
        key = `video:${nombre}:${parte}`;
    }

    // Buscar en KV
    const fileIdOrUrl = await env.PELICULAS_KV.get(key);

    if (!fileIdOrUrl) {
        return new Response(JSON.stringify({ error: 'Contenido no disponible', ok: false }), { headers: corsHeaders });
    }

    const BOT_TOKEN = env.BOT_TOKEN;
    const BOT_API   = `https://api.telegram.org/bot${BOT_TOKEN}`;

    // Determinar si es file_id de Telegram o URL externa
    const esUrl = fileIdOrUrl.startsWith('http');

    if (esUrl) {
        // Mandar como link
        await fetch(`${BOT_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: userId,
                text: `▶️ *${nombre}* ${tipo === 'serie' ? `T${temporada}E${episodio}` : `Parte ${parte}`}\n\n${fileIdOrUrl}`,
                parse_mode: 'Markdown'
            })
        });
    } else {
        // Mandar como video de Telegram
        await fetch(`${BOT_API}/sendVideo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: userId,
                video: fileIdOrUrl,
                caption: `▶️ *${nombre}* ${tipo === 'serie' ? `T${temporada}E${episodio}` : `Parte ${parte}`}`,
                parse_mode: 'Markdown',
                supports_streaming: true
            })
        });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
}
