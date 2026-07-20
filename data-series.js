// ─── BASE DE DATOS SERIES ─────────────────────────────────────────────────
// 'generos' es un ARRAY (una serie puede estar en más de una categoría).
// Slugs válidos: accion-serie, animacion-serie, comedia, crimen-serie,
// documental-serie, drama, familiar-serie, misterio-serie,
// cienciaficcion-fantasia-serie, belica-serie, western-serie
        const baseDeDatosSeries = [
               { titulo:'The Boys',            tmdbQuery:'The Boys 2019',        generos:['accion-serie','comedia','cienciaficcion-fantasia-serie'], info:'⭐ 8.7 | 🎭 Acción | 📺 4 temporadas',   desc:'Superhéroes corruptos enfrentados por un grupo de vigilantes.' },
            { titulo:'24',                  tmdbQuery:'24 2001',              generos:['accion-serie','crimen-serie','drama','misterio-serie'], info:'⭐ 8.4 | 🎭 Acción | 📺 9 temporadas',   desc:'Jack Bauer salva al mundo en tiempo real.' },
        ];
