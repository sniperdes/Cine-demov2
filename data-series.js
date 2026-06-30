// ─── BASE DE DATOS SERIES ─────────────────────────────────────────────────
        const baseDeDatosSeries = [
            // DRAMA
            { titulo:'Breaking Bad',       tmdbQuery:'Breaking Bad 2008',      genero:'drama',        info:'⭐ 9.5 | 🎭 Drama | 📺 5 temporadas',   desc:'Un profesor de química se convierte en el mayor fabricante de metanfetamina.' },
            { titulo:'Game of Thrones',    tmdbQuery:'Game of Thrones 2011',   genero:'drama',        info:'⭐ 9.2 | 🎭 Fantasía | 📺 8 temporadas',  desc:'Familias nobles luchan por el control del Trono de Hierro.' },
            { titulo:'Peaky Blinders',     tmdbQuery:'Peaky Blinders 2013',    genero:'drama',        info:'⭐ 8.8 | 🎭 Drama | 📺 6 temporadas',   desc:'Una familia de gángsters domina Birmingham tras la Primera Guerra Mundial.' },
            { titulo:'Dark',               tmdbQuery:'Dark 2017',              genero:'drama',        info:'⭐ 8.8 | 🎭 Sci-Fi | 📺 3 temporadas',   desc:'Viajes en el tiempo y misterios en un pueblo alemán.' },
            { titulo:'Ozark',              tmdbQuery:'Ozark 2017',             genero:'drama',        info:'⭐ 8.4 | 🎭 Drama | 📺 4 temporadas',   desc:'Un contador lava dinero para un cartel mexicano.' },
            { titulo:'The Crown',          tmdbQuery:'The Crown 2016',         genero:'drama',        info:'⭐ 8.6 | 🎭 Drama | 📺 6 temporadas',   desc:'La vida de la familia real británica.' },
            { titulo:'Better Call Saul',   tmdbQuery:'Better Call Saul 2015',  genero:'drama',        info:'⭐ 9.0 | 🎭 Drama | 📺 6 temporadas',   desc:'El origen del abogado Saul Goodman.' },
            { titulo:'Succession',         tmdbQuery:'Succession 2018',        genero:'drama',        info:'⭐ 8.9 | 🎭 Drama | 📺 4 temporadas',   desc:'La familia Roy lucha por el control de un imperio mediático.' },
            { titulo:'Dexter',             tmdbQuery:'Dexter 2006',            genero:'drama',        info:'⭐ 8.6 | 🎭 Thriller | 📺 8 temporadas',  desc:'Un forense de la policía es también un asesino en serie.' },
            { titulo:'House of Cards',     tmdbQuery:'House of Cards 2013',    genero:'drama',        info:'⭐ 8.7 | 🎭 Drama | 📺 6 temporadas',   desc:'Un político manipulador asciende al poder en Washington.' },
            // COMEDIA
            { titulo:'Squid Game',         tmdbQuery:'Squid Game 2021',        genero:'comedia',      info:'⭐ 8.0 | 🎭 Thriller | 📺 2 temporadas',  desc:'Participantes en juegos mortales por una enorme suma de dinero.' },
            { titulo:'Sherlock',           tmdbQuery:'Sherlock 2010',          genero:'comedia',      info:'⭐ 9.1 | 🎭 Misterio | 📺 4 temporadas',  desc:'Sherlock Holmes en el Londres moderno.' },
            { titulo:'Black Mirror',       tmdbQuery:'Black Mirror 2011',      genero:'comedia',      info:'⭐ 8.8 | 🎭 Sci-Fi | 📺 6 temporadas',   desc:'Antología sobre el lado oscuro de la tecnología.' },
            { titulo:'Stranger Things',    tmdbQuery:'Stranger Things 2016',   genero:'comedia',      info:'⭐ 8.7 | 🎭 Sci-Fi | 📺 4 temporadas',   desc:'Un grupo de niños enfrenta fuerzas sobrenaturales en los 80.' },
            { titulo:'The Boys',           tmdbQuery:'The Boys 2019',          genero:'comedia',      info:'⭐ 8.7 | 🎭 Acción | 📺 4 temporadas',   desc:'Superhéroes corruptos enfrentados por un grupo de vigilantes.' },
            // ACCIÓN
            { titulo:'The Walking Dead',   tmdbQuery:'The Walking Dead 2010',  genero:'accion-serie', info:'⭐ 8.2 | 🎭 Terror | 📺 11 temporadas',  desc:'Sobrevivientes en un mundo post-apocalíptico lleno de zombies.' },
            { titulo:'The Witcher',        tmdbQuery:'The Witcher 2019',       genero:'accion-serie', info:'⭐ 8.2 | 🎭 Fantasía | 📺 3 temporadas',  desc:'Un cazador de monstruos en un mundo de magia y peligro.' },
            { titulo:'Narcos',             tmdbQuery:'Narcos 2015',            genero:'accion-serie', info:'⭐ 8.8 | 🎭 Crime | 📺 3 temporadas',    desc:'La historia real del narcotraficante Pablo Escobar.' },
            { titulo:'Prison Break',       tmdbQuery:'Prison Break 2005',      genero:'accion-serie', info:'⭐ 8.3 | 🎭 Acción | 📺 5 temporadas',   desc:'Un hombre se deja encarcelar para escapar con su hermano.' },
            { titulo:'24',                 tmdbQuery:'24 2001',                genero:'accion-serie', info:'⭐ 8.4 | 🎭 Acción | 📺 9 temporadas',   desc:'Jack Bauer salva al mundo en tiempo real.' },
        ];
