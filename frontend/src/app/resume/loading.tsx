export default function ResumeLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="h-10 w-64 bg-cp-border rounded animate-pulse mb-4" />
      <div className="h-4 w-80 max-w-full bg-cp-border rounded animate-pulse mb-10" />
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 animate-pulse">
            <div className="h-4 w-32 bg-cp-border rounded" />
            <div className="h-3 w-full bg-cp-border rounded" />
            <div className="h-3 w-5/6 bg-cp-border rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
