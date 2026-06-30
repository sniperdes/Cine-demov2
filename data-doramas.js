// ─── BASE DE DATOS DORAMAS ───────────────────────────────────────────────
        const baseDeDatosDoramas = [
            // ROMANCE
            { titulo:'Crash Landing on You',   tmdbQuery:'Crash Landing on You 2019',  genero:'dorama-romance', info:'⭐ 8.7 | 🌸 Dorama | 📺 16 ep', desc:'Una heredera surcoreana aterriza accidentalmente en Corea del Norte.' },
            { titulo:'Goblin',                  tmdbQuery:'Guardian The Lonely and Great God 2016', genero:'dorama-romance', info:'⭐ 8.7 | 🌸 Dorama | 📺 16 ep', desc:'Un goblin inmortal busca a su novia para poner fin a su existencia.' },
            { titulo:'My Love from the Star',   tmdbQuery:'My Love from the Star 2013', genero:'dorama-romance', info:'⭐ 8.3 | 🌸 Dorama | 📺 21 ep', desc:'Un alienígena que llegó a la Tierra 400 años atrás se enamora de una actriz.' },
            { titulo:'Boys Over Flowers',       tmdbQuery:'Boys Over Flowers 2009',     genero:'dorama-romance', info:'⭐ 7.9 | 🌸 Dorama | 📺 25 ep', desc:'Una chica humilde ingresa a una escuela de élite y se enamora.' },
            { titulo:'Descendants of the Sun',  tmdbQuery:'Descendants of the Sun 2016', genero:'dorama-romance', info:'⭐ 8.4 | 🌸 Dorama | 📺 16 ep', desc:'Un soldado y una médica se enamoran en zona de conflicto.' },
            { titulo:'Its Okay Not to Be Okay', tmdbQuery:'Its Okay to Not Be Okay 2020', genero:'dorama-romance', info:'⭐ 8.7 | 🌸 Dorama | 📺 16 ep', desc:'Un trabajador psiquiátrico y una escritora de cuentos se enamoran.' },
            { titulo:'Vincenzo',                tmdbQuery:'Vincenzo 2021',              genero:'dorama-romance', info:'⭐ 8.8 | 🌸 Dorama | 📺 20 ep', desc:'Un abogado mafioso italo-coreano regresa a Corea.' },
            { titulo:'Weightlifting Fairy',     tmdbQuery:'Weightlifting Fairy Kim Bok-joo 2016', genero:'dorama-romance', info:'⭐ 8.5 | 🌸 Dorama | 📺 16 ep', desc:'Una halterófila se enamora de su amigo de infancia.' },
            // DRAMA
            { titulo:'Reply 1988',              tmdbQuery:'Reply 1988 2015',            genero:'dorama-drama', info:'⭐ 9.2 | 🌸 Dorama | 📺 20 ep', desc:'Cinco familias vecinas en el Seúl de 1988.' },
            { titulo:'My Mister',               tmdbQuery:'My Mister 2018',             genero:'dorama-drama', info:'⭐ 9.0 | 🌸 Dorama | 📺 16 ep', desc:'Un hombre de mediana edad y una joven con vidas difíciles se apoyan.' },
            { titulo:'Signal',                  tmdbQuery:'Signal 2016',                genero:'dorama-drama', info:'⭐ 9.0 | 🌸 Dorama | 📺 16 ep', desc:'Un detective del presente se comunica con uno del pasado.' },
            { titulo:'Kingdom',                 tmdbQuery:'Kingdom 2019',               genero:'dorama-drama', info:'⭐ 8.3 | 🌸 Dorama | 📺 12 ep', desc:'Un príncipe investiga una plaga de zombies en el Joseon medieval.' },
            { titulo:'Misaeng',                 tmdbQuery:'Misaeng Incomplete Life 2014', genero:'dorama-drama', info:'⭐ 8.9 | 🌸 Dorama | 📺 20 ep', desc:'La vida de empleados en una gran empresa coreana.' },
            { titulo:'Mother',                  tmdbQuery:'Mother Korean 2018',         genero:'dorama-drama', info:'⭐ 8.8 | 🌸 Dorama | 📺 16 ep', desc:'Una maestra rescata a una niña maltratada y huyen juntas.' },
            { titulo:'Mr Sunshine',             tmdbQuery:'Mr Sunshine 2018',           genero:'dorama-drama', info:'⭐ 8.7 | 🌸 Dorama | 📺 24 ep', desc:'Corea 1900: un soldado americano de origen coreano regresa a su tierra.' },
            { titulo:'Itaewon Class',           tmdbQuery:'Itaewon Class 2020',         genero:'dorama-drama', info:'⭐ 8.3 | 🌸 Dorama | 📺 16 ep', desc:'Un joven busca venganza abriendo un bar en Itaewon.' },
            // ACCIÓN
            { titulo:'Vagabond',                tmdbQuery:'Vagabond 2019',              genero:'dorama-accion', info:'⭐ 8.1 | 🌸 Dorama | 📺 16 ep', desc:'Un hombre investiga un accidente de avión que mató a su sobrino.' },
            { titulo:'Arthdal Chronicles',      tmdbQuery:'Arthdal Chronicles 2019',   genero:'dorama-accion', info:'⭐ 7.5 | 🌸 Dorama | 📺 18 ep', desc:'Épica de fantasía en una civilización antigua.' },
            { titulo:'Rugal',                   tmdbQuery:'Rugal 2020',                 genero:'dorama-accion', info:'⭐ 7.2 | 🌸 Dorama | 📺 16 ep', desc:'Un policía convertido en cyborg busca vengar a su familia.' },
            { titulo:'Healer',                  tmdbQuery:'Healer 2014',                genero:'dorama-accion', info:'⭐ 8.6 | 🌸 Dorama | 📺 20 ep', desc:'Un mensajero nocturno con habilidades de combate se convierte en guardaespaldas.' },
        ];
