// /functions/video.js
// Devuelve los episodios disponibles de una serie o el link de una película

export async function onRequest(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const url    = new URL(request.url);
    const nombre = url.searchParams.get('nombre');
    const tipo   = url.searchParams.get('tipo') || 'serie'; // serie | pelicula

    if (!nombre) {
        return new Response(JSON.stringify({ error: 'Falta ?nombre=' }), { status: 400, headers: corsHeaders });
    }

    if (tipo === 'serie') {
        // Listar todos los episodios disponibles
        const lista = await env.PELICULAS_KV.list({ prefix: `video:${nombre}:` });

        if (!lista.keys.length) {
            return new Response(JSON.stringify({ episodios: [], temporadas: {}, total: 0 }), { headers: corsHeaders });
        }

        // Organizar por temporada -> episodio -> partes. La gran mayoría de
        // episodios tiene 1 sola parte (clave de 4 segmentos, como siempre):
        // video:nombre:temporada:episodio
        // Algunas novelas vienen partidas en varios archivos para el MISMO
        // capítulo (clave de 5 segmentos):
        // video:nombre:temporada:episodio:parte
        const agrupado = {};
        for (const k of lista.keys) {
            const segs      = k.name.split(':'); // video:nombre:temporada:episodio[:parte]
            const temporada = segs[2];
            const episodio  = parseInt(segs[3]);
            const parte     = segs[4] || '1'; // sin sufijo = una sola parte implícita

            if (!agrupado[temporada]) agrupado[temporada] = {};
            if (!agrupado[temporada][episodio]) agrupado[temporada][episodio] = [];
            agrupado[temporada][episodio].push({ parte, key: k.name });
        }

        // Convertir a arrays ordenados (temporadas[t] = [{episodio, partes, total}, ...])
        const temporadas = {};
        for (const t of Object.keys(agrupado)) {
            temporadas[t] = Object.keys(agrupado[t])
                .map(ep => {
                    const partesOrdenadas = agrupado[t][ep].sort((a, b) => parseInt(a.parte) - parseInt(b.parte));
                    return {
                        episodio: parseInt(ep),
                        key: partesOrdenadas[0].key, // compatibilidad: mismo campo "key" que antes, apunta a la parte 1
                        partes: partesOrdenadas,
                        total: partesOrdenadas.length,
                    };
                })
                .sort((a, b) => a.episodio - b.episodio);
        }

        return new Response(JSON.stringify({
            nombre,
            temporadas,
            total: lista.keys.length
        }), { headers: corsHeaders });

    } else if (tipo === 'pelicula') {
        // Listar partes disponibles
        const lista = await env.PELICULAS_KV.list({ prefix: `video:${nombre}:` });
        const partes = lista.keys.map(k => ({
            parte: k.name.split(':')[2],
            key: k.name
        }));

        return new Response(JSON.stringify({ nombre, partes, total: lista.keys.length }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'tipo inválido' }), { status: 400, headers: corsHeaders });
}
