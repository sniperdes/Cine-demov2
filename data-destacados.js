// ─── DESTACADOS ─────────────────────────────────────────────────────────────
// Edita estas listas para cambiar qué aparece en "Tendencias" y en el banner
// grande de arriba. El poster se busca solo en TMDB, no hace falta subir imágenes.
//
// Cada item es: { q: 'Nombre del título Año', tipo: 'movie' }  → para películas
//            o: { q: 'Nombre del título Año', tipo: 'tv' }     → para series
//
// Importante: el título debe existir en TMDB con ese nombre y año exactos,
// y el 'tipo' debe coincidir (una serie puesta como 'movie' no va a mostrar poster).

const titulosTendencias = [
    { q: 'Inception 2010',        tipo: 'movie' },
    { q: 'The Dark Knight 2008',  tipo: 'movie' },
    { q: 'Titanic 1997',          tipo: 'movie' },
    { q: 'Avatar 2009',           tipo: 'movie' },
    { q: 'The Avengers 2012',     tipo: 'movie' }
];

const titulosBanner = [
    { q: 'Asi 2007',        tipo: 'tv' },
    { q: 'Kiralik Ask 2015',   tipo: 'tv' },
    { q: 'La La Land 2016',          tipo: 'movie' },
    { q: 'Get Out 2017',             tipo: 'movie' },
    { q: 'Spider-Man No Way Home',   tipo: 'movie' }
];
