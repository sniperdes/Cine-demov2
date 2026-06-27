// /functions/bot.js
// Worker de Telegram Bot para gestionar contenido en KV

const BOT_TOKEN   = '8917767201:AAG-a2u3LAjxhWcUfi7DwQ2ZUYMKdhAie5k';
const ADMIN_ID    = 1590059037;
const BOT_API     = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('OK', { status: 200 });
    }

    let update;
    try {
        update = await request.json();
    } catch {
        return new Response('Bad Request', { status: 400 });
    }

    const msg     = update.message;
    if (!msg) return new Response('OK');

    const chatId  = msg.chat.id;
    const userId  = msg.from.id;
    const texto   = msg.text || '';

    // Solo el admin puede usar comandos
    if (userId !== ADMIN_ID) {
        await enviarMensaje(chatId, '⛔ No autorizado.');
        return new Response('OK');
    }

    // ─── COMANDOS ─────────────────────────────────────────────────────────────

    // /start
    if (texto === '/start') {
        await enviarMensaje(chatId, `👋 *Bot Admin Cine Demo*

Comandos disponibles:

*Agregar contenido:*
/agregar serie nombre temporada episodio url
/agregar pelicula nombre parte url

*Ejemplos:*
\`/agregar serie kiralik-ask 1 1 https://youtu.be/xxx\`
\`/agregar pelicula matrix 1 https://servidor.com/matrix\`

*Consultar:*
/ver serie nombre temporada episodio
/ver pelicula nombre parte
/listar nombre

*Borrar:*
/borrar serie nombre temporada episodio
/borrar pelicula nombre parte`);
        return new Response('OK');
    }

    const partes = texto.split(' ');
    const cmd    = partes[0];

    // /agregar serie kiralik-ask 1 1 https://...
    // /agregar pelicula matrix 1 https://...
    if (cmd === '/agregar') {
        const tipo = partes[1];

        if (tipo === 'serie') {
            const nombre    = partes[2];
            const temporada = partes[3];
            const episodio  = partes[4];
            const url       = partes[5];

            if (!nombre || !temporada || !episodio || !url) {
                await enviarMensaje(chatId, '❌ Formato: /agregar serie nombre temporada episodio url');
                return new Response('OK');
            }

            const key = `video:${nombre}:${temporada}:${episodio}`;
            await env.PELICULAS_KV.put(key, url);
            await enviarMensaje(chatId, `✅ Guardado!\n\n📺 *${nombre}*\nT${temporada}E${episodio}\n🔗 ${url}`);

        } else if (tipo === 'pelicula') {
            const nombre = partes[2];
            const parte  = partes[3];
            const url    = partes[4];

            if (!nombre || !parte || !url) {
                await enviarMensaje(chatId, '❌ Formato: /agregar pelicula nombre parte url');
                return new Response('OK');
            }

            const key = `video:${nombre}:${parte}`;
            await env.PELICULAS_KV.put(key, url);
            await enviarMensaje(chatId, `✅ Guardado!\n\n🎬 *${nombre}*\nParte ${parte}\n🔗 ${url}`);

        } else {
            await enviarMensaje(chatId, '❌ Tipo inválido. Usá: serie o pelicula');
        }

        return new Response('OK');
    }

    // /ver serie kiralik-ask 1 1
    // /ver pelicula matrix 1
    if (cmd === '/ver') {
        const tipo = partes[1];
        let key, label;

        if (tipo === 'serie') {
            const nombre = partes[2], temporada = partes[3], episodio = partes[4];
            key   = `video:${nombre}:${temporada}:${episodio}`;
            label = `${nombre} T${temporada}E${episodio}`;
        } else if (tipo === 'pelicula') {
            const nombre = partes[2], parte = partes[3];
            key   = `video:${nombre}:${parte}`;
            label = `${nombre} parte ${parte}`;
        } else {
            await enviarMensaje(chatId, '❌ Usá: /ver serie nombre temp ep  o  /ver pelicula nombre parte');
            return new Response('OK');
        }

        const url = await env.PELICULAS_KV.get(key);
        if (url) {
            await enviarMensaje(chatId, `✅ *${label}*\n🔗 ${url}`);
        } else {
            await enviarMensaje(chatId, `❌ No encontrado: ${label}`);
        }

        return new Response('OK');
    }

    // /listar kiralik-ask  (muestra todos los capítulos de una serie)
    if (cmd === '/listar') {
        const nombre = partes[1];
        if (!nombre) {
            await enviarMensaje(chatId, '❌ Formato: /listar nombre-serie');
            return new Response('OK');
        }

        const lista = await env.PELICULAS_KV.list({ prefix: `video:${nombre}:` });
        if (!lista.keys.length) {
            await enviarMensaje(chatId, `❌ No hay contenido para: ${nombre}`);
            return new Response('OK');
        }

        let respuesta = `📋 *${nombre}* (${lista.keys.length} entradas)\n\n`;
        for (const k of lista.keys) {
            const partesClave = k.name.split(':');
            if (partesClave.length === 4) {
                respuesta += `T${partesClave[2]}E${partesClave[3]}\n`;
            } else {
                respuesta += `Parte ${partesClave[2]}\n`;
            }
        }

        await enviarMensaje(chatId, respuesta);
        return new Response('OK');
    }

    // /borrar serie kiralik-ask 1 1
    if (cmd === '/borrar') {
        const tipo = partes[1];
        let key, label;

        if (tipo === 'serie') {
            const nombre = partes[2], temporada = partes[3], episodio = partes[4];
            key   = `video:${nombre}:${temporada}:${episodio}`;
            label = `${nombre} T${temporada}E${episodio}`;
        } else if (tipo === 'pelicula') {
            const nombre = partes[2], parte = partes[3];
            key   = `video:${nombre}:${parte}`;
            label = `${nombre} parte ${parte}`;
        } else {
            await enviarMensaje(chatId, '❌ Usá: /borrar serie nombre temp ep');
            return new Response('OK');
        }

        await env.PELICULAS_KV.delete(key);
        await enviarMensaje(chatId, `🗑️ Borrado: ${label}`);
        return new Response('OK');
    }

    // Comando no reconocido
    await enviarMensaje(chatId, '❓ Comando no reconocido. Escribí /start para ver los comandos.');
    return new Response('OK');
}

async function enviarMensaje(chatId, texto) {
    await fetch(`${BOT_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: texto,
            parse_mode: 'Markdown'
        })
    });
}
