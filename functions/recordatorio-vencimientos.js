// /functions/recordatorio-vencimientos.js
// GET /recordatorio-vencimientos?secret=TU_SECRETO
//
// Cloudflare Pages Functions no soporta Cron Triggers nativos (eso es solo para
// Workers "sueltos"), así que este endpoint queda protegido por un secreto y lo
// dispara un cron EXTERNO una vez al día — por ejemplo cron-job.org o un GitHub
// Action con "schedule". Configurá la variable de entorno CRON_SECRET en
// Cloudflare Pages (Settings → Environment variables) con un valor random largo,
// y usá esa misma URL con ?secret=... en el cron externo.
//
// Avisa a los usuarios cuyo Premium vence en los próximos 3 días, una sola vez
// por ciclo (usa el flag "avisoEnviado" para no repetir el mensaje cada día).

const DIAS_ANTES_DE_AVISAR = 3;

export async function onRequest(context) {
    const { request, env } = context;

    const url = new URL(request.url);
    if (url.searchParams.get('secret') !== env.CRON_SECRET) {
        return new Response('No autorizado', { status: 401 });
    }

    const BOT_API = `https://api.telegram.org/bot${env.BOT_TOKEN}`;
    const now = Date.now();
    const limite = now + DIAS_ANTES_DE_AVISAR * 24 * 60 * 60 * 1000;

    let avisados = 0;
    let cursor;

    try {
        do {
            const lista = await env.PELICULAS_KV.list({ prefix: 'sub:', cursor });
            cursor = lista.cursor;

            for (const key of lista.keys) {
                const raw = await env.PELICULAS_KV.get(key.name);
                if (!raw) continue;
                const sub = JSON.parse(raw);

                const yaVencido = sub.expiraEn <= now;
                const proximoAVencer = sub.expiraEn > now && sub.expiraEn <= limite;

                if (!sub.activo || sub.avisoEnviado || (!proximoAVencer && !yaVencido)) continue;

                const userId = key.name.replace('sub:', '');
                const fechaTexto = new Date(sub.expiraEn).toLocaleDateString('es-AR');
                const texto = yaVencido
                    ? `⏳ Tu Premium de NovaPlay venció el ${fechaTexto}. Renovalo cuando quieras desde la sección Premium de la app 💎`
                    : `⏳ Tu Premium de NovaPlay vence el ${fechaTexto}. Renovalo para seguir sin anuncios 💎`;

                try {
                    await fetch(`${BOT_API}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: userId, text: texto }),
                    });
                    sub.avisoEnviado = true;
                    await env.PELICULAS_KV.put(key.name, JSON.stringify(sub));
                    avisados++;
                } catch (e) {
                    // si falla el envío a un usuario puntual (bloqueó el bot, etc.), seguimos con el resto
                }
            }
        } while (cursor);

        return new Response(JSON.stringify({ ok: true, avisados }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
