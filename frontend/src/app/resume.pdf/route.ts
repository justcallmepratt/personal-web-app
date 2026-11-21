import { getResumeData, localResumeData, resumeFilename, type ResumeData } from '@/lib/resume'
import { renderResumePdf } from '@/lib/resumePdf'
import { RESUME_PATH, absoluteUrl, siteUrl } from '@/lib/site'

// The resume as a PDF at a stable address. Never a hand-made file: it is drawn
// from the same data as the /resume page (lib/resume.ts).
//
// `force-static` makes this GET handler behave like the pages: it is rendered
// at build time and served from the CDN, and re-rendered in the background at
// most once an hour, when the content API is read again. No visitor waits for
// a function, and there is no headless browser anywhere.
export const dynamic = 'force-static'
export const revalidate = 3600

function render(data: ResumeData): Uint8Array {
  return renderResumePdf(data, { siteUrl })
}

export async function GET(): Promise<Response> {
  let data: ResumeData
  let pdf: Uint8Array
  try {
    data = await getResumeData()
    pdf = render(data)
  } catch (e) {
    // Content from the API that cannot be laid out must not take the PDF down.
    console.warn(`Resume PDF: live content failed, using repo content instead. ${e}`)
    data = localResumeData()
    pdf = render(data)
  }

  return new Response(pdf as Uint8Array<ArrayBuffer>, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.byteLength),
      // Opens in the browser's viewer; saving it uses this file name.
      'Content-Disposition': `inline; filename="${resumeFilename(data.name)}"`,
      // Search engines should index the page, not this copy of it.
      Link: `<${absoluteUrl(RESUME_PATH)}>; rel="canonical"`,
    },
  })
}
