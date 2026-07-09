// /functions/bot.js
const ADMIN_ID = 1590059037;

// Mapa de nombres de archivo conocidos -> nombreKV de la serie
// Agregá acá nuevas series para que el bot las reconozca automáticamente
const SERIES_CONOCIDAS = {
    'te alquilo mi amor': 'kiralik-ask',
    'kiralik ask': 'kiralik-ask',
    'kiralık aşk': 'kiralik-ask',
    'erkenci kus': 'erkenci-kus',
    'erkenci kuş': 'erkenci-kus',
    'sen cal kapimi': 'sen-cal-kapimi',
    'sen çal kapımı': 'sen-cal-kapimi',
    'medcezir': 'medcezir',
    'kara sevda': 'kara-sevda',
    'fatmagul': 'fatmagul',
    'fatmagül': 'fatmagul',
    'asi': 'asi',
    'aşı': 'asi',
    'elif': 'elif',
    'dirilis ertugrul': 'dirilis-ertugrul',
    'diriliş ertuğrul': 'dirilis-ertugrul',
    'resurrection ertugrul': 'dirilis-ertugrul',
    'fatih harbiye': 'fatih-harbiye',
    'cesur ve guzel': 'cesur-ve-guzel',
    'cesur ve güzel': 'cesur-ve-guzel',
    'ezel': 'ezel',
    'guzey guney': 'guzey-guney',
    'güney kuzey': 'guzey-guney',
    'kacak': 'kacak',
    'kaçak': 'kacak',
    'calikusu': 'calikusu',
    'çalıkuşu': 'calikusu',
    'karadayi': 'karadayi',
    'karadayı': 'karadayi',
    'kuruluş osman': 'kurulus-osman',
    'kurulus osman': 'kurulus-osman',
    'poyraz karayel': 'poyraz-karayel',
    'icerde': 'icerde',
    'i̇çerde': 'icerde',
};

// TMDB (misma key que usa poster.js)
const TMDB_KEY = 'acd65342b986ff7dad902ea7412fc003';

// Saca un título aproximado del texto, quitando temporada/episodio/códigos
function extraerTituloGuess(texto) {
    let t = texto
        .replace(/\.(mp4|mkv|avi)$/i, '')
        .replace(/\[[^\]]*\]/g, ' ')
        .replace(/\([^)]*\)/g, ' ')
        .split(/cap[ií]tulo|capitulo|episodio|\bep\.?\s*\d|temporada|season/i)[0];
    t = t.replace(/[|_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    // Quitar prefijos comunes tipo "Ver", "Pelicula", "Película completa"
    t = t.replace(/^(ver|pelicula|película|película completa|pelicula completa)\s+/i, '');
    // Quitar códigos numéricos largos sueltos (IDs de video, no parte del título)
    t = t.replace(/\b\d{5,}\b/g, ' ').replace(/\s+/g, ' ').trim();
    return t;
}

// Busca el título en TMDB (primero como serie, después como película) y arma un bloque sugerido
// Mapea los genre_ids de TMDB a los géneros válidos de tu catálogo de películas
function generoTMDBaGeneroApp(genreIds) {
    const mapa = [
        [878, 'ciencia-ficcion'],
        [53, 'suspenso'],
        [9648, 'suspenso'],
        [99, 'documental'],
        [35, 'comedia-pelicula'],
        [27, 'terror'],
        [10749, 'romance'],
        [12, 'aventura'],
        [28, 'accion'],
    ];
    for (const [id, genero] of mapa) {
        if ((genreIds || []).includes(id)) return genero;
    }
    return 'accion'; // default si no coincide con ninguno
}

async function buscarSugerenciaTMDB(tituloGuess, textoOriginal, env) {
    if (!tituloGuess || tituloGuess.length < 2) return null;

    // Si el texto original trae un año (2019, 2024, etc.), lo usamos para afinar la búsqueda
    const matchAnio = (textoOriginal || '').match(/\b(19\d{2}|20\d{2})\b/);
    const anioParam = matchAnio ? matchAnio[1] : null;

    const buscar = async (tipo) => {
        const endpoint = tipo === 'tv' ? 'search/tv' : 'search/movie';
        const yearParam = anioParam
            ? (tipo === 'tv' ? `&first_air_date_year=${anioParam}` : `&year=${anioParam}`)
            : '';
        try {
            const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_KEY}&language=es-ES&query=${encodeURIComponent(tituloGuess)}${yearParam}`);
            const data = await res.json();
            return data?.results?.[0] || null;
        } catch { return null; }
    };

    // Buscamos en los dos tipos a la vez, sin asumir de antemano si es serie o película
    const [resultadoTv, resultadoMovie] = await Promise.all([buscar('tv'), buscar('movie')]);

    // Nos quedamos con el más relevante según la popularidad que da TMDB
    let resultado, tipo;
    if (resultadoTv && resultadoMovie) {
        if ((resultadoMovie.popularity || 0) >= (resultadoTv.popularity || 0)) {
            resultado = resultadoMovie; tipo = 'movie';
        } else {
            resultado = resultadoTv; tipo = 'tv';
        }
    } else if (resultadoMovie) {
        resultado = resultadoMovie; tipo = 'movie';
    } else if (resultadoTv) {
        resultado = resultadoTv; tipo = 'tv';
    } else {
        return null;
    }

    const titulo = resultado.title || resultado.name || tituloGuess;
    const fecha  = resultado.release_date || resultado.first_air_date || '';
    const anio   = fecha ? fecha.slice(0, 4) : '';
    const overview = (resultado.overview || 'Sin sinopsis disponible.').slice(0, 160);
    const idioma = resultado.original_language || '';
    const esAnimacion = (resultado.genre_ids || []).includes(16);
    const nombreKVsugerido = tituloGuess.toLowerCase()
        .replace(/[^a-z0-9áéíóúñü ]/gi, '')
        .replace(/\s+/g, '-');

    const esTurca = idioma === 'tr';
    const esRusa  = idioma === 'ru';
    const esAnime = idioma === 'ja' && esAnimacion;
    const esDorama = idioma === 'ko' || (idioma === 'ja' && tipo === 'tv');
    const esPeliculaNormal = tipo === 'movie' && !esTurca && !esRusa && !esAnime && !esDorama;

    // Caso especial: película "normal" -> se agrega SOLA al catálogo, sin copiar/pegar
    if (esPeliculaNormal && env) {
        const generoFinal = generoTMDBaGeneroApp(resultado.genre_ids);

        // Consulta extra al detalle para conseguir la duración (no viene en la búsqueda)
        let duracionTexto = '';
        try {
            const detalleRes = await fetch(`https://api.themoviedb.org/3/movie/${resultado.id}?api_key=${TMDB_KEY}&language=es-ES`);
            const detalle = await detalleRes.json();
            if (detalle?.runtime) {
                const h = Math.floor(detalle.runtime / 60);
                const m = detalle.runtime % 60;
                duracionTexto = h > 0 ? ` | 🕐${h}h ${m}min` : ` | 🕐${m}min`;
            }
        } catch { /* si falla, seguimos sin duración */ }

        try {
            const raw = await env.PELICULAS_KV.get('catalogo:peliculas');
            const catalogo = raw ? JSON.parse(raw) : [];

            const yaExiste = catalogo.some(p => p.nombreKV === nombreKVsugerido);
            if (yaExiste) {
                return `🎬 "${titulo}" (${anio}) ya estaba en el catálogo de películas (${nombreKVsugerido}). No se duplicó.`;
            }

            catalogo.push({
                titulo,
                tmdbQuery: `${titulo} ${anio}`,
                nombreKV: nombreKVsugerido,
                genero: generoFinal,
                info: `⭐ ${resultado.vote_average?.toFixed(1) || '?'}${duracionTexto}`,
                desc: overview,
            });

            await env.PELICULAS_KV.put('catalogo:peliculas', JSON.stringify(catalogo));

            return `✅ "${titulo}" (${anio}) se agregó sola al catálogo de películas.\n📁 Género: ${generoFinal}\n🔑 nombreKV: ${nombreKVsugerido}\n\nYa la podés asignar con:\n/asignar pelicula ${nombreKVsugerido} 1`;
        } catch (e) {
            // Si falla el guardado automático, caemos al mensaje de copiar/pegar de siempre
        }
    }

    // Para el resto (series, turcas, rusas, anime, doramas) seguimos con el bloque para copiar/pegar
    let archivoSugerido, generoSugerido;
    if (esTurca) {
        archivoSugerido = 'data-turcas.js';
        generoSugerido = 'turca-drama (o turca-romance/turca-accion, ajustá)';
    } else if (esRusa) {
        archivoSugerido = 'data-rusas.js';
        generoSugerido = 'rusa-drama (o rusa-accion/rusa-thriller, ajustá)';
    } else if (esAnime) {
        archivoSugerido = 'data-anime.js';
        generoSugerido = '(anime no usa género, revisá el formato de data-anime.js)';
    } else if (esDorama) {
        archivoSugerido = 'data-doramas.js';
        generoSugerido = 'dorama-drama (o dorama-romance/dorama-accion, ajustá)';
    } else {
        archivoSugerido = 'data-series.js';
        generoSugerido = 'drama (o comedia/accion-serie, ajustá)';
    }

    const bloque = `{ titulo:'${titulo}', tmdbQuery:'${titulo} ${anio}', nombreKV:'${nombreKVsugerido}', genero:'${generoSugerido}', info:'⭐ ${resultado.vote_average?.toFixed(1) || '?'} | 📺', desc:'${overview.replace(/'/g, "")}' },`;

    return `🎬 No reconocí el título, pero lo encontré en TMDB:\n\n📌 ${titulo} (${anio || '?'})\n📁 Pegar en: ${archivoSugerido}\n\n${bloque}\n\n(Revisá género y nombreKV antes de pegarlo)`;
}

function detectarSerie(texto) {
    try {
        const limpio = texto.toLowerCase()
            .replace(/[|\[\]{}()]/g, ' ')
            .replace(/\s+/g, ' ').trim();

        let nombreKV = null;
        for (const [patron, kv] of Object.entries(SERIES_CONOCIDAS)) {
            if (limpio.includes(patron.toLowerCase())) {
                nombreKV = kv;
                break;
            }
        }

        const match = limpio.match(/cap[ií]tulo\s*(\d+)|capitulo\s*(\d+)|cap\.?\s*(\d+)|episodio\s*(\d+)|ep\.?\s*(\d+)/i);
        const episodio = match ? (match[1] || match[2] || match[3] || match[4] || match[5]) : null;

        const ORDINALES = {
            'primera': 1, 'segunda': 2, 'tercera': 3, 'cuarta': 4, 'quinta': 5,
            'sexta': 6, 'séptima': 7, 'septima': 7, 'octava': 8, 'novena': 9, 'décima': 10, 'decima': 10
        };
        const CARDINALES = {
            'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
            'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10
        };

        let temporada = '1';
        const matchTemp = limpio.match(/temporada\s*(\d+)|season\s*(\d+)/i);
        if (matchTemp) {
            temporada = matchTemp[1] || matchTemp[2];
        } else {
            const matchOrdinal = limpio.match(/(primera|segunda|tercera|cuarta|quinta|sexta|séptima|septima|octava|novena|décima|decima)\s*temporada/i);
            const matchCardinal = limpio.match(/temporada\s*(uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/i);
            if (matchOrdinal) {
                temporada = String(ORDINALES[matchOrdinal[1].toLowerCase()] || 1);
            } else if (matchCardinal) {
                temporada = String(CARDINALES[matchCardinal[1].toLowerCase()] || 1);
            }
        }

        return { nombreKV, episodio, temporada };
    } catch(e) {
        return { nombreKV: null, episodio: null, temporada: '1' };
    }
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

    // ─── DEBUG TEMPORAL: manda el update crudo y cualquier error al admin ───────
    const DEBUG = false; // ya resuelto, dejar en false

    const avisarAdmin = async (texto) => {
        try {
            await fetch(`${BOT_API}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: ADMIN_ID, text: texto.slice(0, 3900) })
            });
        } catch (e) {
            // si esto falla no podemos hacer nada más, no reventar por esto
        }
    };

    if (DEBUG && (update?.channel_post || update?.edited_channel_post)) {
        await avisarAdmin('🐛 DEBUG update recibido:\n' + JSON.stringify(update, null, 1));
    }

    try {

    // ─── VIDEO EN EL CANAL ──────────────────────────────────────────────────────
    const channelPost = update?.channel_post || update?.edited_channel_post;
    if (channelPost && (channelPost.video || channelPost.document)) {
        const fileId   = channelPost.video?.file_id || channelPost.document?.file_id;
        const fileName = channelPost.video?.file_name || channelPost.document?.file_name || 'video';
        const msgId    = channelPost.message_id;

        const colaKey = `cola:${msgId}`;
        await env.PELICULAS_KV.put(colaKey, fileId, { expirationTtl: 43200 }); // 12 horas

        const nombreCorto = fileName.replace(/[_*`]/g, ' ').length > 80
            ? fileName.replace(/[_*`]/g, ' ').slice(0, 80) + '...'
            : fileName.replace(/[_*`]/g, ' ');
        // Usar caption si existe (más descriptivo), sino el nombre del archivo
        const textoDeteccion = channelPost.caption || fileName;
        const deteccion = detectarSerie(textoDeteccion);

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

            // Intentar sugerir el título vía TMDB, sin bloquear el flujo si falla
            try {
                const textoOriginal = channelPost.caption || fileName;
                const tituloGuess = extraerTituloGuess(textoOriginal);
                const sugerencia = await buscarSugerenciaTMDB(tituloGuess, textoOriginal, env);
                if (sugerencia) {
                    await fetch(`${BOT_API}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: ADMIN_ID, text: sugerencia })
                    });
                }
            } catch (e) {
                // no rompemos el flujo si TMDB falla
            }
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

    } catch (error) {
        await avisarAdmin('❌ ERROR en bot.js:\n' + (error?.stack || error?.message || String(error)));
        return new Response('OK'); // devolvemos OK para que Telegram no reintente en loop
    }
}
