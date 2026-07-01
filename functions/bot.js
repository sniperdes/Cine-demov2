// /functions/bot.js
const ADMIN_ID = 1590059037;

// Mapa de nombres de archivo conocidos -> nombreKV de la serie
// Agregá acá nuevas series para que el bot las reconozca automáticamente
const SERIES_CONOCIDAS = {
    'te alquilo mi amor': 'kiralik-ask',
    'kiralik ask': 'kiralik-ask',
    'kiralık aşk': 'kiralik-ask',
};

function detectarSerie(nombreArchivo) {
    const nombreLower = nombreArchivo.toLowerCase();

    // Buscar coincidencia de serie conocida
    let nombreKV = null;
    for (const [patron, kv] of Object.entries(SERIES_CONOCIDAS)) {
        if (nombreLower.includes(patron)) {
            nombreKV = kv;
            break;
        }
    }

    // Buscar número de capítulo (Capítulo 20, Cap 20, Episodio 20, Ep20, etc)
    const match = nombreArchivo.match(/cap[ií]tulo\s*(\d+)|cap\.?\s*(\d+)|epi?sodio\s*(\d+)|ep\.?\s*(\d+)/i);
    const episodio = match ? (match[1] || match[2] || match[3] || match[4]) : null;

    // Buscar temporada (Temporada 2, T2, Season 2)
    const matchTemp = nombreArchivo.match(/temporada\s*(\d+)|season\s*(\d+)|\bt(\d+)\b/i);
    const temporada = matchTemp ? (matchTemp[1] || matchTemp[2] || matchTemp[3]) : '1';

    return { nombreKV, episodio, temporada };
}

export async function onRequest(context) {
    const { request, env } = context;

    const BOT_TOKEN = env.BOT_TOKEN;
    const BOT_API   = `https://api.telegram.org/bot${BOT_TOKEN}`;

    if (request.method !== 'POST') {
        return new Response('OK', { status: 200 });
    }

    let update;
    try {
        update = await request.json();
    } catch {
        return new Response('OK');
    }

    // ─── VIDEO EN EL CANAL ──────────────────────────────────────────────────────
    const channelPost = update?.channel_post;
    if (channelPost && (channelPost.video || channelPost.document)) {
        const fileId   = channelPost.video?.file_id || channelPost.document?.file_id;
        const fileName = channelPost.video?.file_name || channelPost.document?.file_name || 'video';
        const msgId    = channelPost.message_id;

        const colaKey = `cola:${msgId}`;
        await env.PELICULAS_KV.put(colaKey, fileId, { expirationTtl: 3600 });

        const nombreCorto = fileName.length > 80 ? fileName.slice(0, 80) + '...' : fileName;
        const deteccion = detectarSerie(fileName);

        let texto = `📹 *Video nuevo detectado!* (ID: ${msgId})\n📁 ${nombreCorto}\n\n`;

        // Si pudimos detectar serie y episodio, mostrar botones de confirmación
        if (deteccion.nombreKV && deteccion.episodio) {
            texto += `🔎 Detecté:\n👉 *${deteccion.nombreKV}* T${deteccion.temporada}E${deteccion.episodio}\n\nConfirmá o corregí abajo:`;

            await fetch(`${BOT_API}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: ADMIN_ID,
                    text: texto,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '✅ Confirmar', callback_data: `conf:${msgId}:${deteccion.nombreKV}:${deteccion.temporada}:${deteccion.episodio}` },
                            { text: '✏️ Corregir', callback_data: `corr:${msgId}` }
                        ]]
                    }
                })
            });
        } else {
            // No se pudo detectar, pedir comando manual
            texto += `Asignalo con:\n\`/asignar serie nombre temp ep ${msgId}\`\n\`/asignar pelicula nombre parte ${msgId}\`\n\nO si es el único pendiente:\n\`/asignar serie nombre temp ep\`\n\`/asignar pelicula nombre parte\``;

            await fetch(`${BOT_API}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: ADMIN_ID, text: texto, parse_mode: 'Markdown' })
            });
        }
        return new Response('OK');
    }

    // ─── BOTONES (callback_query) ───────────────────────────────────────────────
    const callback = update?.callback_query;
    if (callback) {
        const userId = callback.from.id;
        if (userId !== ADMIN_ID) return new Response('OK');

        const data = callback.data;
        const chatId = callback.message.chat.id;
        const messageId = callback.message.message_id;

        if (data.startsWith('conf:')) {
            const [, msgId, nombreKV, temp, ep] = data.split(':');
            const fileId = await env.PELICULAS_KV.get(`cola:${msgId}`);

            if (!fileId) {
                await fetch(`${BOT_API}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: '❌ Video ya no está en cola.' })
                });
                return new Response('OK');
            }

            await env.PELICULAS_KV.put(`video:${nombreKV}:${temp}:${ep}`, fileId);
            await env.PELICULAS_KV.delete(`cola:${msgId}`);

            await fetch(`${BOT_API}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId, message_id: messageId,
                    text: `✅ *${nombreKV}* T${temp}E${ep} guardado!`,
                    parse_mode: 'Markdown'
                })
            });
        }

        if (data.startsWith('corr:')) {
            const [, msgId] = data.split(':');
            await fetch(`${BOT_API}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId, message_id: messageId,
                    text: `✏️ Asignalo manualmente con:\n\`/asignar serie nombre temp ep ${msgId}\`\n\`/asignar pelicula nombre parte ${msgId}\``,
                    parse_mode: 'Markdown'
                })
            });
        }

        // Responder al callback para que deje de "cargar" en Telegram
        await fetch(`${BOT_API}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callback.id })
        });

        return new Response('OK');
    }

    // ─── MENSAJES PRIVADOS ───────────────────────────────────────────────────────
    const msg = update?.message;
    if (!msg) return new Response('OK');

    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const texto  = (msg.text || '').trim();

    const enviar = async (txt) => {
        await fetch(`${BOT_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: txt, parse_mode: 'Markdown' })
        });
    };

    if (userId !== ADMIN_ID) {
        await enviar('⛔ No autorizado.');
        return new Response('OK');
    }

    if (msg.video || msg.document) {
        const fileId = msg.video?.file_id || msg.document?.file_id;
        await env.PELICULAS_KV.put('temp:file_id', fileId, { expirationTtl: 300 });
        await enviar(`✅ Video recibido!\n\nAhora usá:\n/asignar serie kiralik-ask 1 1\n/asignar pelicula matrix 1`);
        return new Response('OK');
    }

    if (texto.startsWith('/start')) {
        await enviar(`👋 *Bot Admin Cine Demo*\n\n*Automático:*\nSubí el video al canal. Si reconozco la serie te muestro botones para confirmar.\n\n*Manual:*\n/asignar serie nombre temp ep [id]\n/asignar pelicula nombre parte [id]\n\n*Link externo:*\n/agregar serie nombre temp ep url\n/agregar pelicula nombre parte url\n\n*Consultar:*\n/ver serie nombre temp ep\n/listar nombre\n\n*Borrar:*\n/borrar serie nombre temp ep`);
        return new Response('OK');
    }

    const partes = texto.split(' ');
    const cmd    = partes[0];

    if (cmd === '/asignar') {
        const tipo = partes[1];
        const ultimoParam = partes[partes.length - 1];
        const esIdMensaje = /^\d+$/.test(ultimoParam) && partes.length > (tipo === 'serie' ? 5 : 4);

        let fileId;
        if (esIdMensaje) {
            fileId = await env.PELICULAS_KV.get(`cola:${ultimoParam}`);
            if (fileId) await env.PELICULAS_KV.delete(`cola:${ultimoParam}`);
        } else {
            fileId = await env.PELICULAS_KV.get('temp:file_id');
        }

        if (!fileId) {
            await enviar('❌ No hay video pendiente o ya fue asignado.');
            return new Response('OK');
        }

        if (tipo === 'serie') {
            const nombre = partes[2], temp = partes[3], ep = partes[4];
            if (!nombre || !temp || !ep) { await enviar('❌ /asignar serie nombre temp ep [id]'); return new Response('OK'); }
            await env.PELICULAS_KV.put(`video:${nombre}:${temp}:${ep}`, fileId);
            if (!esIdMensaje) await env.PELICULAS_KV.delete('temp:file_id');
            await enviar(`✅ *${nombre}* T${temp}E${ep} guardado!`);
        } else if (tipo === 'pelicula') {
            const nombre = partes[2], parte = partes[3];
            if (!nombre || !parte) { await enviar('❌ /asignar pelicula nombre parte [id]'); return new Response('OK'); }
            await env.PELICULAS_KV.put(`video:${nombre}:${parte}`, fileId);
            if (!esIdMensaje) await env.PELICULAS_KV.delete('temp:file_id');
            await enviar(`✅ *${nombre}* parte ${parte} guardado!`);
        }
        return new Response('OK');
    }

    if (cmd === '/agregar') {
        const tipo = partes[1];
        if (tipo === 'serie') {
            const [,, nombre, temp, ep, url] = partes;
            if (!nombre || !temp || !ep || !url) { await enviar('❌ /agregar serie nombre temp ep url'); return new Response('OK'); }
            await env.PELICULAS_KV.put(`video:${nombre}:${temp}:${ep}`, url);
            await enviar(`✅ *${nombre}* T${temp}E${ep}\n🔗 ${url}`);
        } else if (tipo === 'pelicula') {
            const [,, nombre, parte, url] = partes;
            if (!nombre || !parte || !url) { await enviar('❌ /agregar pelicula nombre parte url'); return new Response('OK'); }
            await env.PELICULAS_KV.put(`video:${nombre}:${parte}`, url);
            await enviar(`✅ *${nombre}* parte ${parte}\n🔗 ${url}`);
        }
        return new Response('OK');
    }

    if (cmd === '/ver') {
        const tipo = partes[1];
        let key, label;
        if (tipo === 'serie') { const [,, n, t, e] = partes; key = `video:${n}:${t}:${e}`; label = `${n} T${t}E${e}`; }
        else if (tipo === 'pelicula') { const [,, n, p] = partes; key = `video:${n}:${p}`; label = `${n} parte ${p}`; }
        const val = await env.PELICULAS_KV.get(key);
        await enviar(val ? `✅ *${label}*\n${val}` : `❌ No encontrado: ${label}`);
        return new Response('OK');
    }

    if (cmd === '/listar') {
        const nombre = partes[1];
        if (!nombre) { await enviar('❌ /listar nombre'); return new Response('OK'); }
        const lista = await env.PELICULAS_KV.list({ prefix: `video:${nombre}:` });
        if (!lista.keys.length) { await enviar(`❌ Sin contenido para: ${nombre}`); return new Response('OK'); }
        let resp = `📋 *${nombre}* (${lista.keys.length})\n\n`;
        for (const k of lista.keys) {
            const p = k.name.split(':');
            resp += p.length === 4 ? `T${p[2]}E${p[3]}\n` : `Parte ${p[2]}\n`;
        }
        await enviar(resp);
        return new Response('OK');
    }

    if (cmd === '/borrar') {
        const tipo = partes[1];
        let key, label;
        if (tipo === 'serie') { const [,, n, t, e] = partes; key = `video:${n}:${t}:${e}`; label = `${n} T${t}E${e}`; }
        else if (tipo === 'pelicula') { const [,, n, p] = partes; key = `video:${n}:${p}`; label = `${n} parte ${p}`; }
        await env.PELICULAS_KV.delete(key);
        await enviar(`🗑️ Borrado: ${label}`);
        return new Response('OK');
    }

    await enviar('❓ Comando no reconocido. Escribí /start');
    return new Response('OK');
}
