// /functions/bot.js
const ADMIN_ID = 1590059037;

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

    // Mensajes del canal (channel_post) — videos subidos directo al canal
    const channelPost = update?.channel_post;
    if (channelPost && (channelPost.video || channelPost.document)) {
        const fileId   = channelPost.video?.file_id || channelPost.document?.file_id;
        const fileName = channelPost.video?.file_name || channelPost.document?.file_name || 'video';
        const msgId    = channelPost.message_id;

        // Guardar en cola con ID único basado en el mensaje
        const colaKey = `cola:${msgId}`;
        await env.PELICULAS_KV.put(colaKey, fileId, { expirationTtl: 3600 }); // 1 hora

        await fetch(`${BOT_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_ID,
                text: `📹 *Video nuevo detectado!*\n📁 ${fileName}\n\nAsignalo con:\n\`/asignar serie nombre temp ep ${msgId}\`\n\`/asignar pelicula nombre parte ${msgId}\`\n\nO si es el único pendiente, podés omitir el ID:\n\`/asignar serie nombre temp ep\`\n\`/asignar pelicula nombre parte\``,
                parse_mode: 'Markdown'
            })
        });
        return new Response('OK');
    }

    // Mensajes privados normales
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

    // VIDEO REENVIADO MANUALMENTE (sigue funcionando como respaldo)
    if (msg.video || msg.document) {
        const fileId = msg.video?.file_id || msg.document?.file_id;
        await env.PELICULAS_KV.put('temp:file_id', fileId, { expirationTtl: 300 });
        await enviar(`✅ Video recibido!\n\nAhora usá:\n/asignar serie kiralik-ask 1 1\n/asignar pelicula matrix 1`);
        return new Response('OK');
    }

    if (texto.startsWith('/start')) {
        await enviar(`👋 *Bot Admin Cine Demo*\n\n*Automático (recomendado):*\nSubí el video directo al canal. El bot te avisa solo y te da el comando exacto para copiar.\n\n*Manual (respaldo):*\n1. Reenviame el video\n2. /asignar serie nombre temp ep\n\n*Link externo:*\n/agregar serie nombre temp ep url\n/agregar pelicula nombre parte url\n\n*Consultar:*\n/ver serie nombre temp ep\n/listar nombre\n\n*Borrar:*\n/borrar serie nombre temp ep`);
        return new Response('OK');
    }

    const partes = texto.split(' ');
    const cmd    = partes[0];

    if (cmd === '/asignar') {
        const tipo = partes[1];

        // Detectar si el último parámetro es un ID de mensaje (número) de la cola
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
            await enviar('❌ No hay video pendiente o ya fue asignado. Verificá el ID.');
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
