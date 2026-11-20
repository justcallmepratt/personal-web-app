// Purely decorative and static (no animation). `aria-hidden` keeps it out of
// the accessibility tree, `pointer-events-none` lets clicks through, and it
// contains nothing focusable.
export default function ScanlineOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        background:
          'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
      }}
    />
  )
}
