// ─── BASE DE DATOS ANIME ──────────────────────────────────────────────────
// 'generos' es un ARRAY (un anime puede estar en más de una categoría).
// Slugs válidos: accion-anime, animacion-anime, comedia-anime, crimen-anime,
// documental-anime, drama-anime, familiar-anime, misterio-anime,
// ciencia-ficcion-fantasia-anime, belica-anime, western-anime, romance-anime
// (romance-anime es categoría propia nuestra: TMDB no tiene "Romance" para TV)
        const baseDeDatosAnime = [
            { titulo:'Ore dake Level Up na Ken Solo Leveling', tmdbQuery:'solo leveling 2024', nombreKV:'solo-leveling', generos:['accion-anime','ciencia-ficcion-fantasia-anime'], info:'⭐ 9.0 | 🎌 Anime | 📺 2 temporadas', desc:'Lo que no te mata te hace más fuerte, pero en el caso de Sung Jinwoo, lo que lo mató lo hizo más fuerte. Después de ser brutalmente asesinado por monstruos en una mazmorra de alto rango, Jinwoo regresó con el Sistema, un programa que solo él puede ver y que eleva su nivel en todos los sentidos. Ahora, está decidido a descubrir los secretos detrás de sus poderes y la mazmorra que los engendró.' },
            { titulo:'De campesino cuarentón a espadachín legendario', tmdbQuery:'From Old Country Bumpkin to Master Swordsman 2025', nombreKV:'de-campesino-a-espadachin', generos:['accion-anime','comedia-anime','ciencia-ficcion-fantasia-anime'], info:'⭐ 7.5 | 🎌 Anime', desc:'Beryl Gardenant, un espadachín de mediana edad que dirige un dojo en un lugar remoto, lleva una vida tranquila, hasta que aparece Allucia, su exalumna y Comandante de la Real Orden de Caballeros, para ofrecerle ser instructor especial de su orden.' },
        ];
