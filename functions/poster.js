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
    const type  = url.searchParams.get('type') || 'movie'; // movie | tv

    if (!query) {
        return new Response(JSON.stringify({ error: 'Falta ?q=' }), { status: 400, headers: corsHeaders });
    }

    const cacheKey = `poster:${type}:${query.toLowerCase().trim()}`;

    // 1. Buscar en KV primero
    try {
        const cachedUrl = await env.PELICULAS_KV.get(cacheKey);
        if (cachedUrl) {
            return new Response(JSON.stringify({ poster: cachedUrl, fuente: 'kv' }), { headers: corsHeaders });
        }
    } catch {}

    // 2. Separar título y año
    const yearMatch = query.match(/^(.+?)\s+(\d{4})$/);
    const titulo    = yearMatch ? yearMatch[1].trim() : query.trim();
    const year      = yearMatch ? yearMatch[2] : null;

    // 3. Endpoint según tipo
    const TMDB_KEY      = 'acd65342b986ff7dad902ea7412fc003';
    const TMDB_ENDPOINT = type === 'tv' ? 'search/tv' : 'search/movie';
    const yearParam     = year ? (type === 'tv' ? `&first_air_date_year=${year}` : `&year=${year}`) : '';

    let tmdbData;
    try {
        const res = await fetch(`https://api.themoviedb.org/3/${TMDB_ENDPOINT}?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}${yearParam}`);
        tmdbData = await res.json();
    } catch (err) {
        return new Response(JSON.stringify({ error: 'fetch TMDB falló', detalle: err.message }), { headers: corsHeaders });
    }

    // Si no encontró con año, reintenta sin año
    if ((!tmdbData.results || tmdbData.results.length === 0) && year) {
        try {
            const res2 = await fetch(`https://api.themoviedb.org/3/${TMDB_ENDPOINT}?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}`);
            tmdbData = await res2.json();
        } catch {}
    }

    const resultado = tmdbData?.results?.find(r => r.poster_path) || tmdbData?.results?.[0];
    const posterUrl = resultado?.poster_path
        ? `https://image.tmdb.org/t/p/w500${resultado.poster_path}`
        : null;

    if (posterUrl) {
        try {
            await env.PELICULAS_KV.put(cacheKey, posterUrl, { expirationTtl: 60 * 60 * 24 * 30 });
        } catch {}
    }

    return new Response(JSON.stringify({
        poster: posterUrl,
        fuente: 'tmdb',
        total_results: tmdbData?.results?.length || 0,
        primer_resultado: resultado?.title || resultado?.name || null
    }), { headers: corsHeaders });
            }
