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
// BLOQUE POST: GUARDADO AUTOMÁTICO DESDE TU PC (.BAT + PYTHON)
// =========================================================================
if (request.method === 'POST') {
    try {
        const data = await request.json();
        const { title, type } = data; 

        if (!title) {
            return new Response(JSON.stringify({ error: 'Falta el titulo' }), { status: 400, headers: corsHeaders });
        }

        let textoLimpio = title.toLowerCase();
        let nombreSerie = "";
        let temporada = "1";
        let episodio = "1";

        // 1. DICCIONARIO DE ID REALES (Aquí conectamos tu .bat con tus archivos .js)
        // Buscamos si el título de YouTube contiene alguno de tus alias conocidos
        if (textoLimpio.includes("alquilo mi amor") || textoLimpio.includes("kiralik") || textoLimpio.includes("ask")) {
            nombreSerie = "kiralik-ask"; // ID exacto de tu data-turcas.js y de tu KV
        } else if (textoLimpio.includes("erkenci") || textoLimpio.includes("soñador")) {
            nombreSerie = "erkenci-kus";
        } else if (textoLimpio.includes("kapimi") || textoLimpio.includes("air")) {
            nombreSerie = "sen-cal-kapimi";
        } else {
            // Si es una serie nueva que no está en la lista, limpia el nombre con guiones medios
            nombreSerie = textoLimpio.split('-')[0].trim().replace(/\s+/g, '-');
        }

        // 2. EXTRAER EL NÚMERO DE CAPÍTULO (Busca números después de "Capítulo", "Cap" o "Ep")
        const regexEp = /(?:capítulo|capitulo|cap|ep|episodio)\s*(\d+)/i;
        const matchEp = textoLimpio.match(regexEp);
        if (matchEp) {
            episodio = matchEp[1];
        } else {
            // Si no encuentra la palabra "Capítulo", busca el primer número suelto que vea en el título
            const regexNumeroSuelto = /\b(\d+)\b/;
            const matchSuelto = textoLimpio.match(regexNumeroSuelto);
            if (matchSuelto) episodio = matchSuelto[1];
        }

        // 3. EXTRAER TEMPORADA (Si el título dice "T2" o "Temporada 2", por defecto es 1)
        const regexTemp = /(?:temporada|temp|t)\s*(\d+)/i;
        const matchTemp = textoLimpio.match(regexTemp);
        if (matchTemp) temporada = matchTemp[1];

        // 4. ARMAR LA CLAVE MAESTRA QUE TU APP LEE
        // Formato exacto: video:kiralik-ask:1:34
        let kvKey = `video:${nombreSerie}:${temporada}:${episodio}`;
        
        if (type === 'peliculas') {
            kvKey = `video:${nombreSerie}:pelicula:1`;
        }

        // 5. GUARDAR EN EL KV (Guardamos la estructura idéntica a tus claves hist...)
        const datosGuardar = JSON.stringify({
            title: title,
            status: "disponible",
            date: new Date().toISOString()
        });

        // Guardamos físicamente el capítulo en la base de datos
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
