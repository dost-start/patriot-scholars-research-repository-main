export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#F7F9FC] p-8 lg:p-12">
      {children}
    </div>
  );
}
