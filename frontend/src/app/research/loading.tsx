export default function ResearchLoading() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="h-8 w-56 bg-cp-border rounded animate-pulse mb-8" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="hud-clip bg-cp-panel border border-cp-border p-5 space-y-3 animate-pulse">
            <div className="h-5 w-40 bg-cp-border rounded" />
            <div className="h-3 w-24 bg-cp-border rounded" />
          </div>
        ))}
      </div>
    </section>
  )
}
