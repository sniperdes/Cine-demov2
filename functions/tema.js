// functions/tema.js
// Devuelve el tema visual vigente de la Mini App (fondo festivo).
// Modo guardado en KV 'config:tema': 'auto' (por fecha) o un tema forzado
// con /tema desde el bot. La imagen de cada tema (opcional) vive en
// 'config:tema-img:<tema>' y se pone con /temaimg.
//
// PARA AGREGAR UN DÍA NUEVO: sumá un objeto a TEMAS (slug sin espacios ni
// tildes, rango de fechas y degradé) y el mismo slug en TEMAS_FESTIVOS de
// bot.js. El frontend no hace falta tocarlo.

const TEMAS = [
    { slug: 'sanvalentin', desde: [2, 7],   hasta: [2, 14],  gradiente: 'linear-gradient(160deg,#4a0a2a 0%,#c2185b 55%,#0b0b0b 100%)' },
    { slug: 'halloween',   desde: [10, 24], hasta: [10, 31], gradiente: 'linear-gradient(160deg,#2b0a3d 0%,#7a2e00 55%,#0b0b0b 100%)' },
    { slug: 'diamuertos',  desde: [11, 1],  hasta: [11, 2],  gradiente: 'linear-gradient(160deg,#3d0a2e 0%,#c25b00 50%,#0b0b0b 100%)' },
    { slug: 'navidad',     desde: [12, 15], hasta: [12, 26], gradiente: 'linear-gradient(160deg,#0b3d1e 0%,#7a0a0a 55%,#0b0b0b 100%)' },
    { slug: 'anionuevo',   desde: [12, 27], hasta: [1, 3],   gradiente: 'linear-gradient(160deg,#1a1a3d 0%,#8a6d00 55%,#0b0b0b 100%)' },
];

function temaPorFecha() {
    // Hora de Argentina (UTC-3), para que el cambio sea a medianoche local
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const hoy = (d.getUTCMonth() + 1) * 100 + d.getUTCDate();

    for (const t of TEMAS) {
        const desde = t.desde[0] * 100 + t.desde[1];
        const hasta = t.hasta[0] * 100 + t.hasta[1];
        // Si el rango cruza el fin de año (ej: 27/12 al 3/1), desde > hasta
        const enRango = desde <= hasta
            ? (hoy >= desde && hoy <= hasta)
            : (hoy >= desde || hoy <= hasta);
        if (enRango) return t.slug;
    }
    return 'normal';
}

export async function onRequest(context) {
    const { env } = context;

    let modo = 'auto';
    try { modo = (await env.PELICULAS_KV.get('config:tema')) || 'auto'; } catch (e) {}

    let tema = modo === 'auto' ? temaPorFecha() : modo;
    const def = TEMAS.find(t => t.slug === tema);
    if (!def) tema = 'normal'; // slug desconocido o 'normal'

    let img = null;
    if (def) {
        try { img = await env.PELICULAS_KV.get(`config:tema-img:${tema}`); } catch (e) {}
    }

    return new Response(JSON.stringify({ tema, img, modo, gradiente: def ? def.gradiente : null }), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300'
        }
    });
}
