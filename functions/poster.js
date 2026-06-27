// /functions/poster.js
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
        return new Response(JSON.stringify({ error: 'Falta ?q=' }), { status: 400, headers: corsHeaders });
    }

    const cacheKey = `poster:${query.toLowerCase().trim()}`;

    // 1. Buscar en KV
    try {
        const cachedUrl = await env.PELICULAS_KV.get(cacheKey);
        if (cachedUrl) {
            return new Response(JSON.stringify({ poster: cachedUrl, fuente: 'kv' }), { headers: corsHeaders });
        }
    } catch (kvErr) {
        return new Response(JSON.stringify({ error: 'KV falló', detalle: kvErr.message }), { headers: corsHeaders });
    }

    // 2. Llamar a TMDB
    const TMDB_URL = `https://api.themoviedb.org/3/search/movie?api_key=acd65342b986ff7dad902ea7412fc003&query=${encodeURIComponent(query)}`;

    let tmdbRes, tmdbData;
    try {
        tmdbRes  = await fetch(TMDB_URL);
        tmdbData = await tmdbRes.json();
    } catch (fetchErr) {
        return new Response(JSON.stringify({ error: 'fetch a TMDB falló', detalle: fetchErr.message }), { headers: corsHeaders });
    }

    // 3. Verificar respuesta
    if (!tmdbData.results) {
        return new Response(JSON.stringify({ error: 'TMDB no devolvió results', raw: tmdbData }), { headers: corsHeaders });
    }

    const resultado  = tmdbData.results.find(r => r.poster_path) || tmdbData.results[0];
    const posterUrl  = resultado?.poster_path
        ? `https://image.tmdb.org/t/p/w500${resultado.poster_path}`
        : null;

    // 4. Guardar en KV si hay poster
    if (posterUrl) {
        try {
            await env.PELICULAS_KV.put(cacheKey, posterUrl, { expirationTtl: 60 * 60 * 24 * 30 });
        } catch (putErr) {
            // No es fatal, seguimos
        }
    }

    return new Response(JSON.stringify({
        poster: posterUrl,
        fuente: 'tmdb',
        total_results: tmdbData.results.length,
        primer_resultado: resultado?.title || null
    }), { headers: corsHeaders });
}
