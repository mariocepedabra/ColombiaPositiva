import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="border-t-2 border-b-2 border-tinta py-8 mb-6 max-w-md w-full">
        <span className="font-heading font-900 text-8xl text-gris-200">404</span>
        <h1 className="font-heading font-700 text-2xl text-tinta mt-2">
          Página no encontrada
        </h1>
        <p className="font-sans text-gris-600 mt-2 text-sm leading-relaxed">
          Lo sentimos, la página que buscas no existe. Pero hay muchas historias positivas esperándote en nuestra portada.
        </p>
      </div>
      <Link
        href="/"
        className="bg-verde hover:bg-verde-oscuro text-white font-sans font-700 text-xs px-8 py-3 uppercase tracking-widest transition-colors"
      >
        Volver a la portada
      </Link>
    </div>
  );
}
