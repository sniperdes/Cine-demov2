// /functions/video.js
// Maneja la lectura (GET) y el guardado automático desde el .bat (POST)

export async function onRequest(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // =========================================================================
    // LÓGICA DE GUARDADO AUTOMÁTICO (MÉTODO POST) - EJECUTADO POR TU .BAT
    // =========================================================================
    if (request.method === 'POST') {
        try {
            const data = await request.json();
            const { title, type, file_id } = data; 

            if (!title) {
                return new Response(JSON.stringify({ error: 'Falta el título' }), { status: 400, headers: corsHeaders });
            }

            // 1. Procesamiento automático del título
            let nombreSerie = title.trim().toLowerCase().replace(/\s+/g, '_');
            let temporada = "1";
            let episodio = "1";

            if (title.includes('-')) {
                const partes = title.split('-');
                nombreSerie = partes[0].trim().toLowerCase().replace(/\s+/g, '_');
                
                const regexEp = /(?:Capítulo|Capitulo|Cap|Episodio|Ep)\s*(\d+)/i;
                const matchEp = title.match(regexEp);
                if (matchEp) episodio = matchEp[1];

                const regexTemp = /(?:Temporada|Temp|T)\s*(\d+)/i;
                const matchTemp = title.match(regexTemp);
                if (matchTemp) temporada = matchTemp[1];
            }

            // 2. Definimos la KEY exacta para tu base de datos
            let kvKey = `video:${nombreSerie}:${temporada}:${episodio}`;
            if (type === 'peliculas') {
                kvKey = `video:${nombreSerie}:pelicula:1`;
            }

            // 3. Generamos la URL de streaming automática de Telegram
            // Reemplaza 'TU_BOT_TOKEN' por el token real de tu bot de Telegram
            const BOT_TOKEN = "TU_BOT_TOKEN_AQUÍ";
            let urlStreaming = "";
            
            if (file_id) {
                // Si el .bat logra enviarnos el file_id, generamos el enlace directo del servidor de Telegram
                const resTelegram = await fetch(`https://telegram.org{BOT_TOKEN}/getFile?file_id=${file_id}`);
                const dataTelegram = await resTelegram.json();
                if (dataTelegram.ok) {
                    urlStreaming = `https://telegram.org{BOT_TOKEN}/${dataTelegram.result.file_path}`;
                }
            }

            // 4. Guardamos el objeto en tu KV en formato JSON plano (igual que tus claves hist...)
            const valorGuardar = JSON.stringify({
                titulo: title,
                url: urlStreaming, // Este enlace alimenta directamente a tu reproductor web
                file_id: file_id || "",
                fecha: new Date().toLocaleDateString()
            });

            await env.PELICULAS_KV.put(kvKey, valorGuardar);

            return new Response(JSON.stringify({ success: true, key_creada: kvKey }), { status: 201, headers: corsHeaders });

        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
        }
    }

    // =========================================================================
    // TU LÓGICA ORIGINAL DE LECTURA (MÉTODO GET) - SIN MODIFICACIONES
    // =========================================================================
    const url    = new URL(request.url);
    const nombre = url.searchParams.get('nombre');
    const tipo   = url.searchParams.get('tipo') || 'serie'; 

    if (!nombre) {
        return new Response(JSON.stringify({ error: 'Falta ?nombre=' }), { status: 400, headers: corsHeaders });
    }

    if (tipo === 'serie') {
        const lista = await env.PELICULAS_KV.list({ prefix: `video:${nombre}:` });

        if (!lista.keys.length) {
            return new Response(JSON.stringify({ episodios: [], total: 0 }), { headers: corsHeaders });
        }

        const temporadas = {};
        for (const k of lista.keys) {
            const partes     = k.name.split(':'); 
            const temporada  = partes[2];
            const episodio   = partes[3];
            
            if (!temporada || !episodio) continue; 

            if (!temporadas[temporada]) temporadas[temporada] = [];
            temporadas[temporada].push({
                episodio: parseInt(episodio) || 0,
                key: k.name
            });
        }

        for (const t of Object.keys(temporadas)) {
            temporadas[t].sort((a, b) => a.episodio - b.episodio);
        }

        return new Response(JSON.stringify({
            nombre,
            temporadas,
            total: lista.keys.length
        }), { headers: corsHeaders });

    } else if (tipo === 'pelicula') {
        const lista = await env.PELICULAS_KV.list({ prefix: `video:${nombre}:` });
        const partes = lista.keys.map(k => ({
            parte: k.name.split(':')[2],
            key: k.name
        }));

        return new Response(JSON.stringify({ nombre, partes, total: lista.keys.length }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'tipo inválido' }), { status: 400, headers: corsHeaders });
    }
                
