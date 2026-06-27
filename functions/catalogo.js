export async function onRequest(context) {
  try {
    // 1. Intentamos leer si la lista de películas ya está cocinada en Cloudflare KV
    const cache = await context.env.PELICULAS_KV.get("lista_completa");
    if (cache) {
      return new Response(cache, { 
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }

    // 2. Si es la primera vez, el servidor de Cloudflare junta los datos directo de TMDB
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhY2Q2NTM0MmI5ODZmZjdkYWQ5MDJlYTc0MTJmYzAwMyIsIm5iZiI6MTc4MjQ4MDg3Mi45Njk5OTk4LCJzdWIiOiI2YTNlN2ZlODkwYjQ2NjA4ZmUzYjViMzgiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Et-PdA6n_O2ivehKH1nwUUXdhUG5dE6WgaEVjL1Iqm4"; // <-- PEGA TU TOKEN LARGO DE TMDB ACÁ
    
    // Lista de tus películas (Podés ir estirándola hasta las 80 separadas por comas)
    const titulos = [
      'Mad Max: Fury Road', 'Gladiador', 'Misión Imposible', 'Terminator 2', 
      'Batman: El Caballero', 'Duro de Matar', 'Matrix', 'Top Gun: Maverick'
    ];
    
    let listaAutomatica = [];

    for (let t of titulos) {
      try {
        let r = await fetch(`https://themoviedb.org{encodeURIComponent(t.trim())}&language=es-MX`, {
          headers: { 'Authorization': `Bearer ${token}`, 'accept': 'application/json' }
        });
        let res = await r.json();
        
        if (res && res.results && res.results.length > 0) {
          let m = res.results[0]; // Corregido el índice estricto del primer resultado
          listaAutomatica.push({
            titulo: t,
            genero: 'accion',
            img: m.poster_path ? `https://tmdb.org{m.poster_path}` : 'https://placeholder.com',
            info: `⭐ ${m.vote_average ? m.vote_average.toFixed(1) : '8.0'}`,
            desc: m.overview || 'Sin sinopsis disponible.',
            trailer: 'https://youtu.be', // Enlaces estáticos fijos
            peliculaUrl: 'https://tu-servidor-de-video.com'
          });
        }
      } catch(e) {
        // Ignora errores por película individual para no congelar la carga
      }
    }

    // 3. Guardamos los datos procesados en Cloudflare KV para las próximas visitas
    if (listaAutomatica.length > 0) {
      await context.env.PELICULAS_KV.put("lista_completa", JSON.stringify(listaAutomatica));
    }

    return new Response(JSON.stringify(listaAutomatica), { 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

