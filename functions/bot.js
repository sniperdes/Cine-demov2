// /functions/bot.js
// El token y admin ID se leen desde variables de entorno de Cloudflare
// Nunca se exponen en el código

const ADMIN_ID = 1590059037;

export async function onRequest(context) {
    const { request, env } = context;

    const BOT_TOKEN = env.BOT_TOKEN; // Variable secreta en Cloudflare
    const BOT_API   = `https://api.telegram.org/bot${BOT_TOKEN}`;

    if (request.method !== 'POST') {
        return new Response('OK', { status: 200 });
    }

    let update;
    try {
        update = await request.json();
    } catch {
        return new Response('Bad Request', { status: 400 });
    }

    const msg    = update.message;
    if (!msg) return new Response('OK');

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const texto  = msg.text || '';

    const enviar = (txt) => enviarMensaje(BOT_API, chatId, txt);

    if (userId !== ADMIN_ID) {
        await enviar('⛔ No autorizado.');
        return new Response('OK');
    }

    if (texto === '/start') {
        await enviar(`👋 *Bot Admin Cine Demo*

Comandos disponibles:

*Agregar:*
\`/agregar serie kiralik-ask 1 1 https://youtu.be/xxx\`
\`/agregar pelicula matrix 1 https://servidor.com/matrix\`

*Consultar:*
\`/ver serie kiralik-ask 1 1\`
\`/listar kiralik-ask\`

*Borrar:*
\`/borrar serie kiralik-ask 1 1\``);
        return new Response('OK');
    }

    const partes = texto.split(' ');
    const cmd    = partes[0];

    if (cmd === '/agregar') {
        const tipo = partes[1];
        if (tipo === 'serie') {
            const [,, nombre, temporada, episodio, url] = partes;
            if (!nombre || !temporada || !episodio || !url) {
                await enviar('❌ Formato: /agregar serie nombre temporada episodio url');
                return new Response('OK');
            }
            await env.PELICULAS_KV.put(`video:${nombre}:${temporada}:${episodio}`, url);
            await enviar(`✅ Guardado!\n📺 *${nombre}* T${temporada}E${episodio}\n🔗 ${url}`);

        } else if (tipo === 'pelicula') {
            const [,, nombre, parte, url] = partes;
            if (!nombre || !parte || !url) {
                await enviar('❌ Formato: /agregar pelicula nombre parte url');
                return new Response('OK');
            }
            await env.PELICULAS_KV.put(`video:${nombre}:${parte}`, url);
            await enviar(`✅ Guardado!\n🎬 *${nombre}* Parte ${parte}\n🔗 ${url}`);

        } else {
            await enviar('❌ Tipo inválido. Usá: serie o pelicula');
        }
        return new Response('OK');
    }

    if (cmd === '/ver') {
        const tipo = partes[1];
        let key, label;
        if (tipo === 'serie') {
            const [,, nombre, temporada, episodio] = partes;
            key = `video:${nombre}:${temporada}:${episodio}`;
            label = `${nombre} T${temporada}E${episodio}`;
        } else if (tipo === 'pelicula') {
            const [,, nombre, parte] = partes;
            key = `video:${nombre}:${parte}`;
            label = `${nombre} parte ${parte}`;
        }
        const url = await env.PELICULAS_KV.get(key);
        await enviar(url ? `✅ *${label}*\n🔗 ${url}` : `❌ No encontrado: ${label}`);
        return new Response('OK');
    }

    if (cmd === '/listar') {
        const nombre = partes[1];
        if (!nombre) { await enviar('❌ Formato: /listar nombre'); return new Response('OK'); }
        const lista = await env.PELICULAS_KV.list({ prefix: `video:${nombre}:` });
        if (!lista.keys.length) { await enviar(`❌ No hay contenido para: ${nombre}`); return new Response('OK'); }
        let resp = `📋 *${nombre}* (${lista.keys.length} entradas)\n\n`;
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
        if (tipo === 'serie') {
            const [,, nombre, temporada, episodio] = partes;
            key = `video:${nombre}:${temporada}:${episodio}`;
            label = `${nombre} T${temporada}E${episodio}`;
        } else if (tipo === 'pelicula') {
            const [,, nombre, parte] = partes;
            key = `video:${nombre}:${parte}`;
            label = `${nombre} parte ${parte}`;
        }
        await env.PELICULAS_KV.delete(key);
        await enviar(`🗑️ Borrado: ${label}`);
        return new Response('OK');
    }

    await enviar('❓ Comando no reconocido. Escribí /start para ver los comandos.');
    return new Response('OK');
}

async function enviarMensaje(botApi, chatId, texto) {
    await fetch(`${botApi}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'Markdown' })
    });
}
