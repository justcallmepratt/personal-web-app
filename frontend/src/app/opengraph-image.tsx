import { ImageResponse } from 'next/og'
import { siteName, siteUrl } from '@/lib/site'

// Social preview card. It uses no request-time APIs, so Next.js renders it
// once at build time and serves the PNG as a static file (no function).
// The text is limited to the site name and host: no personal details.

export const alt = siteName
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const RED = '#C5003C'
const NEON_RED = '#FF2E57'
const TEAL = '#55EAD4'
const YELLOW = '#F3E600'
const TEXT = '#C8CDD8'
const GRID = 'rgba(30, 34, 53, 0.55)'

export default function OpenGraphImage() {
  const host = new URL(siteUrl).host
  // Long custom names shrink instead of overflowing the card.
  const nameSize = siteName.length > 28 ? 56 : siteName.length > 20 ? 72 : 88

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#000000',
          backgroundImage: `linear-gradient(${GRID} 1px, transparent 1px), linear-gradient(90deg, ${GRID} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          padding: 48,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            backgroundColor: '#0A0A10',
            border: `2px solid ${TEAL}`,
            boxShadow: `0 0 48px rgba(85, 234, 212, 0.25)`,
          }}
        >
          <div style={{ width: 10, display: 'flex', backgroundColor: RED }} />
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '44px 56px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', color: TEAL, fontSize: 26, letterSpacing: 10 }}>
                INIT: PORTFOLIO
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 14, height: 14, display: 'flex', backgroundColor: NEON_RED, marginRight: 10 }} />
                <div style={{ width: 14, height: 14, display: 'flex', backgroundColor: YELLOW, marginRight: 10 }} />
                <div style={{ width: 14, height: 14, display: 'flex', backgroundColor: TEAL }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  color: TEXT,
                  fontSize: nameSize,
                  fontWeight: 700,
                  letterSpacing: 2,
                  lineHeight: 1.1,
                  textShadow: `-4px 0 ${NEON_RED}, 4px 0 #00D4FF`,
                }}
              >
                {siteName}
              </div>
              <div style={{ display: 'flex', marginTop: 28 }}>
                <div style={{ width: 220, height: 6, display: 'flex', backgroundColor: YELLOW }} />
                <div style={{ width: 60, height: 6, display: 'flex', backgroundColor: RED, marginLeft: 12 }} />
              </div>
            </div>

            {/* Stacked, not side by side: a long host must never collide with the labels. */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', color: TEXT, fontSize: 20, letterSpacing: 6 }}>
                EXPERIENCE / PROJECTS / SKILLS / CONTACT
              </div>
              <div style={{ display: 'flex', color: YELLOW, fontSize: 34, letterSpacing: 4, marginTop: 14 }}>
                {host}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
