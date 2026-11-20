export const MAIN_CONTENT_ID = 'main-content'

// First focusable element on every page. Hidden off-screen until it receives
// keyboard focus, then shown above the navbar and the scanline overlay.
export default function SkipLink() {
  return (
    <a href={`#${MAIN_CONTENT_ID}`} className="skip-link">
      Skip to content
    </a>
  )
}
