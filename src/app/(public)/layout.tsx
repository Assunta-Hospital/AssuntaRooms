
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* common header/nav for public pages */}
      <main>{children}</main>
      {/* maybe footer */}
    </>
  );
}
