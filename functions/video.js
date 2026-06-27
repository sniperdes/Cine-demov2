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
            return new Response(JSON.stringify({ episodios: [], total: 0 }), { headers: corsHeaders });
        }

        // Organizar por temporadas
        const temporadas = {};
        for (const k of lista.keys) {
            const partes     = k.name.split(':'); // video:nombre:temporada:episodio
            const temporada  = partes[2];
            const episodio   = partes[3];
            if (!temporadas[temporada]) temporadas[temporada] = [];
            temporadas[temporada].push({
                episodio: parseInt(episodio),
                key: k.name
            });
        }

        // Ordenar episodios dentro de cada temporada
        for (const t of Object.keys(temporadas)) {
            temporadas[t].sort((a, b) => a.episodio - b.episodio);
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
