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

    // 1. Buscar en KV primero
    try {
        const cachedUrl = await env.PELICULAS_KV.get(cacheKey);
        if (cachedUrl) {
            return new Response(JSON.stringify({ poster: cachedUrl, fuente: 'kv' }), { headers: corsHeaders });
        }
    } catch (kvErr) {
        // KV falló, seguimos con TMDB
    }

    // 2. Separar título y año si el query termina en 4 dígitos
    // Ejemplo: "Titanic 1997" → titulo="Titanic", year="1997"
    const yearMatch = query.match(/^(.+?)\s+(\d{4})$/);
    const titulo    = yearMatch ? yearMatch[1].trim() : query.trim();
    const year      = yearMatch ? yearMatch[2] : null;

    // 3. Llamar a TMDB con año separado
    const TMDB_BASE = 'https://api.themoviedb.org/3/search/movie';
    const TMDB_KEY  = 'acd65342b986ff7dad902ea7412fc003';

    let tmdbUrl = `${TMDB_BASE}?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}`;
    if (year) tmdbUrl += `&year=${year}`;

    let tmdbData;
    try {
        const tmdbRes = await fetch(tmdbUrl);
        tmdbData = await tmdbRes.json();
    } catch (fetchErr) {
        return new Response(JSON.stringify({ error: 'fetch a TMDB falló', detalle: fetchErr.message }), { headers: corsHeaders });
    }

    // Si con año no encontró nada, reintenta sin año
    if ((!tmdbData.results || tmdbData.results.length === 0) && year) {
        try {
            const tmdbRes2 = await fetch(`${TMDB_BASE}?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}`);
            tmdbData = await tmdbRes2.json();
        } catch {}
    }

    const resultado = tmdbData?.results?.find(r => r.poster_path) || tmdbData?.results?.[0];
    const posterUrl = resultado?.poster_path
        ? `https://image.tmdb.org/t/p/w500${resultado.poster_path}`
        : null;

    // 4. Guardar en KV si hay poster
    if (posterUrl) {
        try {
            await env.PELICULAS_KV.put(cacheKey, posterUrl, { expirationTtl: 60 * 60 * 24 * 30 });
        } catch {}
    }

    return new Response(JSON.stringify({
        poster: posterUrl,
        fuente: 'tmdb',
        total_results: tmdbData?.results?.length || 0,
        primer_resultado: resultado?.title || null
    }), { headers: corsHeaders });
}
