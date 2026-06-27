// /functions/poster.js
// Cloudflare Pages Function — cachea posters de TMDB en PELICULAS_KV

const TMDB_API_KEY = 'acd65342b986ff7dad902ea7412fc003';
const TMDB_IMG     = 'https://image.tmdb.org/t/p/w500';
const TMDB_SEARCH  = 'https://api.themoviedb.org/3/search/movie';

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

    const url   = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query) {
        return new Response(JSON.stringify({ error: 'Falta el parámetro ?q=' }), {
            status: 400, headers: corsHeaders
        });
    }

    const cacheKey = `poster:${query.toLowerCase().trim()}`;

    // 1. Buscar en KV primero (respuesta instantánea)
    const cachedUrl = await env.PELICULAS_KV.get(cacheKey);
    if (cachedUrl) {
        return new Response(JSON.stringify({ poster: cachedUrl, fuente: 'kv' }), {
            headers: corsHeaders
        });
    }

    // 2. Si no está en KV → buscar en TMDB
    try {
        // Primero busca SIN idioma para garantizar que poster_path no sea null
        const tmdbUrl = `${TMDB_SEARCH}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
        const res     = await fetch(tmdbUrl);
        const data    = await res.json();

        // Toma el primer resultado que tenga poster_path
        const resultado = data.results?.find(r => r.poster_path) || data.results?.[0];
        const posterUrl = resultado?.poster_path
            ? `${TMDB_IMG}${resultado.poster_path}`
            : null;

        if (posterUrl) {
            // Guardar en KV con TTL de 30 días
            await env.PELICULAS_KV.put(cacheKey, posterUrl, { expirationTtl: 60 * 60 * 24 * 30 });
        }

        return new Response(JSON.stringify({ poster: posterUrl, fuente: 'tmdb' }), {
            headers: corsHeaders
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Error al consultar TMDB', detalle: err.message }), {
            status: 500, headers: corsHeaders
        });
    }
}
