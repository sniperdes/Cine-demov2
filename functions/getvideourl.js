// /functions/getvideourl.js
// Devuelve la URL de un episodio específico desde KV

export async function onRequest(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };

    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
        return new Response(JSON.stringify({ error: 'Falta ?key=' }), { status: 400, headers: corsHeaders });
    }

    const videoUrl = await env.PELICULAS_KV.get(key);

    return new Response(JSON.stringify({ url: videoUrl || null }), { headers: corsHeaders });
}
