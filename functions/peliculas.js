export async function onRequest() {
  const token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhY2Q2NTM0MmI5ODZmZjdkYWQ5MDJlYTc0MTJmYzAwMyIsIm5iZiI6MTc4MjQ4MDg3Mi45Njk5OTk4LCJzdWIiOiI2YTNlN2ZlODkwYjQ2NjA4ZmUzYjViMzgiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Et-PdA6n_O2ivehKH1nwUUXdhUG5dE6WgaEVjL1Iqm4";
  const titulos = ['Mad Max: Fury Road', 'Gladiador', 'Misión Imposible', 'Terminator 2', 'Batman: El Caballero', 'Duro de Matar', 'Matrix', 'Top Gun: Maverick', '300', 'Deadpool', 'Logan', 'The Avengers'];
  let lista = [];

  for (let t of titulos) {
    try {
      let r = await fetch(`https://themoviedb.org{encodeURIComponent(t)}&language=es-MX`, {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': 'application/json' }
      });
      let res = await r.json();
      if (res.results && res.results.length > 0) {
        let m = res.results[0];
        lista.push({
          titulo: t, genero: 'accion',
          img: m.poster_path ? `https://weserv.nl{m.poster_path}` : '',
          info: `⭐ ${Math.round(m.vote_average * 10)}%`, desc: m.overview || '',
          trailer: 'https://youtu.be', peliculaUrl: 'https://tu-servidor-de-video.com'
        });
      }
    } catch(e) {}
  }
  return new Response(JSON.stringify(lista), { headers: { "Content-Type": "application/json" } });
}

