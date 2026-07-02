// /functions/video.js
// Cruza los datos del .bat con tu archivo data-turcas.js de forma automática

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
    // GUARDADO AUTOMÁTICO INTELIGENTE (MÉTODO POST)
    // =========================================================================
    if (request.method === 'POST') {
        try {
            const data = await request.json();
            const { title, type } = data; // Recibe el título largo de tu PC

            if (!title) {
                return new Response(JSON.stringify({ error: 'Falta el titulo' }), { status: 400, headers: corsHeaders });
            }

            let textoLimpio = title.toLowerCase();
            let nombreSerie = "serie_desconocida";
            let temporada = "1";
            let episodic = "1";

            // 1. EXTRAER EL ID MEDIANTE TU BASE DE DATOS DE ALIAS
            // Definimos tu lista de series exactamente como la tienes en tu .js
            const baseDeDatosTurcas = [
                { nombreKV:'kiralik-ask', alias:['te alquilo mi amor','amor en alquiler','kiralik ask'] },
                { nombreKV:'erkenci-kus', alias:['erkenci kus','pajaro soñador'] },
                { nombreKV:'sen-cal-kapimi', alias:['sen cal kapimi','love is in the air'] }
                // Cuando agregues series nuevas en tu web, solo pon el nombreKV y sus alias aquí
            ];

            // El sistema busca solo si el título del video coincide con algún alias
            for (const serie of baseDeDatosTurcas) {
                const coincide = serie.alias.some(a => textoLimpio.includes(a));
                if (coincide) {
                    nombreSerie = serie.nombreKV; // Asigna automáticamente 'kiralik-ask'
                    break;
                }
            }

            // Si no encontró ningún alias, usa el título limpio como respaldo
            if (nombreSerie === "serie_desconocida") {
                nombreSerie = title.split('-')[0].trim().toLowerCase().replace(/\s+/g, '-');
            }

            // 2. EXTRAER TEMPORADA Y CAPÍTULO DEL TEXTO DEL .BAT
            if (title.includes('-')) {
                const regexEp = /(?:Capítulo|Capitulo|Cap|Episodio|Ep)\s*(\d+)/i;
                const matchEp = title.match(regexEp);
                if (matchEp) episodic = matchEp[1];

                const regexTemp = /(?:Temporada|Temp|T)\s*(\d+)/i;
                const matchTemp = title.match(regexTemp);
                if (matchTemp) temporada = matchTemp[1];
            }

            // 3. ARMAR LA CLAVE PARA EL KV DE CLOUDFLARE
            let kvKey = `video:${nombreSerie}:${temporada}:${episodic}`;
            if (type === 'peliculas') {
                kvKey = `video:${nombreSerie}:pelicula:1`;
            }

            // 4. GUARDAR EN TU TABLA PELICULAS_KV
            const datosGuardar = JSON.stringify({
                title: title,
                status: "disponible",
                date: new Date().toISOString()
            });

            await env.PELICULAS_KV.put(kvKey, datosGuardar);

            return new Response(JSON.stringify({ success: true, guardado_en: kvKey }), { status: 201, headers: corsHeaders });

        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
        }
    }

    // =========================================================================
    // TU LÓGICA ORIGINAL DE LECTURA (MÉTODO GET)
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
            const temp       = partes[2];
            const ep         = partes[3];
            
            if (!temp || !ep) continue; 

            if (!temporadas[temp]) temporadas[temp] = [];
            temporadas[temp].push({
                episodio: parseInt(ep) || 0,
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
