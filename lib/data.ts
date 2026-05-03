export type Category = {
  slug: string;
  name: string;
  color: string;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: number;
  imageId: number;
  featured?: boolean;
};

export const categories: Category[] = [
  { slug: "economia", name: "Economía", color: "#1a5276" },
  { slug: "medio-ambiente", name: "Medio Ambiente", color: "#1e8449" },
  { slug: "cultura", name: "Cultura", color: "#6c3483" },
  { slug: "deporte", name: "Deporte", color: "#b7770d" },
  { slug: "ciencia", name: "Ciencia", color: "#148f77" },
  { slug: "regiones", name: "Regiones", color: "#922b21" },
];

export const articles: Article[] = [
  // FEATURED
  {
    id: "1",
    slug: "colombia-mayor-tasa-empleo-decada",
    title: "Colombia registra su mayor tasa de empleo en la última década con más de 22 millones de trabajadores activos",
    excerpt: "El DANE reveló que la tasa de ocupación alcanzó el 61,3%, impulsada por el crecimiento del sector servicios, la construcción y el turismo en todo el territorio nacional.",
    content: "El Departamento Administrativo Nacional de Estadística (DANE) anunció hoy que Colombia alcanzó la mayor tasa de empleo en los últimos diez años, con más de 22 millones de trabajadores activos en el mercado laboral formal. Este hito representa un avance significativo en la recuperación económica del país y se atribuye principalmente al crecimiento sostenido del sector servicios, el auge del turismo internacional y la reactivación de la construcción en las principales ciudades.\n\nEl ministro de Hacienda destacó que este resultado refleja las políticas de formalización laboral implementadas en los últimos años, que han logrado incorporar a cientos de miles de colombianos al sistema de seguridad social. Ciudades como Medellín, Cali y Barranquilla lideraron el crecimiento en generación de empleo, con nuevas industrias tecnológicas y de servicios que absorben cada vez más talento humano calificado.\n\nLos expertos señalan que la consolidación de este crecimiento dependerá de mantener la estabilidad macroeconómica y continuar con las inversiones en educación técnica y formación profesional que el país ha venido priorizando en los últimos años.",
    category: "economia",
    author: "María Fernanda López",
    publishedAt: "2026-05-03T08:00:00Z",
    readTime: 5,
    imageId: 11,
    featured: true,
  },
  {
    id: "2",
    slug: "colombia-reforesta-50000-hectareas-amazonia",
    title: "Colombia reforesta 50.000 hectáreas en la Amazonía en el mayor proyecto ambiental de su historia",
    excerpt: "La iniciativa, liderada por el Ministerio de Ambiente y apoyada por 15 países, convierte a Colombia en referente global de restauración ecosistémica.",
    content: "En una ceremonia histórica realizada en el departamento del Caquetá, el gobierno colombiano anunció la exitosa reforestación de 50.000 hectáreas en la Amazonía colombiana, el proyecto ambiental más ambicioso en la historia del país.\n\nLa iniciativa contó con el apoyo técnico y financiero de 15 países y organizaciones internacionales, y permitió restaurar ecosistemas degradados y crear corredores biológicos que favorecen la biodiversidad de la región. Más de 3.000 familias campesinas e indígenas participaron activamente en el proceso, recibiendo capacitación y compensación económica por su labor de guardabosques.\n\nLos expertos estiman que las nuevas áreas forestales capturarán más de 2 millones de toneladas de CO2 al año, contribuyendo significativamente a los compromisos climáticos de Colombia ante la comunidad internacional.",
    category: "medio-ambiente",
    author: "Carlos Andrés Medina",
    publishedAt: "2026-05-03T09:30:00Z",
    readTime: 6,
    imageId: 21,
    featured: true,
  },
  {
    id: "3",
    slug: "egan-bernal-regresa-tour-francia-podio",
    title: "Egan Bernal regresa triunfal al Tour de Francia y asciende al podio en la etapa reina",
    excerpt: "El ciclista boyacense demostró su recuperación total al atacar en los últimos kilómetros del Alpe d'Huez y conquistar el segundo lugar de la etapa más exigente.",
    content: "En una demostración de superación humana que conmovió al mundo del deporte, Egan Bernal protagonizó uno de los regresos más emocionantes en la historia del ciclismo profesional al conquistar el podio de la etapa reina del Tour de Francia.\n\nEl campeón boyacense mostró que la determinación colombiana no tiene límites al atacar a 8 kilómetros de la cima del Alpe d'Huez, dejando atrás a varios de los favoritos y cruzando la línea de meta en segundo lugar entre el delirio de miles de aficionados colombianos presentes en las laderas de la montaña francesa.\n\nLa proeza deportiva de Bernal es aún más significativa considerando el largo proceso de rehabilitación que debió afrontar tras su accidente, y se convierte en un símbolo de la resiliencia del deporte colombiano en los escenarios mundiales.",
    category: "deporte",
    author: "Sebastián Vargas",
    publishedAt: "2026-05-03T10:00:00Z",
    readTime: 4,
    imageId: 31,
    featured: true,
  },
  {
    id: "4",
    slug: "investigadores-vacuna-dengue-colombia",
    title: "Investigadores colombianos desarrollan vacuna contra el dengue con 95% de eficacia",
    excerpt: "El equipo de la Universidad de los Andes y el Instituto Nacional de Salud logró un hito científico que beneficiará a millones de personas en América Latina.",
    content: "Un equipo de investigadores de la Universidad de los Andes y el Instituto Nacional de Salud de Colombia anunció el desarrollo exitoso de una nueva vacuna contra el dengue con una eficacia del 95% en los ensayos clínicos de fase III.\n\nEste logro científico, publicado en la revista The Lancet, representa un hito para la medicina latinoamericana y podría cambiar radicalmente la forma en que se combate esta enfermedad que afecta a millones de personas cada año en la región tropical.\n\nLa vacuna, denominada DenVax-Col, utiliza una plataforma de ARN mensajero similar a la empleada en las vacunas contra el COVID-19, pero adaptada específicamente a los cuatro serotipos del virus del dengue presentes en Colombia y el resto de América Latina. La OPS ya anunció su interés en el proceso de aprobación acelerada.",
    category: "ciencia",
    author: "Dra. Liliana Ospina",
    publishedAt: "2026-05-03T11:00:00Z",
    readTime: 7,
    imageId: 41,
    featured: true,
  },

  // ECONOMÍA
  {
    id: "5",
    slug: "exportaciones-colombianas-crecen-15",
    title: "Exportaciones colombianas crecen 15% en el primer semestre gracias al café y la tecnología",
    excerpt: "El café especial y los servicios digitales lideran el crecimiento exportador, con Colombia consolidándose como hub tecnológico de la región.",
    content: "Las exportaciones colombianas registraron un crecimiento del 15% en el primer semestre del año, impulsadas principalmente por el récord en exportaciones de café especial y el vertiginoso aumento de las exportaciones de servicios tecnológicos.\n\nSegún ProColombia, el país logró colocar sus productos en 187 mercados internacionales, con nuevos acuerdos comerciales en Asia y el Medio Oriente que abren oportunidades sin precedentes para los emprendedores colombianos.",
    category: "economia",
    author: "Andrés Patiño",
    publishedAt: "2026-05-02T08:00:00Z",
    readTime: 4,
    imageId: 51,
  },
  {
    id: "6",
    slug: "startup-colombiana-50-millones",
    title: "Startup colombiana de tecnología financiera recauda USD 50 millones para expandirse",
    excerpt: "Nequi Lab, la fintech de Medellín, anunció su ronda Serie C que la convierte en el tercer unicornio colombiano.",
    content: "Nequi Lab, una empresa de tecnología financiera fundada en Medellín, anunció la exitosa culminación de su ronda de financiación Serie C por un valor de 50 millones de dólares, lo que la convierte en el tercer unicornio colombiano.\n\nLa inversión, liderada por fondos internacionales de Silicon Valley y respaldada por el gobierno colombiano, permitirá a la startup expandir sus servicios de banca digital a ocho países latinoamericanos en los próximos 18 meses.",
    category: "economia",
    author: "Valentina Cárdenas",
    publishedAt: "2026-05-01T14:30:00Z",
    readTime: 5,
    imageId: 61,
  },
  {
    id: "7",
    slug: "turismo-colombia-record-visitantes",
    title: "Turismo en Colombia supera cifras récord con 4,5 millones de visitantes internacionales",
    excerpt: "Cartagena, Medellín y el Eje Cafetero lideran el crecimiento, con ingresos que superan por primera vez los 5.000 millones de dólares.",
    content: "ProColombia anunció que el país recibió 4,5 millones de visitantes internacionales en el último año, superando todas las proyecciones previas y consolidando a Colombia como uno de los destinos turísticos de más rápido crecimiento en el mundo.\n\nLos ingresos por turismo superaron por primera vez los 5.000 millones de dólares, generando empleos directos e indirectos para más de 800.000 colombianos en todo el territorio nacional.",
    category: "economia",
    author: "Daniela Morales",
    publishedAt: "2026-04-30T10:00:00Z",
    readTime: 4,
    imageId: 71,
  },
  {
    id: "8",
    slug: "colombia-parque-solar-record",
    title: "Colombia inaugura su parque solar más grande y supera los 3.000 MW de energía limpia",
    excerpt: "El parque solar La Loma en el Cesar suma 800 MW al sistema eléctrico nacional, acelerando la transición energética.",
    content: "El presidente de la República inauguró el parque solar La Loma, ubicado en el departamento del Cesar, con una capacidad instalada de 800 megavatios, convirtiéndose en el mayor proyecto de energía solar de Colombia y uno de los más grandes de América Latina.\n\nCon esta nueva incorporación, el país supera los 3.000 MW de capacidad instalada en fuentes renovables no convencionales, acelerando su transición hacia una matriz energética más limpia y sostenible.",
    category: "economia",
    author: "Jorge Hernández",
    publishedAt: "2026-04-29T09:00:00Z",
    readTime: 5,
    imageId: 81,
  },

  // MEDIO AMBIENTE
  {
    id: "9",
    slug: "12-nuevas-especies-sierra-nevada",
    title: "Científicos colombianos descubren 12 nuevas especies en la Sierra Nevada de Santa Marta",
    excerpt: "El hallazgo, publicado en Nature, incluye 7 especies de anfibios, 3 de reptiles y 2 de plantas endémicas de la región nevadense.",
    content: "Un equipo de biólogos del Instituto Alexander von Humboldt y la Universidad del Magdalena publicó en la revista científica Nature el descubrimiento de 12 nuevas especies de flora y fauna en la Sierra Nevada de Santa Marta, la montaña costera más alta del mundo.\n\nEntre los hallazgos destacan siete nuevas especies de anfibios, tres de reptiles y dos plantas endémicas que solo existen en este ecosistema único, reafirmando a Colombia como el segundo país más biodiverso del planeta.",
    category: "medio-ambiente",
    author: "Dr. Pedro Gómez",
    publishedAt: "2026-05-02T11:00:00Z",
    readTime: 6,
    imageId: 91,
  },
  {
    id: "10",
    slug: "bogota-corredor-verde",
    title: "Bogotá inaugura el corredor verde más largo de Latinoamérica con 22 km de ciclorruta arborizada",
    excerpt: "La Avenida Caracas se transforma en un gran bulevar verde que une el norte y el sur de la capital.",
    content: "La Alcaldía de Bogotá inauguró el corredor verde de la Avenida Caracas, un proyecto urbanístico sin precedentes en América Latina que transforma 22 kilómetros de esta importante arteria vial en un gran bulevar verde con miles de árboles nativos, ciclorrutas y espacios peatonales.\n\nEl proyecto reducirá en un 30% las emisiones de CO2 en el corredor y mejorará significativamente la calidad del aire para los más de 3 millones de bogotanos que lo utilizan a diario.",
    category: "medio-ambiente",
    author: "Sofía Ramírez",
    publishedAt: "2026-05-01T16:00:00Z",
    readTime: 4,
    imageId: 101,
  },
  {
    id: "11",
    slug: "colombia-lider-biodiversidad-aves",
    title: "Colombia ratifica su liderazgo mundial en biodiversidad de aves con 1.980 especies registradas",
    excerpt: "El último censo nacional de aves superó la cifra anterior con el registro de 47 nuevas especies.",
    content: "El más reciente censo nacional de aves confirmó que Colombia cuenta con 1.980 especies registradas, consolidando su posición como el país con mayor diversidad aviar del planeta por décimo año consecutivo.\n\nEl estudio identificó 47 nuevas especies respecto al año anterior, lo que refleja tanto la riqueza natural del territorio colombiano como el avance en las técnicas de investigación y el mayor alcance geográfico de las expediciones científicas.",
    category: "medio-ambiente",
    author: "Catalina Nieto",
    publishedAt: "2026-04-28T13:00:00Z",
    readTime: 5,
    imageId: 111,
  },
  {
    id: "12",
    slug: "reciclaje-colombia-record",
    title: "Colombia alcanza cifra récord de reciclaje con 1,2 millones de toneladas recuperadas en 2025",
    excerpt: "El programa de recicladores de oficio impulsó un crecimiento del 40% en la recuperación de materiales en todo el país.",
    content: "El Ministerio de Ambiente y Desarrollo Sostenible reveló que Colombia recuperó 1,2 millones de toneladas de materiales reciclables durante el año 2025, representando un crecimiento del 40% frente al año anterior.\n\nEste logro es resultado de la implementación del Sistema de Recolección Selectiva y Gestión de Residuos Sólidos, que formalizó y tecnificó la labor de más de 120.000 recicladores de oficio en las principales ciudades del país.",
    category: "medio-ambiente",
    author: "Tomás Acevedo",
    publishedAt: "2026-04-27T10:00:00Z",
    readTime: 4,
    imageId: 121,
  },

  // CULTURA
  {
    id: "13",
    slug: "festival-vallenato-unesco",
    title: "El Festival Vallenato de Valledupar recibe reconocimiento especial de la UNESCO por su impacto cultural",
    excerpt: "La UNESCO destacó al festival como modelo mundial de preservación del patrimonio musical vivo, con más de 200.000 asistentes en 2026.",
    content: "La Organización de las Naciones Unidas para la Educación, la Ciencia y la Cultura (UNESCO) otorgó al Festival de la Leyenda Vallenata un reconocimiento especial por ser modelo mundial en la preservación del patrimonio musical vivo.\n\nLa edición 2026 del festival batió su propio récord de asistencia con más de 200.000 personas de 45 países, consolidando al vallenato como uno de los géneros musicales con mayor proyección internacional en América Latina.",
    category: "cultura",
    author: "Ana María Díaz",
    publishedAt: "2026-05-02T15:00:00Z",
    readTime: 5,
    imageId: 131,
  },
  {
    id: "14",
    slug: "artistas-colombianos-grammy-latinos",
    title: "Artistas colombianos arrasan en los Grammy Latinos con 9 premios en una noche histórica",
    excerpt: "Shakira, Karol G y varios exponentes del vallenato llevaron a Colombia a la cima del reconocimiento musical internacional.",
    content: "Colombia vivió una noche de gloria en la ceremonia de los Grammy Latinos celebrada en Miami, donde los artistas colombianos se alzaron con 9 premios en una de las participaciones más exitosas en la historia musical del país.\n\nShakira fue reconocida con el Premio a la Excelencia Musical por su legado artístico, mientras que Karol G ganó en las categorías de Álbum del Año y Artista del Año. La presencia de talentos de géneros tan diversos como el vallenato, la música andina, el pop y el urban demostró la riqueza y versatilidad de la escena musical colombiana.",
    category: "cultura",
    author: "Juliana Bermúdez",
    publishedAt: "2026-05-01T20:00:00Z",
    readTime: 4,
    imageId: 141,
  },
  {
    id: "15",
    slug: "museo-arte-medellin",
    title: "Medellín inaugura el museo de arte contemporáneo más moderno de Latinoamérica",
    excerpt: "El Museo de Arte de Medellín estrena su nueva sede con 12.000 m² de salas de exhibición y obras de artistas de 35 países.",
    content: "La ciudad de Medellín inauguró la nueva sede del Museo de Arte de Medellín (MAM), un imponente edificio diseñado por el reconocido arquitecto colombiano Daniel Bonilla, que se convierte en el museo de arte contemporáneo más moderno de América Latina.\n\nEl edificio cuenta con 20 salas de exhibición de última generación, un auditorio para 800 personas, espacios educativos, una biblioteca especializada en arte y una colección permanente de más de 3.000 obras de artistas de 35 países.",
    category: "cultura",
    author: "Federico Restrepo",
    publishedAt: "2026-04-30T18:00:00Z",
    readTime: 5,
    imageId: 151,
  },
  {
    id: "16",
    slug: "escritora-colombiana-alfaguara",
    title: "La escritora colombiana Piedad Bonnett gana el Premio Alfaguara con su novela sobre el Caribe",
    excerpt: "La novela 'Agua de Lluvia', ambientada en La Guajira, fue seleccionada entre más de 800 manuscritos.",
    content: "La escritora colombiana Piedad Bonnett fue galardonada con el Premio Alfaguara de Novela 2026, uno de los más prestigiosos de la literatura en lengua española, por su obra 'Agua de Lluvia'.\n\nEl jurado destacó la profundidad narrativa de la obra, la belleza de su prosa y la capacidad de Bonnett para retratar la realidad social colombiana sin perder la dimensión poética de la historia ambientada en varias generaciones de una familia de pescadores de La Guajira.",
    category: "cultura",
    author: "Isabel Cano",
    publishedAt: "2026-04-29T12:00:00Z",
    readTime: 4,
    imageId: 161,
  },

  // DEPORTE
  {
    id: "17",
    slug: "colombia-sub20-clasifica-mundial",
    title: "La Selección Colombia Sub-20 clasifica al Mundial con invicto absoluto en el Sudamericano",
    excerpt: "Los dirigidos por Héctor Cárdenas arrasaron en el torneo con 7 victorias en 7 partidos, anotando 28 goles.",
    content: "La Selección Colombia Sub-20 clasificó al Campeonato Mundial de la categoría al ganar el Torneo Sudamericano Sub-20 con un invicto histórico de siete victorias en siete partidos.\n\nLos dirigidos por el técnico Héctor Cárdenas demostraron un fútbol vibrante y de altísima calidad técnica, anotando 28 goles y recibiendo solo 3, lo que los convierte en la mejor defensa y el mejor ataque del certamen de manera simultánea.",
    category: "deporte",
    author: "Juan Pablo Castro",
    publishedAt: "2026-05-02T20:00:00Z",
    readTime: 4,
    imageId: 171,
  },
  {
    id: "18",
    slug: "colombia-medallas-juegos-panamericanos",
    title: "Colombia obtiene 15 medallas en los Juegos Panamericanos, su mejor resultado histórico",
    excerpt: "Con 5 oros, 6 platas y 4 bronces, la delegación colombiana se ubicó séptima en el medallero general.",
    content: "La delegación colombiana concluyó su participación en los Juegos Panamericanos con 15 medallas en total —5 de oro, 6 de plata y 4 de bronce—, superando el récord histórico del país y ubicándose en el séptimo lugar del medallero general.\n\nLas medallas de oro llegaron desde el atletismo, el ciclismo de pista, la lucha libre, el boxeo y el tiro deportivo, reflejando la diversidad y profundidad del talento deportivo colombiano.",
    category: "deporte",
    author: "Laura Quintero",
    publishedAt: "2026-05-01T22:00:00Z",
    readTime: 5,
    imageId: 181,
  },
  {
    id: "19",
    slug: "mariana-pajon-campeonato-mundial",
    title: "Mariana Pajón regresa al BMX y gana el Campeonato Mundial por quinta vez",
    excerpt: "La 'Reina del BMX' conquistó su quinto título mundial con una final perfecta en Bogotá ante 30.000 espectadores.",
    content: "Mariana Pajón escribió otro capítulo dorado en la historia del deporte colombiano al conquistar su quinto título mundial de BMX en el Campeonato del Mundo celebrado en Bogotá, ante más de 30.000 espectadores.\n\nLa 'Reina del BMX' demostró en cada carrera que sigue siendo la más completa del mundo en esta especialidad, combinando potencia, técnica y experiencia de manera magistral.",
    category: "deporte",
    author: "Camilo Sánchez",
    publishedAt: "2026-04-30T19:00:00Z",
    readTime: 4,
    imageId: 191,
  },
  {
    id: "20",
    slug: "liga-colombiana-record-asistencia",
    title: "La Liga BetPlay alcanza cifra récord de asistencia con 5 millones de espectadores en la temporada",
    excerpt: "El crecimiento del fútbol colombiano se refleja en las tribunas, con estadios a tope en todo el país.",
    content: "La Liga BetPlay Dimayor cerró la temporada con una cifra histórica de 5 millones de espectadores en los estadios, el mejor registro en la historia del fútbol profesional colombiano.\n\nEste crecimiento del 35% frente a la temporada anterior refleja el auge del fútbol como espectáculo en Colombia, impulsado por las mejoras en infraestructura de los estadios y la calidad del juego.",
    category: "deporte",
    author: "Ricardo Torres",
    publishedAt: "2026-04-28T17:00:00Z",
    readTime: 4,
    imageId: 201,
  },

  // CIENCIA
  {
    id: "21",
    slug: "plastico-biodegradable-platano",
    title: "Universidad Nacional crea plástico biodegradable a partir de cáscaras de plátano con gran potencial industrial",
    excerpt: "El nuevo material se degrada en 6 meses, tiene la resistencia del PET convencional y puede producirse a gran escala.",
    content: "Investigadores de la Facultad de Ingeniería de la Universidad Nacional de Colombia desarrollaron un nuevo tipo de plástico biodegradable fabricado a partir de las cáscaras de plátano.\n\nEl material, denominado BioPol-Col, se degrada en condiciones naturales en un plazo de seis meses, tiene propiedades mecánicas comparables al PET convencional y puede producirse a escala industrial utilizando los desechos de las empacadoras de banano y plátano del Eje Cafetero y Urabá.",
    category: "ciencia",
    author: "Dr. Hernán Suárez",
    publishedAt: "2026-05-02T09:00:00Z",
    readTime: 6,
    imageId: 211,
  },
  {
    id: "22",
    slug: "colombia-satelite-observacion",
    title: "Colombia lanza con éxito su primer satélite de observación terrestre para monitoreo ambiental",
    excerpt: "El FACSAT-3, desarrollado por la Fuerza Aérea y la Universidad Nacional, monitorea deforestación en tiempo real.",
    content: "Colombia alcanzó un nuevo hito en su desarrollo científico con el exitoso lanzamiento del satélite FACSAT-3, el primer satélite de observación terrestre desarrollado íntegramente en el país.\n\nEl satélite comenzará a transmitir imágenes de alta resolución del territorio colombiano, permitiendo el monitoreo en tiempo real de la deforestación, los desastres naturales y los cambios en el uso del suelo.",
    category: "ciencia",
    author: "Ing. Patricia Londoño",
    publishedAt: "2026-05-01T07:00:00Z",
    readTime: 6,
    imageId: 221,
  },
  {
    id: "23",
    slug: "sinchi-compuesto-malaria",
    title: "Científicos del SINCHI descubren compuesto del Amazonas que neutraliza la resistencia a la malaria",
    excerpt: "La molécula, extraída de una planta medicinal del Vaupés, supera en eficacia a los tratamientos actuales sin efectos secundarios.",
    content: "Investigadores del Instituto Amazónico SINCHI publicaron en la revista Science el descubrimiento de una nueva molécula con propiedades antimalariales extraordinarias, extraída de una planta medicinal utilizada ancestralmente por las comunidades indígenas del Vaupés.\n\nEl compuesto, denominado Vaupesina-A, demostró ser capaz de neutralizar todas las cepas de Plasmodium falciparum resistentes a los tratamientos convencionales, sin presentar toxicidad para las células humanas sanas.",
    category: "ciencia",
    author: "Dra. Gloria Montoya",
    publishedAt: "2026-04-29T14:00:00Z",
    readTime: 7,
    imageId: 231,
  },
  {
    id: "24",
    slug: "colombia-ia-educacion",
    title: "Colombia implementa la mayor red de inteligencia artificial educativa de Latinoamérica",
    excerpt: "La plataforma EDUCA-IA llegará a 9 millones de estudiantes de educación pública con tutores virtuales personalizados.",
    content: "El Ministerio de Educación Nacional lanzó EDUCA-IA, la mayor red de inteligencia artificial aplicada a la educación pública en América Latina, que beneficiará a 9 millones de estudiantes de colegios públicos.\n\nLa plataforma, desarrollada por un consorcio de universidades colombianas, utiliza modelos de lenguaje entrenados con el currículo educativo colombiano y en las principales lenguas nativas del país.",
    category: "ciencia",
    author: "Prof. Mauricio Pineda",
    publishedAt: "2026-04-27T11:00:00Z",
    readTime: 5,
    imageId: 241,
  },

  // REGIONES
  {
    id: "25",
    slug: "medellin-ciudad-innovadora",
    title: "Medellín es elegida la ciudad más innovadora de Latinoamérica por el Centro de Innovación del MIT",
    excerpt: "Por tercer año consecutivo, la 'Ciudad de la Eterna Primavera' lidera el ranking regional gracias a su ecosistema tecnológico y cohesión social.",
    content: "El Centro de Innovación del Massachusetts Institute of Technology (MIT) publicó su ranking anual de ciudades más innovadoras del mundo, en el que Medellín ocupa el primer lugar en América Latina por tercer año consecutivo y el puesto 12 a nivel global.\n\nEl informe destaca el ecosistema de startups, la eficiencia de su sistema de transporte público integrado y los exitosos programas de inclusión social que han transformado a las comunas más vulnerables en referentes de innovación urbana.",
    category: "regiones",
    author: "Valentina Pérez",
    publishedAt: "2026-05-02T12:00:00Z",
    readTime: 5,
    imageId: 251,
  },
  {
    id: "26",
    slug: "llanos-orientales-ecoturismo",
    title: "Los Llanos Orientales se consolidan como destino de ecoturismo mundial con récord de visitantes",
    excerpt: "Casanare y Arauca recibieron 350.000 turistas internacionales, atraídos por la fauna silvestre única del Orinoco.",
    content: "Los departamentos de Casanare y Arauca recibieron 350.000 visitantes internacionales, consolidándose como uno de los destinos de ecoturismo de más rápido crecimiento en el mundo.\n\nLos visitantes de Europa, Norteamérica y Australia llegan principalmente para observar en su hábitat natural al chigüiro, el caimán del Orinoco y el majestuoso anaconda en sus causes naturales.",
    category: "regiones",
    author: "Gabriel Ortiz",
    publishedAt: "2026-05-01T10:00:00Z",
    readTime: 5,
    imageId: 261,
  },
  {
    id: "27",
    slug: "barranquilla-hub-tecnologico",
    title: "Barranquilla inaugura el primer parque tecnológico del Caribe colombiano con 5.000 empleos directos",
    excerpt: "El Hub Caribe Tech alberga ya a 120 empresas de tecnología, salud digital y economía creativa.",
    content: "La Alcaldía de Barranquilla y el gobierno nacional inauguraron el Hub Caribe Tech, el primer parque tecnológico del Caribe colombiano, con más de 120 empresas y 5.000 empleos directos.\n\nLa instalación cuenta con laboratorios de última generación, espacios de coworking, una incubadora de startups y un centro de formación tecnológica que ya capacita a jóvenes de toda la Costa Atlántica.",
    category: "regiones",
    author: "Paola Insignares",
    publishedAt: "2026-04-30T11:00:00Z",
    readTime: 4,
    imageId: 271,
  },
  {
    id: "28",
    slug: "cartagena-reduce-pobreza",
    title: "Cartagena reduce su tasa de pobreza al mínimo histórico del 28% gracias al turismo sostenible",
    excerpt: "La articulación entre el turismo, la educación técnica y los emprendimientos locales transformó los barrios populares.",
    content: "La ciudad de Cartagena de Indias alcanzó un hito social histórico al reducir su tasa de pobreza multidimensional al 28%, el nivel más bajo registrado en la historia de la ciudad.\n\nEste logro, atribuido al modelo de turismo sostenible e inclusivo, integra a las comunidades locales como protagonistas a través de emprendimientos gastronómicos, culturales y de servicios que se han convertido en referentes para visitantes de todo el mundo.",
    category: "regiones",
    author: "Nathalia Álvarez",
    publishedAt: "2026-04-28T09:00:00Z",
    readTime: 5,
    imageId: 281,
  },
];

export const breakingNews = [
  "Colombia lidera el índice de felicidad en América Latina por cuarto año consecutivo",
  "Nuevo acuerdo comercial con la Unión Europea duplica exportaciones agrícolas colombianas",
  "El Parque Nacional Los Nevados recupera el 80% de sus glaciares gracias al programa ambiental",
  "Emprendedores colombianos ganan el Premio de Innovación Social del BID 2026",
  "Colombia recibe certificación como destino turístico sostenible de la ONU",
  "La tasa de desempleo juvenil cae al mínimo histórico del 14% en el primer trimestre",
];

export function getArticlesByCategory(categorySlug: string): Article[] {
  return articles.filter((a) => a.category === categorySlug);
}

export function getFeaturedArticles(): Article[] {
  return articles.filter((a) => a.featured);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-CO", {
    month: "short",
    day: "numeric",
  });
}
