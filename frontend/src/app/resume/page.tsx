import ResumeDocument from '@/components/sections/ResumeDocument'
import { getResumeData, localResumeData } from '@/lib/resume'
import { RESUME_PATH, RESUME_PDF_PATH, pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Resume',
  description:
    'Resume of Pratham Sachan: experience, education, projects, skills, certifications and leadership, with a PDF version.',
  path: RESUME_PATH,
})

export default async function ResumePage() {
  // Static like every other page: built from the content API (re-read hourly)
  // or, when that is unavailable, from the content file in the repo.
  const data = await getResumeData().catch(() => localResumeData())
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-16 print:p-0 print:max-w-none">
      <ResumeDocument data={data} pdfHref={RESUME_PDF_PATH} />
    </div>
  )
}
