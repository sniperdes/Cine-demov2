// /functions/catalogo.js
// Devuelve el catálogo dinámico (agregado automáticamente por el bot) por tipo

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

    const url  = new URL(request.url);
    const tipo = url.searchParams.get('tipo') || 'peliculas';

    try {
        const raw = await env.PELICULAS_KV.get(`catalogo:${tipo}`);
        const catalogo = raw ? JSON.parse(raw) : [];
        return new Response(JSON.stringify(catalogo), { headers: corsHeaders });
    } catch (e) {
        return new Response(JSON.stringify([]), { headers: corsHeaders });
    }
}
