// ─── BASE DE DATOS PELÍCULAS ─────────────────────────────────────────────
// Agregá nuevas películas acá. nombreKV solo si ya subiste el video.
        const baseDeDatosPeliculas = [
            // ACCIÓN
            { titulo:'John Wick',               tmdbQuery:'John Wick 2014',            nombreKV:'john-wick', genero:'accion',   info:'⭐ 8.5 | 🎭 Acción | 🕒 101 min', desc:'Un asesino legendario vuelve del retiro para buscar venganza.' },
            { titulo:'Equipaje De Mano',         tmdbQuery:'equipaje de mano 2024',     nombreKV:'equipaje-de-mano',       genero:'accion',   info:'⭐ 6.9 |  🎭 acción | 🕒 120 min', desc:'El día de Nochebuena, un viajero misterioso chantajea a un agente de seguridad del aeropuerto para que le deje subir un objeto peligroso al avión.' },
            { titulo:'Catastrofe helada',        tmdbQuery:'Catastrofe helada 2014',           nombreKV:'catastrofe-helada',      genero:'accion', info:'⭐ 5.4 | 🕐1h 26min', desc:'Es Navidad y todo está tranquilo en un apacible pueblo mientras la nieve cubre cada rincón. Sin embargo, la tragedia empieza cuando un terrorífico meteorito se. ' },
            { titulo:'hawai en llamas',          tmdbQuery:'hawai en llamas',               nombreKV:'hawai-en-llamas', genero:'accion', info:'⭐ 5.6| 📺1h 26min', desc:'Cuando un supervolcán amenaza la isla de Hawái, un equipo de expertos debe correr contrarreloj para salvar a quienes se encuentran en el camino de la lava fundida y detenerla para siempre.' },

                
            //ciencia-ficcion
                
            { titulo:'Catastrofe helada',        tmdbQuery:'Catastrofe helada 2014',           nombreKV:'catastrofe-helada',      genero:'ciencia-ficcion', info:'⭐ 5.4 | 🕐1h 26min', desc:'Es Navidad y todo está tranquilo en un apacible pueblo mientras la nieve cubre cada rincón. Sin embargo, la tragedia empieza cuando un terrorífico meteorito se. ' },
      
           //comedia   
          { titulo:'Desmadre de padre',        tmdbQuery:'Desmadre de padre 2012',           nombreKV:'ese-es-mi-hijo',      genero:'comedia-pelicula', info:'⭐ 5.8 | 🕐1h 54min', desc:'Un padre que pretende controlar la inminente boda de su hijo se muda a vivir con él y su novia.. ' },
                
           //suspenso  
           { titulo:'paciente cero',             tmdbQuery:'paciente cero 2018',            nombreKV:'paciente-cero', genero:'suspenso', info:'⭐ 5.3 | 📺1h 27min', desc:'Tras una pandemia sin precedentes, la Humanidad ha resultado prácticamente arrasada por un virus que ha convertido a la mayor parte de la población en violentos infectados. Un hombre está capacitado para comunicarse con los infectados, una habilidad que le convierte en el punto de partida para hallar el origen de la infección y su cura.' },  
           { titulo:'La torre del infierno',     tmdbQuery:'La Tour (Lockdown Tower) 2023', nombreKV:'la-torre-del-infierno', genero:'suspenso', info:'⭐ 6.0 | 🕐1h 30min', desc:'Los habitantes de un bloque de pisos se despiertan una mañana con un niebla opaca que envuelve todo el edificio, obstruyendo puertas y ventanas y que devora a todo aquel que la traspase. Atrapados, intentarán organizarse por si mismos, pero a medida que pase el tiempo, el instinto de supervivencia sacará a relucir sus instintos más primarios.' },
           { titulo:'Alerta Amber',              tmdbQuery:'Alerta amber 2024',        nombreKV:'alerta-amber', genero:'suspenso',      info:'⭐ 6.7 | 🕐1h 30min', desc:'Un conductor de viajes compartidos se ve involuntariamente atrapado en un juego peligroso cuando su vehículo coincide con una alerta AMBER, llevando a una persecución de alto riesgo.' },    
        
           { titulo:'shaitaan',                  tmdbQuery:'shaitasn',             nombreKV:'shaitaan', genero:'suspenso', info:'⭐ 6.5| 📺2h 12min', desc:'Una historia intemporal de lucha entre el bien y el mal, con una familia que encarna las fuerzas de la rectitud y un hombre que simboliza la malevolencia.' },
                
           //documental 
           { titulo:'ABC Nunca Más',            tmdbQuery:'ABC Nunca Más ',        nombreKV:'abc-nunca-mas', genero:'documental', info:'⭐ 7.5 | ', desc:'The largest childhood tragedy in the history of Mexico, not only marked the lives of 49 families who lost their sons in the fire at the ABC child care, but that.' },
            
                
            // TERROR
            { titulo:'The Grudge',                tmdbQuery:'The Grudge',                 nombreKV:'el-grito', genero:'terror', info:'⭐ 5.9| 📺1h 32min', desc:'La aparente normalidad de la fachada de una modesta casa de Tokio oculta el horror que se encuentra en su interior. La vivienda está poseída por una violenta plaga que destruye las vidas de todos los que entran en ella.' },

            { titulo:' visitantes',                tmdbQuery:'visitantes (2014)',          nombreKV:'visitantes', genero:'terror', info:'⭐ 6.6 | 📺2h', desc:'La Dra. Ana Moreno (Kate del Castillo) es una escéptica cirujano que tras una dolorosa infancia en compañía de su madre esquizofrénica, ha logrado dejar el pasado atrás y construir una familia sólida y feliz. Su esposo, Daniel (Raúl Méndez), es un ingeniero exitoso y su pequeño hijo Sebastián (André Collín) es un hermoso niño. La familia, integrada también por la hermana de Daniel, Carla (Aurora Papile) y Rosario (Angelina Peláez), la nana, comienza a desmoronarse sorpresiva y lentamente mientras la oscuridad de tres espíritus atormentados empiezan a acecharlos tras abrirse las puertas de una misteriosa casa de muñecas. Ana tendrá que romper con su lógico mundo racional al intentar liberar a su familia de la maldición que ha caído sobre ellos, sin saber que para lograrlo, deberá tomar una trágica y terrible decisión.' },
        
            { titulo:'The Haunting in Connecticut',        tmdbQuery:'The Haunting in Connecticut',      nombreKV:'extrañas-apariciones', genero:'terror', info:'⭐ 6.3| 📺1h 32min', desc:'Tras recibir la noticia de que su hijo adolescente, Matt, tiene cáncer, Sarah y Peter Campbell deciden trasladar a toda la familia cerca de la clínica dónde Matt está siendo tratado. El lugar elegido es una imponente casa de estilo victoriano que oculta un oscuro pasado como antigua funeraria en la que sucedieron terribles acontecimientos. La familia empieza a presenciar violentos y extraños fenómenos que, al principio, asocian con el estrés provocado por la enfermedad. Pronto se darán cuenta de que se enfrentan a oscuras y terroríficas fuerzas de origen sobrenatural.' },

            { titulo:'no te muevas 2024',        tmdbQuery:'No Te Muevas 2024',      nombreKV:'no-te-muevas', genero:'terror', info:'⭐ 6.3| 📺1h 32min', desc:'Una mujer destrozada topa en un bosque apartado con un asesino que le inyecta una droga paralizante. Mientras su cuerpo sucumbe, empieza su lucha por sobrevivir.' },

            { titulo:'alucinaciones',            tmdbQuery:'alucinaciones 2018',    nombreKV:'alucinaciones', genero:'terror', info:'⭐ 5.7| 📺1h 24min', desc:'Un hombre recientemente liberado de un instituto mental hereda una mansión después de que sus padres mueren. Después de una serie de eventos perturbadores, llega a creer que está embrujado.' },
            { titulo:'ABC Nunca Más',            tmdbQuery:'ABC Nunca Más ',        nombreKV:'abc-nunca-mas', genero:'terror', info:'⭐ 7.5 | ', desc:'The largest childhood tragedy in the history of Mexico, not only marked the lives of 49 families who lost their sons in the fire at the ABC child care, but that.' },
            
                
            // ROMANCE
            { titulo:'Titanic',                  tmdbQuery:'Titanic 1997',              genero:'romance',  info:'⭐ 7.9 | 🎭 Romance | 🕒 194 min', desc:'Un amor imposible a bordo del barco más famoso.' },
            { titulo:'Diario de una Pasión',     tmdbQuery:'The Notebook 2004',         genero:'romance',  info:'⭐ 7.8 | 🎭 Romance | 🕒 123 min', desc:'La historia de Allie y Noah a través del tiempo.' },
            // AVENTURA
            { titulo:'Avatar',                   tmdbQuery:'Avatar 2009',               genero:'aventura', info:'⭐ 7.9 | 🎭 Aventura | 🕒 162 min', desc:'Explorando el planeta Pandora y sus criaturas.' },
            { titulo:'Azul Extremo 2',           tmdbQuery:'Blue Crush 2 2011',         nombreKV:'azul-extremo-2', genero:'aventura', info:'⭐ 5.3 | 🎭 Aventura | 🕒 113 min', desc:'Una joven viaja a Sudáfrica para cumplir el sueño de surf de su madre.' },  
              { titulo:'Liberen a Willy',          tmdbQuery:'Free Willy 1993',           genero:'aventura', info:'⭐ 6.8 | 🎭 Aventura | 🕒 112 min', desc:'Un niño lucha por liberar a una orca cautiva.' },
            ];
