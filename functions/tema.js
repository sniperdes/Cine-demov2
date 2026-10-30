// functions/tema.js
// Devuelve el tema visual vigente de la Mini App (fondo festivo).
// Modo guardado en KV 'config:tema': 'auto' (por fecha) o un tema forzado
// con /tema desde el bot. La imagen de cada tema (opcional) vive en
// 'config:tema-img:<tema>' y se pone con /temaimg.

const TEMAS = ['halloween', 'navidad', 'anionuevo'];

function temaPorFecha() {
    // Hora de Argentina (UTC-3), para que el cambio sea a medianoche local
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const mes = d.getUTCMonth() + 1;
    const dia = d.getUTCDate();

    if ((mes === 10 && dia >= 24) || (mes === 11 && dia <= 1)) return 'halloween';
    if (mes === 12 && dia >= 15 && dia <= 26) return 'navidad';
    if ((mes === 12 && dia >= 27) || (mes === 1 && dia <= 3)) return 'anionuevo';
    return 'normal';
}

export async function onRequest(context) {
    const { env } = context;

    let modo = 'auto';
    try { modo = (await env.PELICULAS_KV.get('config:tema')) || 'auto'; } catch (e) {}

    const tema = modo === 'auto' ? temaPorFecha() : modo;

    let img = null;
    if (TEMAS.includes(tema)) {
        try { img = await env.PELICULAS_KV.get(`config:tema-img:${tema}`); } catch (e) {}
    }

    return new Response(JSON.stringify({ tema, img, modo }), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300'
        }
    });
}
