# Métricas de redes + importación automática de TikTok

Panel en `/admin/metricas`, visible **solo para el rol `admin`**. Se alimenta solo:
un proceso corre todos los días a las 3:00 a. m. (hora de Colombia), trae las cifras
de los videos y publica en la portada los videos nuevos de TikTok.

---

## Paso 1 — Ejecutar el SQL (obligatorio, una sola vez)

Sin esto el panel avisa que falta la configuración y la importación no puede correr.

1. Supabase → proyecto `hyyjxeafxccrbkxgnmcz` → **SQL Editor**
2. Pegar y ejecutar el contenido de
   [`supabase/migrations/2026-09-01_metricas_redes.sql`](supabase/migrations/2026-09-01_metricas_redes.sql)

Es **aditivo**: crea tres tablas nuevas y concede permisos. No borra ni modifica
nada existente, y no toca las políticas RLS que ya protegen la tabla `videos`.

Por qué hace falta el `GRANT`: el proceso automático no tiene sesión de usuario,
entra como `service_role`, y hoy ese rol no tiene privilegios sobre `videos`
(`42501: permission denied for table videos`). Sin el `GRANT` no puede insertar
los videos nuevos.

## Paso 2 — Variable de entorno en Vercel

En el proyecto `colombiapositiva` → Settings → Environment Variables:

| Variable      | Valor                                     |
| ------------- | ----------------------------------------- |
| `CRON_SECRET` | una cadena larga al azar, la que se quiera |

Vercel la manda como `Authorization: Bearer …` al llamar el cron, y el endpoint
rechaza cualquier llamada que no la traiga (o que no venga de un admin con sesión).

---

## Qué queda funcionando de inmediato

**TikTok — completo y gratuito.** Se leen los endpoints públicos de *embed* de
TikTok (`/embed/@usuario` y `/embed/v2/<id>`), los mismos que usa el reproductor
incrustado del sitio. No requieren llave, cuenta de desarrollador ni aprobación.

- Vistas, me gusta, comentarios y compartidos por video.
- Descubrimiento de los 10 videos más recientes del perfil. Como se publica
  alrededor de un video al día y la revisión es diaria, esa ventana es holgada.
  Los que falten se insertan **activos**, con la fecha real de publicación para
  que el carrusel de la portada quede en orden cronológico.

### Recuperar videos antiguos

Los **10 más recientes** son el máximo que TikTok entrega a quien no tiene sesión
iniciada: el perfil completo devuelve una página vacía a cualquier acceso
automatizado, y no hay endpoint público que pagine. Por eso el histórico anterior
a esa ventana no se puede descubrir solo.

Para eso está el bloque **"Importar videos antiguos de TikTok"** en `/admin/metricas`:
se pegan los enlaces y el sistema hace la comparación —descarta los que ya están
publicados e importa únicamente los que faltan, con sus métricas—. Los repetidos
se ignoran, así que se puede pegar la lista completa sin revisarla.

El panel incluye la línea que hay que ejecutar en la consola del navegador
(F12 → Console) sobre el perfil ya cargado, para copiar todos los enlaces de una vez.

## Instagram y Facebook — falta conectar la API de Meta

Meta cerró el acceso público a los contadores: la página de *embed* de Instagram
ya no expone ni likes ni vistas, así que **no existe una vía sin token que sea
estable**. La API oficial de Meta sí es **gratuita e ilimitada para las cuentas
propias**; solo hay que generar un token una vez.

Requisitos: la cuenta de Instagram debe ser **Empresa o Creador** y estar
vinculada a la página de Facebook. Al ser cuentas propias **no hace falta pasar
la revisión de app de Meta**.

1. [developers.facebook.com](https://developers.facebook.com) → crear una app (tipo *Business*).
2. En el *Graph API Explorer*, con Mario como administrador de la página, pedir los permisos
   `pages_read_engagement`, `pages_show_list`, `instagram_basic`, `instagram_manage_insights`.
3. Cambiar el token por uno de **larga duración** (60 días, renovable).
4. Cargar en Vercel:

| Variable                | Para qué                                    |
| ----------------------- | ------------------------------------------- |
| `META_ACCESS_TOKEN`     | el token de página de larga duración        |
| `INSTAGRAM_BUSINESS_ID` | id de la cuenta de Instagram Business       |
| `FACEBOOK_PAGE_ID`      | id de la página (por defecto ya viene fijo) |

Mientras no existan, el panel muestra esas dos redes como *"Pendiente de
conectar"* y todo lo demás sigue funcionando con normalidad.

---

## Archivos

| Archivo                             | Rol                                                       |
| ----------------------------------- | --------------------------------------------------------- |
| `lib/social/tiktok.ts`              | Lectura de los embeds de TikTok                            |
| `lib/social/meta.ts`                | Instagram y Facebook por Graph API (inerte sin token)      |
| `lib/social/sync.ts`                | Orquesta la sincronización diaria                          |
| `lib/social/panel.ts`               | Lectura de métricas para el panel                          |
| `app/api/cron/social-sync/route.ts` | Endpoint que dispara el cron y el botón *Sincronizar ahora* |
| `vercel.json`                       | Programación del cron (`0 8 * * *` UTC = 3:00 a. m. Colombia) |

El botón **Sincronizar ahora** del panel permite forzar una corrida sin esperar
al día siguiente.
