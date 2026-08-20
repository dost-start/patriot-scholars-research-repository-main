/**
 * Layout for scholar-only routes (/scholar/...).
 *
 * Middleware already enforces authentication + role checks before this runs.
 */
export default async function ScholarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex flex-col">
      {children}
    </div>
  )
}
