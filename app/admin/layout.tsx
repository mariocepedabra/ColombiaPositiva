export const metadata = { title: 'Panel — Colombia Positiva' }

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // El auth check vive en app/admin/(panel)/layout.tsx
  // Login y registro quedan fuera de ese grupo protegido
  return <>{children}</>
}
