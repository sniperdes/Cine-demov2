// /functions/trailer.js
// Busca el trailer de YouTube via TMDB y lo cachea en KV

const TMDB_KEY  = 'acd65342b986ff7dad902ea7412fc003';
const TMDB_BASE = 'https://api.themoviedb.org/3';

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
    const type  = url.searchParams.get('type') || 'movie';

    if (!query) {
        return new Response(JSON.stringify({ error: 'Falta ?q=' }), { status: 400, headers: corsHeaders });
    }

    const cacheKey = `trailer:${type}:${query.toLowerCase().trim()}`;

    // 1. Buscar en KV
    try {
        const cached = await env.PELICULAS_KV.get(cacheKey);
        if (cached) {
            return new Response(JSON.stringify({ youtube_key: cached, fuente: 'kv' }), { headers: corsHeaders });
        }
    } catch {}

    // 2. Separar título y año
    const yearMatch = query.match(/^(.+?)\s+(\d{4})$/);
    const titulo    = yearMatch ? yearMatch[1].trim() : query.trim();
    const year      = yearMatch ? yearMatch[2] : null;

    // 3. Buscar ID en TMDB
    const endpoint  = type === 'tv' ? 'search/tv' : 'search/movie';
    const yearParam = year ? (type === 'tv' ? `&first_air_date_year=${year}` : `&year=${year}`) : '';

    let tmdbId = null;
    try {
        const res  = await fetch(`${TMDB_BASE}/${endpoint}?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}${yearParam}`);
        const data = await res.json();
        tmdbId = data.results?.[0]?.id || null;

        // Reintentar sin año si no encontró
        if (!tmdbId && year) {
            const res2  = await fetch(`${TMDB_BASE}/${endpoint}?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}`);
            const data2 = await res2.json();
            tmdbId = data2.results?.[0]?.id || null;
        }
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Error buscando en TMDB', detalle: err.message }), { headers: corsHeaders });
    }

    if (!tmdbId) {
        return new Response(JSON.stringify({ youtube_key: null, error: 'No se encontró la película/serie' }), { headers: corsHeaders });
    }

    // 4. Buscar videos/trailers
    const videoEndpoint = type === 'tv' ? `tv/${tmdbId}/videos` : `movie/${tmdbId}/videos`;
    let youtubeKey = null;

    try {
        const res  = await fetch(`${TMDB_BASE}/${videoEndpoint}?api_key=${TMDB_KEY}&language=es-ES`);
        const data = await res.json();

        // Buscar trailer oficial en español primero
        let trailer = data.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

        // Si no hay en español, buscar en inglés
        if (!trailer) {
            const res2  = await fetch(`${TMDB_BASE}/${videoEndpoint}?api_key=${TMDB_KEY}`);
            const data2 = await res2.json();
            trailer = data2.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
                   || data2.results?.find(v => v.site === 'YouTube');
        }

        youtubeKey = trailer?.key || null;
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Error buscando trailer', detalle: err.message }), { headers: corsHeaders });
    }

    // 5. Guardar en KV si encontró
    if (youtubeKey) {
        try {
            await env.PELICULAS_KV.put(cacheKey, youtubeKey, { expirationTtl: 60 * 60 * 24 * 30 });
        } catch {}
    }

    return new Response(JSON.stringify({ youtube_key: youtubeKey, fuente: 'tmdb' }), { headers: corsHeaders });
}
