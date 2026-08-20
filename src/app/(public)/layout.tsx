/**
 * Layout for unauthenticated / public-facing pages:
 * /login, /register, /verify, /forgot-password, /reset-password  
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center">
      {children}
    </div>
  )
}
