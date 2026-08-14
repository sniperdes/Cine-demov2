// /functions/bot.js
const ADMIN_ID = 1590059037;

// Mapa compartido: tipo de catálogo -> clave de KV. Usado por /listarcatalogo,
// /vercatalogo, /borrarcatalogo, /corregir y el handler cancel:
const KV_KEY_POR_TIPO = {
    pelicula: 'catalogo:peliculas',
    serie: 'catalogo:series',
    anime: 'catalogo:animes',
    dorama: 'catalogo:doramas',
};
const TIPOS_CATALOGO_VALIDOS = Object.keys(KV_KEY_POR_TIPO);

// Mapa de nombres de archivo conocidos -> nombreKV de la serie
// Agregá acá nuevas series para que el bot las reconozca automáticamente
const SERIES_CONOCIDAS = {
    'te alquilo mi amor': 'kiralik-ask',
    'kiralik ask': 'kiralik-ask',
    'kiralık aşk': 'kiralik-ask',
    'Pájaro Soñador': 'erkenci-kus',
    'erkenci kuş': 'erkenci-kus',
    'sen cal kapimi': 'sen-cal-kapimi',
    'sen çal kapımı': 'sen-cal-kapimi',
    'llamas a mi puerta': 'sen-cal-kapimi',
    'medcezir': 'medcezir',
    'kara sevda': 'kara-sevda',
    'amor eterno': 'kara-sevda',
    'fatmagul': 'fatmagul',
    'fatmagül': 'fatmagul',
    'asi': 'asi',
    'aşı': 'asi',
    'elif': 'elif',
    'Kahraman Babam': 'mi-padre-heroe',
    'El Doctor Del Pueblo': 'el-doctor-del-pueblo',
    'kasaba doktoru': 'el-doctor-del-pueblo',
    'contra el destino': 'contra-el-destino',
    'kadere karşı': 'contra-el-destino',
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
    'no te enamores': 'no-te-enamores',
    'una parte de mí': 'no-te-enamores',
    'kuruluş osman': 'kurulus-osman',
    'kurulus osman': 'kurulus-osman',
    'poyraz karayel': 'poyraz-karayel',
    'icerde': 'icerde',
    'i̇çerde': 'icerde',

    // ── Series (van a data-series.js) ──────────────────────────────
    // 'breaking bad': 'breaking-bad',
    // 'stranger things': 'stranger-things',

    // ── Doramas (van a data-doramas.js) ─────────────────────────────
    'Así aprenderás': 'así-aprenderás',
    'Pro bono': 'pro-bono',
    'Un sueño contigo': 'un-sueño-contigo',
    'Nos vemos en la oficina': 'nos-vemos-en-la-oficina',
    'Un novio por suscripción': 'un-novio-por-suscripción',
    'Hacemos lo que podemos': 'hacemos-lo-que-podemos',
    'En tu mejor momento': 'en-tu-mejor-momento',
    'El genio y los deseos': 'el-genio-y-los-deseos',
    'Un chico ejemplar': 'un-chico-ejemplar',
    'Perros de caza': 'perros-de-caza',
    'GOBLIN El solitario ser inmortal': 'goblin-el-solitario-ser-inmortal',
    'El capo del bloque': 'el-capo-del-bloque',

    // ── Anime (van a data-anime.js) ─────────────────────────────────
    'Ore dake Level Up na Ken Solo Leveling ': 'solo-leveling',
    'Solo Leveling': 'solo-leveling',
    'Jujutsu Kaisen 0': 'jujutsu-kaisen-0',
    'De campesino cuarentón a espadachín legendario': 
    'de campesino cuarenton a espadachin legendario': 'de-campesino-a-espadachin',
    'katainaka no ossan': 'de-campesino-a-espadachin',
    // ── Rusas (van a data-rusas.js) ──────────────────────────────────
    // 'brigada': 'brigada',
};

// TMDB (misma key que usa poster.js)
const TMDB_KEY = 'acd65342b986ff7dad902ea7412fc003';

// Saca un título aproximado del texto, quitando temporada/episodio/códigos
function extraerTituloGuess(texto) {
    let t = texto
        .replace(/\.(mp4|mkv|avi)$/i, '')
        .replace(/\[[^\]]*\]/g, ' ')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, ' ') // 🇫🇷 🇹🇷 🇪🇸 🇦🇷
        .split(/cap[ií]tulo|capitulo|episodio|\bep\.?\s*\d|temporada|season/i)[0];
    t = t.replace(/[|_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    // Quitar prefijos comunes tipo "Ver", "Pelicula", "Película completa"
    t = t.replace(/^(ver|pelicula|película|película completa|pelicula completa)\s+/i, '');
    // Quitar códigos numéricos largos sueltos (IDs de video, no parte del título)
    t = t.replace(/\b\d{5,}\b/g, ' ').replace(/\s+/g, ' ').trim();
    t = t.replace(/\p{Extended_Pictographic}/gu, ' ') // Emojis
    .replace(/[★☆✦✪✨❖◆◇•►【】《》]/g, ' ')      // Símbolos decorativos
    .replace(/(?:ᴴᴰ|HD|FHD|UHD|4K|1080p|720p|480p)/gi, ' ') // Calidad
    .replace(/\s+/g, ' ')
    .trim();
    return t;
}

// Mapea los genre_ids de series de TV (TMDB) a los géneros válidos de data-series.js
function generoTMDBaGeneroSerie(genreIds) {
    const mapa = [
        [10759, 'accion-serie'],
        [16, 'animacion-serie'],
        [35, 'comedia'],
        [80, 'crimen-serie'],
        [99, 'documental-serie'],
        [18, 'drama'],
        [10751, 'familiar-serie'],
        [9648, 'misterio-serie'],
        [10765, 'cienciaficcion-fantasia-serie'],
        [10768, 'belica-serie'],
        [37, 'western-serie'],
    ];
    const encontrados = mapa.filter(([id]) => (genreIds || []).includes(id)).map(([, genero]) => genero);
    return encontrados.length ? encontrados : ['drama'];
}
// Mapea los genre_ids de TMDB a los géneros válidos de tu catálogo de películas.
// Devuelve un ARRAY: una película puede caer en más de un género (ej: terror + suspenso).
function generoTMDBaGeneroApp(genreIds) {
    const mapa = [
        [28, 'accion'],
        [12, 'aventura'],
        [16, 'animacion'],
        [35, 'comedia-pelicula'],
        [80, 'crimen'],
        [99, 'documental'],
        [18, 'drama-pelicula'],
        [10751, 'familiar'],
        [14, 'fantasia'],
        [36, 'historia'],
        [27, 'terror'],
        [10402, 'musica'],
        [9648, 'misterio'],
        [10749, 'romance'],
        [878, 'ciencia-ficcion'],
        [53, 'suspenso'],
        [10752, 'belica'],
        [37, 'western'],
    ];
    const encontrados = mapa.filter(([id]) => (genreIds || []).includes(id)).map(([, genero]) => genero);
    return encontrados.length ? encontrados : ['accion']; // default si no coincide con ninguno
}

// Igual que generoTMDBaGeneroSerie pero genérico con sufijo, para no chocar
// slugs entre anime/doramas/series (ej: 'accion-anime' vs 'accion-dorama')
function generoTMDBaGeneroTV(genreIds, sufijo) {
    const mapa = [
        [10759, 'accion'], [16, 'animacion'], [35, 'comedia'], [80, 'crimen'],
        [99, 'documental'], [18, 'drama'], [10751, 'familiar'], [9648, 'misterio'],
        [10765, 'ciencia-ficcion-fantasia'], [10768, 'belica'], [37, 'western'],
    ];
    const encontrados = mapa.filter(([id]) => (genreIds || []).includes(id)).map(([, g]) => `${g}${sufijo}`);
    return encontrados.length ? encontrados : [`drama${sufijo}`];
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
    const tituloOriginal = resultado.original_title || resultado.original_name || titulo;
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
    const esDorama = idioma === 'ko';
    const esPeliculaNormal = tipo === 'movie' && !esTurca && !esRusa && !esAnime && !esDorama;
    const esSerieNormal = tipo === 'tv' && !esTurca && !esRusa && !esAnime && !esDorama;

    // Caso especial: película "normal" -> se agrega SOLA al catálogo, sin copiar/pegar
    if (esPeliculaNormal && env) {
        const generoFinal = generoTMDBaGeneroApp(resultado.genre_ids);

        // Consulta extra al detalle para conseguir la duración y el título internacional (en inglés)
        // Esto evita usar el título original en el idioma nativo (ej. hindi, coreano) o la traducción
        // al español, que "poster.js"/"trailer.js" (que buscan sin idioma, por default en inglés) no encontrarían.
        let duracionTexto = '';
        let tituloParaQuery = tituloOriginal;
        try {
            const detalleRes = await fetch(`https://api.themoviedb.org/3/movie/${resultado.id}?api_key=${TMDB_KEY}`);
            const detalle = await detalleRes.json();
            if (detalle?.runtime) {
                const h = Math.floor(detalle.runtime / 60);
                const m = detalle.runtime % 60;
                duracionTexto = h > 0 ? ` | 🕐${h}h ${m}min` : ` | 🕐${m}min`;
            }
            if (detalle?.title) tituloParaQuery = detalle.title;
        } catch { /* si falla, seguimos con tituloOriginal */ }

        try {
            const raw = await env.PELICULAS_KV.get('catalogo:peliculas');
            const catalogo = raw ? JSON.parse(raw) : [];

            const yaExiste = catalogo.some(p => p.nombreKV === nombreKVsugerido);
            if (yaExiste) {
                return {
                    texto: `🎬 "${titulo}" (${anio}) ya estaba en el catálogo de películas (${nombreKVsugerido}). No se duplicó.`,
                    nombreKV: nombreKVsugerido,
                    catalogoTipo: 'pelicula'
                };
            }

            catalogo.push({
                titulo,
                tmdbQuery: `${tituloParaQuery} ${anio}`,
                nombreKV: nombreKVsugerido,
                generos: generoFinal,
                info: `⭐ ${resultado.vote_average?.toFixed(1) || '?'}${duracionTexto}`,
                desc: overview,
            });

            await env.PELICULAS_KV.put('catalogo:peliculas', JSON.stringify(catalogo));

            return {
                texto: `✅ "${titulo}" (${anio}) se agregó sola al catálogo de películas.\n📁 Géneros: ${generoFinal.join(', ')}\n🔑 nombreKV: ${nombreKVsugerido}`,
                nombreKV: nombreKVsugerido,
                catalogoTipo: 'pelicula'
            };
        } catch (e) {
            // Si falla el guardado automático, caemos al mensaje de copiar/pegar de siempre
        }
    }

    // Caso especial: serie "normal" (occidental) -> se agrega SOLA al catálogo
    if (esSerieNormal && env) {
        const generosFinal = generoTMDBaGeneroSerie(resultado.genre_ids);
        // Reusamos detectarSerie solo para sacar temporada/episodio del nombre del archivo
        // (ya sabemos que nombreKV dio null acá, porque si no, no estaríamos en esta rama)
        const { episodio, temporada } = detectarSerie(textoOriginal);

        try {
            const raw = await env.PELICULAS_KV.get('catalogo:series');
            const catalogo = raw ? JSON.parse(raw) : [];
            const yaExiste = catalogo.some(s => s.nombreKV === nombreKVsugerido);

            if (!yaExiste) {
                catalogo.push({
                    titulo,
                    tmdbQuery: `${tituloOriginal} ${anio}`,
                    nombreKV: nombreKVsugerido,
                    generos: generosFinal,
                    info: `⭐ ${resultado.vote_average?.toFixed(1) || '?'} | 📺`,
                    desc: overview,
                });
                await env.PELICULAS_KV.put('catalogo:series', JSON.stringify(catalogo));
            }

            const textoBase = yaExiste
                ? `📺 "${titulo}" (${anio}) ya estaba en el catálogo de series (${nombreKVsugerido}). No se duplicó.`
                : `✅ "${titulo}" (${anio}) se agregó sola al catálogo de series.\n📁 Géneros: ${generosFinal.join(', ')}\n🔑 nombreKV: ${nombreKVsugerido}`;

            if (episodio) {
                return {
                    texto: `${textoBase}\n\n¿Guardo este video como T${temporada}E${episodio}?`,
                    nombreKV: nombreKVsugerido,
                    temporada,
                    episodio,
                    catalogoTipo: 'serie'
                };
            }
            // No se pudo sacar el episodio del nombre del archivo: guarda la ficha
            // igual, pero sin botón (asigná el video a mano con /asignar serie)
            return { texto: `${textoBase}\n\nNo pude leer el episodio del nombre del archivo — asignalo a mano:\n/asignar serie ${nombreKVsugerido} 1 1` };
        } catch (e) {
            // Si falla, caemos al bloque de copiar/pegar de siempre
        }
    }

    // Caso especial: anime -> se agrega SOLO al catálogo
    if (esAnime && env) {
        const generosFinal = generoTMDBaGeneroTV(resultado.genre_ids, '-anime');
        const { episodio, temporada } = detectarSerie(textoOriginal);

        try {
            const raw = await env.PELICULAS_KV.get('catalogo:animes');
            const catalogo = raw ? JSON.parse(raw) : [];
            const yaExiste = catalogo.some(s => s.nombreKV === nombreKVsugerido);

            if (!yaExiste) {
                catalogo.push({
                    titulo,
                    tmdbQuery: `${tituloOriginal} ${anio}`,
                    nombreKV: nombreKVsugerido,
                    generos: generosFinal,
                    info: `⭐ ${resultado.vote_average?.toFixed(1) || '?'} | 📺`,
                    desc: overview,
                });
                await env.PELICULAS_KV.put('catalogo:animes', JSON.stringify(catalogo));
            }

            const textoBase = yaExiste
                ? `🎌 "${titulo}" (${anio}) ya estaba en el catálogo de anime (${nombreKVsugerido}). No se duplicó.`
                : `✅ "${titulo}" (${anio}) se agregó solo al catálogo de anime.\n📁 Géneros: ${generosFinal.join(', ')}\n🔑 nombreKV: ${nombreKVsugerido}`;

            if (episodio) {
                return {
                    texto: `${textoBase}\n\n¿Guardo este video como T${temporada}E${episodio}?`,
                    nombreKV: nombreKVsugerido,
                    temporada,
                    episodio,
                    catalogoTipo: 'anime'
                };
            }
            return { texto: `${textoBase}\n\nNo pude leer el episodio del nombre del archivo — asignalo a mano:\n/asignar serie ${nombreKVsugerido} 1 1` };
        } catch (e) {
            // Si falla, caemos al bloque de copiar/pegar de siempre
        }
    }

    // Caso especial: dorama -> se agrega SOLO al catálogo
    if (esDorama && env) {
        const generosFinal = generoTMDBaGeneroTV(resultado.genre_ids, '-dorama');
        const { episodio, temporada } = detectarSerie(textoOriginal);

        try {
            const raw = await env.PELICULAS_KV.get('catalogo:doramas');
            const catalogo = raw ? JSON.parse(raw) : [];
            const yaExiste = catalogo.some(s => s.nombreKV === nombreKVsugerido);

            if (!yaExiste) {
                catalogo.push({
                    titulo,
                    tmdbQuery: `${tituloOriginal} ${anio}`,
                    nombreKV: nombreKVsugerido,
                    generos: generosFinal,
                    info: `⭐ ${resultado.vote_average?.toFixed(1) || '?'} | 📺`,
                    desc: overview,
                });
                await env.PELICULAS_KV.put('catalogo:doramas', JSON.stringify(catalogo));
            }

            const textoBase = yaExiste
                ? `🎎 "${titulo}" (${anio}) ya estaba en el catálogo de doramas (${nombreKVsugerido}). No se duplicó.`
                : `✅ "${titulo}" (${anio}) se agregó solo al catálogo de doramas.\n📁 Géneros: ${generosFinal.join(', ')}\n🔑 nombreKV: ${nombreKVsugerido}`;

            if (episodio) {
                return {
                    texto: `${textoBase}\n\n¿Guardo este video como T${temporada}E${episodio}?`,
                    nombreKV: nombreKVsugerido,
                    temporada,
                    episodio,
                    catalogoTipo: 'dorama'
                };
            }
            return { texto: `${textoBase}\n\nNo pude leer el episodio del nombre del archivo — asignalo a mano:\n/asignar serie ${nombreKVsugerido} 1 1` };
        } catch (e) {
            // Si falla, caemos al bloque de copiar/pegar de siempre
        }
    }

    // Para el resto (turcas, rusas y series/anime/doramas sin episodio detectable) seguimos con el bloque para copiar/pegar
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

    const bloque = `{ titulo:'${titulo}', tmdbQuery:'${tituloOriginal} ${anio}', nombreKV:'${nombreKVsugerido}', genero:'${generoSugerido}', info:'⭐ ${resultado.vote_average?.toFixed(1) || '?'} | 📺', desc:'${overview.replace(/'/g, "")}' },`;

    return { texto: `🎬 No reconocí el título, pero lo encontré en TMDB:\n\n📌 ${titulo} (${anio || '?'})\n📁 Pegar en: ${archivoSugerido}\n\n${bloque}\n\n(Revisá género y nombreKV antes de pegarlo)` };
}

function detectarSerie(texto) {
    try {
        const limpio = texto.toLowerCase()
            .replace(/[|\[\]{}()]/g, ' ')
            .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, ' ')      // banderas 🇹🇷 🇪🇸
            .replace(/\p{Extended_Pictographic}/gu, ' ')      // emojis
            .replace(/[★☆✦✪✨❖◆◇•►【】《》]/g, ' ')            // símbolos decorativos
            .replace(/(?:ᴴᴰ|hd|fhd|uhd|4k|1080p|720p|480p)/gi, ' ') // calidad
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
                        ], [
                            { text: '❌ Cancelar', callback_data: `cancel:${msgId}:none:` }
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
                    const payload = {
                        chat_id: ADMIN_ID,
                        text: sugerencia.texto,
                        parse_mode: 'Markdown'
                    };
                    // Si identificamos el nombreKV, ofrecer botón para guardar el video
                    // automáticamente, sin tipear el comando. El prefijo del callback
                    // (confs/confa/confd) depende de la categoría auto-detectada.
                    const prefijoConfirmarEpisodio = { serie: 'confs', anime: 'confa', dorama: 'confd' }[sugerencia.catalogoTipo] || 'confs';

                    if (sugerencia.nombreKV && sugerencia.episodio) {
                        payload.reply_markup = {
                            inline_keyboard: [[
                                { text: '✅ Confirmar', callback_data: `${prefijoConfirmarEpisodio}:${msgId}:${sugerencia.nombreKV}:${sugerencia.temporada}:${sugerencia.episodio}` },
                                { text: '✏️ Corregir', callback_data: `corr:${msgId}` }
                            ], [
                                { text: '❌ Cancelar', callback_data: `cancel:${msgId}:${sugerencia.catalogoTipo}:${sugerencia.nombreKV}` }
                            ]]
                        };
                    } else if (sugerencia.nombreKV) {
                        payload.text += `\n\n¿Guardo este video como *${sugerencia.nombreKV}* parte 1?`;
                        payload.reply_markup = {
                            inline_keyboard: [[
                                { text: '✅ Confirmar', callback_data: `confp:${msgId}:${sugerencia.nombreKV}:1` },
                                { text: '✏️ Corregir', callback_data: `corr:${msgId}` }
                            ], [
                                { text: '❌ Cancelar', callback_data: `cancel:${msgId}:${sugerencia.catalogoTipo}:${sugerencia.nombreKV}` }
                            ]]
                        };
                    }
                    await fetch(`${BOT_API}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
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

        if (data.startsWith('confp:')) {
            const [, msgId, nombreKV, parte] = data.split(':');
            const fileId = await env.PELICULAS_KV.get(`cola:${msgId}`);

            if (!fileId) {
                await fetch(`${BOT_API}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: '❌ Video ya no está en cola.' })
                });
                return new Response('OK');
            }

            await env.PELICULAS_KV.put(`video:${nombreKV}:${parte}`, fileId);
            await env.PELICULAS_KV.delete(`cola:${msgId}`);

            await fetch(`${BOT_API}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId, message_id: messageId,
                    text: `✅ *${nombreKV}* parte ${parte} guardado!`,
                    parse_mode: 'Markdown'
                })
            });
        }

        if (data.startsWith('confs:') || data.startsWith('confa:') || data.startsWith('confd:')) {
            const [, msgId, nombreKV, temporada, episodio] = data.split(':');
            const fileId = await env.PELICULAS_KV.get(`cola:${msgId}`);

            if (!fileId) {
                await fetch(`${BOT_API}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: '❌ Video ya no está en cola.' })
                });
                return new Response('OK');
            }

            await env.PELICULAS_KV.put(`video:${nombreKV}:${temporada}:${episodio}`, fileId);
            await env.PELICULAS_KV.delete(`cola:${msgId}`);

            await fetch(`${BOT_API}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId, message_id: messageId,
                    text: `✅ *${nombreKV}* T${temporada}E${episodio} guardado!`,
                    parse_mode: 'Markdown'
                })
            });
        }

        if (data.startsWith('cancel:')) {
            const [, msgId, catalogoTipo, nombreKV] = data.split(':');
            await env.PELICULAS_KV.delete(`cola:${msgId}`);

            // Si el video venía de una ficha que el bot agregó solo, la sacamos
            // también del catálogo (deshacer todo, no solo el video)
            if (catalogoTipo && catalogoTipo !== 'none' && nombreKV && KV_KEY_POR_TIPO[catalogoTipo]) {
                try {
                    const kvKey = KV_KEY_POR_TIPO[catalogoTipo];
                    const raw = await env.PELICULAS_KV.get(kvKey);
                    const catalogo = raw ? JSON.parse(raw) : [];
                    const idx = catalogo.findIndex(p => p.nombreKV === nombreKV);
                    if (idx !== -1) {
                        catalogo.splice(idx, 1);
                        await env.PELICULAS_KV.put(kvKey, JSON.stringify(catalogo));
                    }
                } catch (e) { /* si falla la limpieza del catálogo, al menos ya se borró la cola */ }
            }

            await fetch(`${BOT_API}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: '❌ Cancelado, no se guardó nada.' })
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
        // Usuario común (no el admin): cualquier cosa que escriba, le mostramos
        // el botón grande y visible para abrir la Mini App, en vez de depender
        // de que note el botón chiquito de abajo o que sepa escribir /start.
        await fetch(`${BOT_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: '🎬 *¡Bienvenido a NovaPlay!*\n\nTocá el botón de abajo para ver el catálogo completo de películas, series, anime y más 👇',
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🍿 Ver Cartelera', web_app: { url: 'https://cine-demov2.pages.dev/' } }
                    ]]
                }
            })
        });
        return new Response('OK');
    }

    if (msg.video || msg.document) {
        const fileId = msg.video?.file_id || msg.document?.file_id;
        await env.PELICULAS_KV.put('temp:file_id', fileId, { expirationTtl: 300 });
        await enviar(`✅ Video recibido!\n\nAhora usá:\n/asignar serie kiralik-ask 1 1\n/asignar pelicula matrix 1`);
        return new Response('OK');
    }

    if (texto.startsWith('/start')) {
        await enviar(`👋 *Bot Admin NovaPlay*\n\n*Automático:*\nSubí el video al canal. Si reconozco el título (serie, anime o dorama) te muestro botones para Confirmar, Corregir o Cancelar.\n\n*Manual:*\n/asignar serie nombre temp ep [id]\n/asignar pelicula nombre parte [id]\n\n*Ver/corregir auto-agregada:*\n/listarcatalogo pelicula|serie|anime|dorama\n/vercatalogo pelicula|serie|anime|dorama nombre\n/corregir pelicula|serie|anime|dorama nombre campo valor\n(campos: titulo, tmdbQuery, generos, info, desc)\n/borrarcatalogo pelicula|serie|anime|dorama nombre\n\n*Link externo:*\n/agregar serie nombre temp ep url\n/agregar pelicula nombre parte url\n\n*Consultar:*\n/ver serie|anime|dorama|turca|rusa nombre temp ep\n/listar nombre\n\n*Borrar video:*\n/borrar serie|anime|dorama|turca|rusa nombre temp ep\n/borrar pelicula nombre parte`);
        return new Response('OK');
    }

    const partes = texto.split(' ');
    const cmd    = partes[0];

    if (cmd === '/corregir') {
        // /corregir pelicula|serie nombreKV campo valor con espacios...
        const tipo = partes[1];
        const nombreKV = partes[2];
        const campo = partes[3];
        const valor = partes.slice(4).join(' ');
        const kvKey = KV_KEY_POR_TIPO[tipo];

        if (!TIPOS_CATALOGO_VALIDOS.includes(tipo) || !nombreKV || !campo || !valor) {
            await enviar(`Uso: /corregir pelicula|serie|anime|dorama nombreKV campo valor\n\nCampos válidos: titulo, tmdbQuery, generos, info, desc\n\nEjemplo:\n/corregir pelicula shaitaan tmdbQuery Shaitaan 2024\n/corregir serie rancho-dutton generos drama,western-serie`);
            return new Response('OK');
        }

        const camposValidos = ['titulo', 'tmdbQuery', 'generos', 'info', 'desc'];
        if (!camposValidos.includes(campo)) {
            await enviar(`❌ Campo inválido. Usá uno de: ${camposValidos.join(', ')}`);
            return new Response('OK');
        }

        try {
            const raw = await env.PELICULAS_KV.get(kvKey);
            const catalogo = raw ? JSON.parse(raw) : [];
            const idx = catalogo.findIndex(p => p.nombreKV === nombreKV);

            if (idx === -1) {
                await enviar(`❌ No encontré "${nombreKV}" en el catálogo de ${tipo}.`);
                return new Response('OK');
            }

            // 'generos' es un array: admite varios separados por coma (ej: terror,suspenso)
            catalogo[idx][campo] = campo === 'generos' ? valor.split(',').map(g => g.trim()) : valor;
            await env.PELICULAS_KV.put(kvKey, JSON.stringify(catalogo));
            await enviar(`✅ Corregido "${nombreKV}" → ${campo}: ${valor}`);
        } catch (e) {
            await enviar(`❌ Error al corregir: ${e.message}`);
        }
        return new Response('OK');
    }

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
        const categoriasEpisodio = ['serie', 'anime', 'dorama', 'turca', 'rusa'];
        let key, label;
        if (categoriasEpisodio.includes(tipo)) { const [,, n, t, e] = partes; key = `video:${n}:${t}:${e}`; label = `${n} T${t}E${e}`; }
        else if (tipo === 'pelicula') { const [,, n, p] = partes; key = `video:${n}:${p}`; label = `${n} parte ${p}`; }
        const val = await env.PELICULAS_KV.get(key);
        await enviar(val ? `✅ *${label}*\n${val}` : `❌ No encontrado: ${label}`);
        return new Response('OK');
    }

    if (cmd === '/listarcatalogo') {
        // /listarcatalogo pelicula|serie|anime|dorama → lista TODO lo que el bot agregó solo
        const tipo = partes[1];
        if (!TIPOS_CATALOGO_VALIDOS.includes(tipo)) {
            await enviar(`Uso: /listarcatalogo ${TIPOS_CATALOGO_VALIDOS.join('|')}`);
            return new Response('OK');
        }
        const kvKey = KV_KEY_POR_TIPO[tipo];
        const raw = await env.PELICULAS_KV.get(kvKey);
        const catalogo = raw ? JSON.parse(raw) : [];
        if (!catalogo.length) {
            await enviar(`📋 Todavía no hay ${tipo} auto-agregadas.`);
            return new Response('OK');
        }
        // Telegram corta mensajes muy largos, así que mandamos de a 25
        const LOTE = 25;
        for (let i = 0; i < catalogo.length; i += LOTE) {
            const bloque = catalogo.slice(i, i + LOTE);
            let resp = i === 0 ? `📋 *Auto-agregadas* (${catalogo.length} en total)\n\n` : '';
            bloque.forEach(p => { resp += `🔑 ${p.nombreKV} → ${p.titulo}\n`; });
            await enviar(resp);
        }
        await enviar(`Para ver el detalle de una: /vercatalogo ${tipo} nombreKV`);
        return new Response('OK');
    }

    if (cmd === '/vercatalogo') {
        // /vercatalogo pelicula|serie|anime|dorama nombreKV → muestra la ficha completa tal cual quedó guardada
        const tipo = partes[1];
        const nombreKV = partes[2];
        if (!TIPOS_CATALOGO_VALIDOS.includes(tipo) || !nombreKV) {
            await enviar(`Uso: /vercatalogo ${TIPOS_CATALOGO_VALIDOS.join('|')} nombreKV`);
            return new Response('OK');
        }
        const kvKey = KV_KEY_POR_TIPO[tipo];
        const raw = await env.PELICULAS_KV.get(kvKey);
        const catalogo = raw ? JSON.parse(raw) : [];
        const peli = catalogo.find(p => p.nombreKV === nombreKV);
        if (!peli) {
            await enviar(`❌ No encontré "${nombreKV}" en el catálogo auto-agregado.\n(Si la agregaste vos a mano en el data-*.js, no va a aparecer acá — esto solo lista lo que agregó el bot solo.)`);
            return new Response('OK');
        }
        await enviar(`📋 *${peli.titulo}*\n\n🔑 nombreKV: ${peli.nombreKV}\n🔎 tmdbQuery: ${peli.tmdbQuery}\n📁 generos: ${(peli.generos || []).join(', ')}\nℹ️ info: ${peli.info}\n📝 desc: ${peli.desc}\n\nPara borrarla: /borrarcatalogo ${tipo} ${peli.nombreKV}`);
        return new Response('OK');
    }

    if (cmd === '/borrarcatalogo') {
        // /borrarcatalogo pelicula|serie|anime|dorama nombreKV → saca la ficha del catálogo (no borra el video en sí)
        const tipo = partes[1];
        const nombreKV = partes[2];
        if (!TIPOS_CATALOGO_VALIDOS.includes(tipo) || !nombreKV) {
            await enviar(`Uso: /borrarcatalogo ${TIPOS_CATALOGO_VALIDOS.join('|')} nombreKV`);
            return new Response('OK');
        }
        const kvKey = KV_KEY_POR_TIPO[tipo];
        const raw = await env.PELICULAS_KV.get(kvKey);
        const catalogo = raw ? JSON.parse(raw) : [];
        const idx = catalogo.findIndex(p => p.nombreKV === nombreKV);
        if (idx === -1) {
            await enviar(`❌ No encontré "${nombreKV}" en el catálogo auto-agregado.`);
            return new Response('OK');
        }
        catalogo.splice(idx, 1);
        await env.PELICULAS_KV.put(kvKey, JSON.stringify(catalogo));
        await enviar(`🗑️ Saqué "${nombreKV}" del catálogo.\n\n(El video en sí sigue guardado — si también querés borrarlo con /borrar)`);
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
        const categoriasEpisodio = ['serie', 'anime', 'dorama', 'turca', 'rusa'];
        let key, label;

        if (categoriasEpisodio.includes(tipo)) {
            const [,, n, t, e] = partes;
            if (!n || !t || !e) {
                await enviar(`Uso: /borrar ${tipo} nombreKV temporada episodio\nEj: /borrar anime solo-leveling 1 10\n(temporada y episodio van como número solo, sin la T ni la E)`);
                return new Response('OK');
            }
            key = `video:${n}:${t}:${e}`;
            label = `${n} T${t}E${e}`;
        } else if (tipo === 'pelicula') {
            const [,, n, p] = partes;
            if (!n || !p) {
                await enviar('Uso: /borrar pelicula nombreKV parte\nEj: /borrar pelicula john-wick 1');
                return new Response('OK');
            }
            key = `video:${n}:${p}`;
            label = `${n} parte ${p}`;
        } else {
            await enviar('Uso: /borrar serie|pelicula|anime|dorama|turca|rusa nombreKV temp ep (o parte si es película)');
            return new Response('OK');
        }

        await env.PELICULAS_KV.delete(key);
        await enviar(`🗑️ Borrado: ${label}`);
        return new Response('OK');
    }

    if (cmd === '/borrarraw') {
        // Para claves con espacios que /borrar no puede reconstruir (ej: nombreKV mal cargado)
        // Uso: /borrarraw video:Una parte de mí:1:19
        const key = texto.slice('/borrarraw '.length).trim();
        if (!key) {
            await enviar('❓ Uso: /borrarraw video:NombreExacto:temp:ep');
            return new Response('OK');
        }
        const existia = await env.PELICULAS_KV.get(key);
        await env.PELICULAS_KV.delete(key);
        await enviar(existia ? `🗑️ Borrado: \`${key}\`` : `⚠️ Esa clave no existía: \`${key}\``);
        return new Response('OK');
    }

    await enviar('❓ Comando no reconocido. Escribí /start');
    return new Response('OK');

    } catch (error) {
        await avisarAdmin('❌ ERROR en bot.js:\n' + (error?.stack || error?.message || String(error)));
        return new Response('OK'); // devolvemos OK para que Telegram no reintente en loop
    }
}
