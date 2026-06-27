export async function onRequest(context) {
  try {
    // 1. Si la lista ya está guardada en tu base de datos KV, la enviamos al instante
    const cache = await context.env.PELICULAS_KV.get("lista_completa");
    if (cache) {
      return new Response(cache, { headers: { "Content-Type": "application/json" } });
    }

    // 2. Configuración de credenciales de TMDB
    const token = "TU_ACCESS_TOKEN_REAL_DE_TMDB_AQUÍ"; // <-- PEGA TU TOKEN LARGO ACÁ
    const titulos = [
      'John Wick', 'Mad Max: Fury Road', 'Gladiador', 'Misión Imposible', 'Terminator 2', 
      'Batman: El Caballero', 'Duro de Matar', 'Búsqueda Implacable', 'Rápidos y Furiosos', 
      'Matrix', 'Top Gun: Maverick', '300', 'Kill Bill Vol. 1', 'Inception', 
      'Deadpool', 'Logan', 'Spider-Man: No Way Home', 'Skyfall', 'The Avengers', 'Ip Man'
    ];
    
    let listaAutomatica = [];

    // 3. Bucle compacto para buscar los datos de las 20 películas
    for (let t of titulos) {
      try {
        let r = await fetch(`https://themoviedb.org{encodeURIComponent(t.trim())}&language=es-MX`, {
          headers: { 'Authorization': `Bearer ${token.trim()}`, 'accept': 'application/json' }
        });
        
        let res = await r.json();
        if (res && res.results && res.results.length > 0) {
          let m = res.results[0]; // Tomamos el primer resultado de forma estricta
          listaAutomatica.push({
            titulo: t, genero: 'accion',
            img: m.poster_path ? `https://tmdb.org{m.poster_path}` : 'https://placeholder.com',
            info: `⭐ ${m.vote_average ? m.vote_average.toFixed(1) : '8.0'}`,
            desc: m.overview || 'Sin sinopsis disponible.'
          });
        }
      } catch(e) {
        // Si una película falla, el servidor continúa con la siguiente sin trabarse
      }
    }

    // 4. Guardamos todo en Cloudflare KV para no volver a consultar a internet jamás
    if (listaAutomatica.length > 0) {
      await context.env.PELICULAS_KV.put("lista_completa", JSON.stringify(listaAutomatica));
    }

    return new Response(JSON.stringify(listaAutomatica), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
