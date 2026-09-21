import Link from 'next/link'

import type { ResumenAlcance } from '@/lib/app-api/contratos'
import { getCategoryBySlug } from '@/lib/data'

// Tablas y barras del alcance de la app. Sin librerías: barras con CSS, para
// que el panel siga siendo ligero y se imprima bien.

const PLATAFORMA: Record<string, string> = { ios: 'iPhone', android: 'Android', web: 'Web' }

function n(v: number): string {
  return v.toLocaleString('es-CO')
}

function nombreSeccion(slug: string): string {
  return getCategoryBySlug(slug)?.name ?? slug
}

function Tarjeta({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gris-200 p-5">
      <h2 className="font-heading font-700 text-lg text-tinta">{titulo}</h2>
      {ayuda && <p className="font-sans text-xs text-gris-400 mb-3">{ayuda}</p>}
      <div className={ayuda ? '' : 'mt-3'}>{children}</div>
    </section>
  )
}

function Barras({ filas, max }: { filas: { etiqueta: string; valor: number; detalle?: string }[]; max: number }) {
  if (filas.length === 0) return <p className="font-sans text-sm text-gris-400 italic">Sin datos en este periodo.</p>
  return (
    <ul className="space-y-2">
      {filas.map((f) => (
        <li key={f.etiqueta} className="font-sans text-xs">
          <div className="flex justify-between gap-3 mb-1">
            <span className="text-tinta font-600 truncate">{f.etiqueta}</span>
            <span className="text-gris-600 whitespace-nowrap">
              {n(f.valor)}
              {f.detalle ? <span className="text-gris-400"> · {f.detalle}</span> : null}
            </span>
          </div>
          <div className="h-2 bg-gris-100">
            <div className="h-2" style={{ width: `${max > 0 ? Math.max(2, (f.valor / max) * 100) : 0}%`, backgroundColor: 'rgb(62, 205, 6)' }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function AlcancePanel({ resumen, desde, hasta }: { resumen: ResumenAlcance; desde: string; hasta: string }) {
  const t = resumen.totales
  const maxSeccion = Math.max(0, ...resumen.porSeccion.map((s) => s.lecturas))
  const maxCiudad = Math.max(0, ...resumen.porCiudad.map((c) => c.lecturas))
  const maxHora = Math.max(0, ...resumen.porHora.map((h) => h.lecturas))
  const maxDia = Math.max(0, ...resumen.porDia.map((d) => d.lecturas))

  // Sección × ciudad: la tabla que se le enseña a un anunciante.
  const ciudades = [...new Set(resumen.seccionCiudad.map((x) => x.ciudad))].slice(0, 8)
  const secciones = [...new Set(resumen.seccionCiudad.map((x) => x.seccion))]
  const celda = new Map(resumen.seccionCiudad.map((x) => [`${x.seccion}|${x.ciudad}`, x]))

  return (
    <div className="space-y-5">
      <p className="font-sans text-xs text-gris-400">
        Periodo: {desde} → {hasta}. Una «lectura» es una nota o una sección abierta; una «sesión» es un teléfono en un día (código al
        azar, se renueva a diario).
      </p>

      {/* Totales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { etiqueta: 'Lecturas', valor: t.lecturas },
          { etiqueta: 'Sesiones (lectores·día)', valor: t.sesiones },
          { etiqueta: 'Ciudades', valor: t.ciudades },
          { etiqueta: 'Eventos totales', valor: t.eventos },
        ].map((k) => (
          <div key={k.etiqueta} className="bg-white border border-gris-200 p-4">
            <p className="font-sans text-[11px] uppercase tracking-wider text-gris-400">{k.etiqueta}</p>
            <p className="font-heading font-700 text-2xl text-tinta mt-1">{n(k.valor)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Tarjeta titulo="Lecturas por sección">
          <Barras filas={resumen.porSeccion.map((s) => ({ etiqueta: nombreSeccion(s.seccion), valor: s.lecturas, detalle: `${n(s.sesiones)} sesiones` }))} max={maxSeccion} />
        </Tarjeta>
        <Tarjeta titulo="Lecturas por ciudad" ayuda="Ciudad aproximada que deduce la red del teléfono; no se guarda la dirección IP.">
          <Barras filas={resumen.porCiudad.map((c) => ({ etiqueta: c.region ? `${c.ciudad} (${c.region})` : c.ciudad, valor: c.lecturas, detalle: `${n(c.sesiones)} sesiones` }))} max={maxCiudad} />
        </Tarjeta>
        <Tarjeta titulo="Lecturas por hora (Colombia)">
          <Barras filas={resumen.porHora.map((h) => ({ etiqueta: `${String(h.hora).padStart(2, '0')}:00`, valor: h.lecturas }))} max={maxHora} />
        </Tarjeta>
        <Tarjeta titulo="Lecturas por día">
          <Barras filas={resumen.porDia.map((d) => ({ etiqueta: d.dia, valor: d.lecturas, detalle: `${n(d.sesiones)} sesiones` }))} max={maxDia} />
        </Tarjeta>
        <Tarjeta titulo="Plataforma">
          <Barras filas={resumen.porPlataforma.map((p) => ({ etiqueta: PLATAFORMA[p.plataforma] ?? p.plataforma, valor: p.lecturas }))} max={Math.max(0, ...resumen.porPlataforma.map((p) => p.lecturas))} />
        </Tarjeta>
        <Tarjeta titulo="Notas más leídas en la app">
          {resumen.notasMasLeidas.length === 0 ? (
            <p className="font-sans text-sm text-gris-400 italic">Sin datos en este periodo.</p>
          ) : (
            <ol className="space-y-1.5 font-sans text-xs">
              {resumen.notasMasLeidas.map((x, i) => (
                <li key={x.slug} className="flex justify-between gap-3">
                  <Link href={`/articulo/${x.slug}`} className="text-tinta hover:text-verde truncate" target="_blank">
                    {i + 1}. {x.slug}
                  </Link>
                  <span className="text-gris-600 whitespace-nowrap">{n(x.lecturas)}</span>
                </li>
              ))}
            </ol>
          )}
        </Tarjeta>
      </div>

      {/* Sección × ciudad */}
      <Tarjeta titulo="Sección × ciudad (para anunciantes)" ayuda="Lecturas · sesiones. Es la tabla que respalda «tantos lectores de tal sección en tal ciudad».">
        {secciones.length === 0 ? (
          <p className="font-sans text-sm text-gris-400 italic">Sin datos en este periodo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full font-sans text-xs">
              <thead>
                <tr className="text-left text-gris-400 uppercase tracking-wider">
                  <th className="py-2 pr-3">Sección</th>
                  {ciudades.map((c) => (
                    <th key={c} className="py-2 px-3 whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {secciones.map((s) => (
                  <tr key={s} className="border-t border-gris-100">
                    <td className="py-2 pr-3 font-600 text-tinta whitespace-nowrap">{nombreSeccion(s)}</td>
                    {ciudades.map((c) => {
                      const x = celda.get(`${s}|${c}`)
                      return (
                        <td key={c} className="py-2 px-3 text-gris-600 whitespace-nowrap">
                          {x ? (
                            <>
                              <strong className="text-tinta">{n(x.lecturas)}</strong> · {n(x.sesiones)}
                            </>
                          ) : (
                            <span className="text-gris-300">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  )
}
