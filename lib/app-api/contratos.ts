// Contrato entre la web y la app móvil (rutas /api/app/*).
// COPIA IDÉNTICA en la app: colombia-positiva-app/src/lib/contratos.ts.
// Si cambias algo aquí, cámbialo también allá y sube `version`.

export const VERSION_CONTRATO = 6

export type SlugSeccion =
  | 'personajes'
  | 'educacion'
  | 'regiones'
  | 'economia'
  | 'cultura'
  | 'medio-ambiente'
  | 'deporte'
  | 'ciencia'

/** Nota tal como aparece en listados (sin cuerpo). */
export type NotaResumen = {
  id: string
  slug: string
  titulo: string
  bajada: string
  seccion: SlugSeccion
  autor: string
  /** ISO 8601. Toda nota muestra su fecha (lo exige Google en apps de noticias). */
  publicadoEn: string
  minutosLectura: number
  /**
   * URL ORIGINAL de la foto (Supabase Storage o Página 10), o null si no tiene.
   * La app pide cada tamaño a /api/imagen?url=…&w=…; nunca carga el original.
   */
  imagen: string | null
}

export type Anuncio = {
  id: string
  tipo: 'imagen' | 'video'
  /** URL del banner (imagen o MP4). */
  media: string
  /** Enlace de destino tal cual lo escribió el anunciante (puede venir sin https://). */
  enlace: string | null
  anunciante: string
  empresa: string | null
}

export type PlataformaVideo = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'direct'

export type VideoResumen = {
  id: string
  titulo: string
  /** URL original (red social o MP4 en Supabase). */
  url: string
  plataforma: PlataformaVideo
  /** URL lista para incrustar en un WebView (o el MP4 si es 'direct'). */
  embedUrl: string
  /** Miniatura si se conoce (hoy solo TikTok, vía métricas). */
  miniatura: string | null
  publicadoEn: string
}

export type BloqueSeccion = {
  slug: SlugSeccion
  nombre: string
  color: string
  notas: NotaResumen[]
}

export type RedSocial = 'facebook' | 'instagram' | 'tiktok'

/** Respuesta de GET /api/app/home — toda la portada en una sola petición. */
export type Portada = {
  version: typeof VERSION_CONTRATO
  /** ISO 8601: cuándo se construyó esta portada en el servidor. */
  generadoEn: string
  ticker: { titulo: string; slug: string | null }[]
  /** Últimas 10 notas: la web las rota en el centro y fija 4 a los lados. */
  principales: NotaResumen[]
  masLeidas: {
    /** 'semana' cuando ya hay vistas diarias; 'historico' = contador acumulado (como la web hoy). */
    periodo: 'semana' | 'historico'
    notas: NotaResumen[]
  }
  /** Secciones en el orden de la portada web, cada una con hasta 4 notas. */
  secciones: BloqueSeccion[]
  historias: {
    /** Interruptores del panel (visibilidad por red). */
    redes: Record<RedSocial, boolean>
    videos: VideoResumen[]
  }
  /** Anuncios activos por zona (mismos slugs de zona que la web: noticias-top, cat-<slug>-bottom, …). */
  pauta: Record<string, Anuncio[]>
  redesSociales: { red: RedSocial; url: string }[]
  enlaces: {
    sitio: string
    suscripcion: string
    pauta: string
    notaPositiva: string
    contacto: string
    privacidad: string
    /** Correo público de contacto (variable CONTACT_EMAIL en Vercel) o null. */
    correoContacto: string | null
  }
}

// ---- Hito 4: nota, sección, buscador, conteos ----

/** Respuesta de GET /api/app/nota/[slug]. */
export type NotaCompleta = NotaResumen & {
  /**
   * Cuerpo en HTML limpio: p, h2, h3, ul/ol/li, strong, em, a, blockquote,
   * figure/figcaption e img (con src ya apuntando a /api/imagen). Sin estilos
   * en línea, sin scripts. Las notas en texto plano llegan convertidas.
   */
  cuerpoHtml: string
  /** El cuerpo sin etiquetas, para "escuchar nota" (texto a voz del teléfono). */
  textoPlano: string
  /** Permalink en Página 10 si la nota llegó sindicada desde allí. */
  p10Url: string | null
  /** true = solo para suscriptores. Hoy siempre false: la web no bloquea contenido. */
  bloqueada: boolean
  /** Según el token Bearer: admin o suscripción activa pueden copiar el texto. */
  puedeCopiar: boolean
  /** "Más en {sección}": hasta 4 notas de la misma sección. */
  relacionadas: NotaResumen[]
  /** URL canónica en la web (para compartir). */
  urlWeb: string
  /** Retrato del columnista (foto de su nota más reciente) o null si la firma es institucional. */
  autorRetrato: string | null
}

/** Respuesta de GET /api/app/seccion/[slug]?pagina=1 */
export type PaginaSeccion = {
  seccion: { slug: SlugSeccion; nombre: string; color: string }
  total: number
  pagina: number
  porPagina: number
  haySiguiente: boolean
  notas: NotaResumen[]
}

/** Respuesta de GET /api/app/buscar?q= */
export type ResultadoBusqueda = {
  consulta: string
  notas: NotaResumen[]
}

/** Respuesta de GET /api/app/secciones */
export type ConteosSecciones = {
  total: number
  secciones: { slug: SlugSeccion; nombre: string; color: string; total: number }[]
}

// ---- Hito 5: sesión y cuenta ----

/** Cuerpo de POST /api/app/auth/login */
export type PeticionLogin = { email: string; password: string }

/** Cuerpo de POST /api/app/auth/refresh */
export type PeticionRefresh = { refreshToken: string }

/** Respuesta de login y refresh. Los tokens son los de Supabase Auth. */
export type SesionTokens = {
  accessToken: string
  refreshToken: string
  /** Segundos desde epoch en que caduca el accessToken. */
  expiraEn: number
}

export type RolUsuario = 'admin' | 'columnista' | 'lector'

/** Respuesta de GET /api/app/cuenta (requiere Bearer). */
export type Cuenta = {
  usuario: {
    id: string
    email: string | null
    nombre: string
    rol: RolUsuario
    /** ISO 8601: fecha de creación de la cuenta ("miembro desde"). */
    miembroDesde: string
  }
  suscripcion: {
    activa: boolean
    /** '1d' | '1m' | '6m' | '1y' | 'manual' */
    plan: string
    planNombre: string
    inicio: string | null
    /** null = indefinida (acceso de cortesía). */
    vence: string | null
  } | null
  /** Pautas enviadas con el correo de la cuenta (anunciante). */
  anunciante: { pautas: number; pagadas: number; activas: number } | null
  /** Puede copiar el texto de las notas (admin o suscripción activa). */
  puedeCopiar: boolean
}

// ---- Hito 6: videos y eventos de pauta ----

/** Respuesta de GET /api/app/videos: todos los videos activos, más recientes primero. */
export type ListaVideos = {
  generadoEn: string
  redes: Record<RedSocial, boolean>
  videos: VideoResumen[]
}

export type TipoEventoPauta = 'impresion' | 'clic'

/** Cuerpo de POST /api/app/pauta/eventos (lote). */
export type LoteEventosPauta = {
  plataforma: 'ios' | 'android'
  eventos: { anuncioId: string; zona: string; tipo: TipoEventoPauta }[]
}

// ---- Hito 7: columnistas ----

/** Un columnista, derivado de sus notas (no hay tabla de autores). */
export type ResumenAutor = {
  /** Nombre tal cual firma (es la clave: GET /api/app/autor/[nombre]). */
  nombre: string
  /** Foto de su nota más reciente con foto (URL original; la app usa /api/imagen). */
  retrato: string | null
  /** Biografía opcional (app-config/autores.json), o null. */
  bio: string | null
  totalNotas: number
  /** ISO 8601: fecha de su primera nota ("publica desde"). */
  desde: string
  ultimaNota: NotaResumen
}

/** Respuesta de GET /api/app/autores ("Otros columnistas"). */
export type Columnistas = {
  generadoEn: string
  /** El columnista de la nota más leída de la semana (o de siempre, si aún no hay vistas diarias). */
  masLeido: { periodo: 'semana' | 'historico'; autor: ResumenAutor; nota: NotaResumen } | null
  /** Quienes firman las últimas columnas, de la más reciente a la más antigua. */
  autores: ResumenAutor[]
}

/** Respuesta de GET /api/app/autor/[nombre]?pagina= */
export type PaginaAutor = {
  autor: ResumenAutor
  total: number
  pagina: number
  porPagina: number
  haySiguiente: boolean
  notas: NotaResumen[]
}

// ---- Publicar desde la app (columnistas y administradores) ----

/** Una nota propia en la lista "Mis notas" (borradores incluidos). */
export type MiNotaResumen = NotaResumen & {
  publicada: boolean
  actualizadaEn: string
}

/** Respuesta de GET /api/app/mis-notas?pagina= */
export type PaginaMisNotas = {
  total: number
  pagina: number
  porPagina: number
  haySiguiente: boolean
  notas: MiNotaResumen[]
}

/** Respuesta de GET /api/app/mis-notas/[id]: la nota tal cual se editará. */
export type MiNotaEditable = {
  id: string
  slug: string
  titulo: string
  bajada: string
  /** Cuerpo en texto plano (párrafos separados por línea en blanco) o HTML si vino de la web. */
  cuerpo: string
  seccion: SlugSeccion
  imagen: string | null
  autor: string
  publicada: boolean
  publicadoEn: string
  minutosLectura: number
}

/** Cuerpo de POST /api/app/mis-notas y PATCH /api/app/mis-notas/[id]. */
export type PeticionGuardarNota = {
  titulo: string
  bajada: string
  cuerpo: string
  seccion: SlugSeccion
  imagen: string | null
  publicar: boolean
  /** Solo los administradores pueden cambiar la firma. */
  autor?: string
}

/** Respuesta de POST /api/app/mis-notas/imagen (multipart, campo "archivo"). */
export type ImagenSubida = { url: string; ancho: number; alto: number }
