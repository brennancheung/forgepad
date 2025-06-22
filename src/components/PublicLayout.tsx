export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <div className="flex flex-col flex-1">
        <main className="flex flex-1 items-center justify-center overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
