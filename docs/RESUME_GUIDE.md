# Resume guide

How the generated resume (`/resume` and `/resume.pdf`) should read to applicant
tracking systems (ATS), AI screeners and recruiters, for early-career backend
and forward-deployed engineer (FDE) roles in financial services. Researched
November 2026. Sources are listed at the end, and each claim is tagged by
source type:

- **[V]** vendor documentation;
- **[U]** a university career centre;
- **[R]** recruiter or practitioner guidance;
- **[M]** marketing, or a resume-tool vendor's claim.

## 1. Philosophy at 2–4 years of experience

1. **Write for three readers, in this order of risk.**
   - **AI ranking.** Workday HiredScore grades candidates against the posting's
     requirements and highlights the resume text that supports each one [V].
   - **Classic parsing.** Parsers break on layout: Greenhouse lists columns,
     tables, text boxes, headers and footers, and letter-spaced text as causes
     of failed parses [V].
   - **The human skim.**
2. **A failed parse rarely rejects you outright.** Greenhouse says a failed
   parse means the details are entered by hand [V], and most recruiters say
   their ATS does not auto-reject [R/M].
   - The well-known "75% are rejected by ATS" figure has no published method.
   - The real filters are the knockout questions (work authorisation,
     location) and ranking.
3. **One page.** Experience comes first, then evidence: TIH and MIT recommend
   one page, and Harvard sets no limit [R/U]. The page count only matters to
   people, but recruiters skim.
4. **Every keyword in two places.** Put it in the categorised Skills list *and*
   in a bullet that shows it used. AI graders reward evidence over lists [V].
   Never use hidden text: detectors now flag it, and a 2026 Duke-led study
   found it in about 1% of resumes [R].
5. **Cut what a 2024 graduate no longer needs:**
   - high-school projects and activities;
   - coursework, and GPA unless it is 3.5 or above;
   - old internships beyond 1–2 lines each [U/R].
6. **Projects: show 2–3, chosen for the target role**, each with its stack, a
   link and one outcome. Deployed, live projects are strong evidence for FDE
   roles [R].
7. **The summary is optional; sources disagree.**
   - TIH says to include one, under 50 words; Harvard and MIT don't ask for
     one.
   - Use a 1–2 line targeted summary only if it names the target role and
     domain, and never an "objective".
8. **FDE variant, same facts, different emphasis** [R, directional]. Each bullet
   follows: customer or user problem → what was built → where it was deployed →
   what changed.
   - Surface stakeholder work, integration with legacy systems and end-to-end
     ownership.
   - A backend variant leads with scale, reliability and design instead.

## 2. Checklist

**Layout**
- [ ] One column, no tables, text boxes, icons, images or skill bars.
- [ ] Contact details sit in the body, not in a page header or footer.
- [ ] Body text 10 pt or larger, name 14–18 pt.
- [ ] A standard font: Helvetica, Arial or Calibri.
- [ ] Margins of 0.5–0.75 in.
- [ ] Headings in plain words: Experience, Education, Skills, Projects,
      Certifications, Publications, Leadership.
- [ ] Headings have no letter spacing and no symbols.

**Dates, contact details and links**
- [ ] One date format throughout ("Jul 2024 – Present"), with a month and
      year on every role; no year-only dates.
- [ ] City and state are present.
- [ ] The visible link text is the address itself (`linkedin.com/in/…`), and
      it is also clickable.
- [ ] Institution names are written in full.

**Bullets and keywords**
- [ ] Each bullet starts with a verb, gives the action, then a measurable
      result (XYZ).
- [ ] 3–5 bullets for the current role, 1–2 for older roles.
- [ ] Each bullet fits on 1–2 lines.
- [ ] No "Worked on…" or "Responsible for…" openers.
- [ ] The posting's exact terms are mirrored, and acronyms are written out
      once.

**The PDF file**
- [ ] Real, selectable text.
- [ ] Copy-paste and extraction give the visual reading order.
- [ ] No ligature or glyph loss.
- [ ] Title and Author metadata are set; the file name is
      `Firstname-Lastname-Resume.pdf`; the file is under 2.5 MB.
- [ ] Tagged PDF: worth having for accessibility, but no ATS vendor documents
      reading it.
- [ ] Send PDF by default, and keep a DOCX for postings or Workday flows that
      want one [V/U].

## 3. Audit of the current generator

The generator builds one model in `frontend/src/lib/resume.ts`, which
`ResumeDocument.tsx` draws as HTML and `lib/resumePdf.ts` (with `lib/pdf/`)
draws as the PDF. Audited from the live `https://justcallmepratt.dev/resume.pdf`
on 24 Nov 2026, with pypdf (content-stream order) and pdfminer (layout order).

**What already meets the guidance**
- One column, no images or tables, and black text.
- Real selectable text in base-14 Helvetica with WinAnsi encoding. No
  ligatures are drawn, so extraction is clean: "Spring Boot", "–", "·" and "•"
  all come back intact.
- Title, Author, Subject and `/Lang` metadata, and the file name
  `Pratham-Sachan-Resume.pdf`; the file is 10.7 KB.
- The header is in the body, not a PDF header region.
- Links show readable addresses and are clickable.
- Dates are consistent ("Jul 2024 – Present"), and headings are standard
  words.
- Experience comes before Education.

**Problems found**

| # | Finding | Evidence |
|---|---|---|
| A1 | **Date drawn before the title.** `Layout.entry()` paints the right-aligned date first, so stream-order extractors read the date glued to the title with no separator. | pypdf gives `Jul 2024 – PresentBackend Software Developer`, `Jun 2023Software Engineering Intern`. pdfminer instead moves each date below the description. |
| A2 | **The Skills block extracts as a table.** Values are aligned in a column at a fixed x offset, so layout-based extractors separate the labels from their values. | pdfminer gives `Backend / Frontend / DevOps / Business & Leadership Strategic planning…` followed by the values of the other rows. Certifications behave the same way (`Udemy` / `Udemy` detached). |
| A3 | **Two pages.** All 9 projects are printed, including two from high school. The test only asserts "one or two pages". | Page 2 starts mid-Projects. *Smart Course Selection App* (2019–20) and *FIRST Robotics* (high school) are on it. |
| A4 | **Weak current-role content.** A tool-list paragraph and two "Worked on/with…" bullets, with no metrics. | `experience[0].description`, `highlights` |
| A5 | **Body text at 9.5 pt**, below the 10 pt minimum. Margins are 0.75 in. | `SIZE.body = 9.5`, `margin: 54` |
| A6 | **Missing dates.** The degree has no graduation date, and the 2023 internship has no end month, so it reads as a one-month role. Certifications and the mentoring entry are undated. | `education[0].year` absent; `experience[1].endDate: null` |
| A7 | **Soft skills listed as keywords.** The "Business & Leadership" row has six soft-skill phrases. AI graders want evidence in bullets, and the row costs two lines. | Skills section |
| A8 | **"Certifications" holds Udemy courses**, with no dates. | `certifications` |
| A9 | **Research is missing from the resume.** The 2023 generative-AI-in-fintech paper is relevant to the target industry. | `research` is not passed to `buildResume` |
| A10 | **Thin Leadership.** One undated entry. The UMass F1 club co-founder and VP role, already published in the bio, is not listed. | `leadership`, `profile.bio` |
| A11 | **No email or phone.** This is deliberate site policy, but ATS profiles and recruiters expect at least an email. | `buildResume` comment |
| A12 | **The PDF is untagged.** It has no `/MarkInfo` or `/StructTreeRoot`. Its fonts are not embedded, which is acceptable for base-14 fonts and not a parsing problem. | catalog keys: `/Type /Pages /Lang /ViewerPreferences` |

## 4. Ranked changes

Items marked **code** change only the renderer or the selection logic and
publish nothing new. Items marked **needs you** require facts or wording that
only you can confirm; nothing in them is published until you do.

1. **Fix the reading order (A1). Code.**
   - Draw each entry's title before its date.
   - Make sure a space or separator falls between them in the content stream.
   - Add a test that extracts the stream text and asserts
     `Backend Software Developer … Jul 2024 – Present`.
2. **Get to one page (A3, A5). Code, with one choice from you.**
   - Print only `featured` projects, at most 3–4.
   - Drop high-school items from the resume; the site keeps them.
   - Raise body text to 10 pt and narrow the margins to about 0.6 in.
   - Tighten the test to exactly one page.
   - *Choice:* which projects. Today `featured` covers justcallmepratt.dev, the
     Kafka demo and MinuteBoard. Athlink is a stronger FDE-style example.
3. **Rewrite the current-role bullets (A4). Needs you.**
   - Replace the tool paragraph and the "Worked on…" lines with 3–5
     verb-first bullets that give scale or outcome. Examples: messages a day
     on the Kafka service, the legacy system it fed, latency or incident
     reduction, mentoring.
   - Add one FDE-style bullet about working with business or ops users, if
     true.
   - The fintech terms to use where they genuinely apply are in the research
     notes: event streaming, audit trail, data lineage, transaction
     processing, change management.
4. **Flatten the Skills and Certifications rows (A2). Code.**
   - Print `Category: a, b, c` as one wrapped run of text, with no aligned
     value column. Extraction then keeps each label with its values.
5. **Fill in the dates (A6). Needs you.** Graduation month and year, the
   internship's end month, and the certification years.
6. **Trim the Skills section (A7). Code plus your choice.**
   - Drop or shrink the "Business & Leadership" row on the resume (the site
     can keep it), and show that evidence in Leadership bullets instead.
   - Normalise names: "React" rather than "ReactJS", and either "Angular" or
     "AngularJS", whichever is true.
   - Optionally add SQL, REST APIs, Git and Docker, only where you confirm
     you use them.
7. **Add Publications (A9). Code plus your OK.**
   - Add a "Publications" section from the repo's `research` content, with
     the title, the year and the link.
   - List only the 2023 fintech paper; leave out the high-school AP paper.
8. **Strengthen Leadership (A10). Needs you.**
   - Add the UMass F1 club co-founder and VP role, which the bio already
     states, with its dates.
   - Date the mentoring entry and add one line on its scope.
9. **Correct Certifications (A8). Needs you.**
   - Rename the section "Certifications & Courses", or keep only real
     certifications.
   - Add the years.
10. **Optional summary line. Needs you.** A sentence of at most 50 words
    under the tagline that names the target role and domain. The tagline
    already works as a headline, so this is the lowest-value text change.
11. **Tag the PDF (A12). Code, larger.**
    - Add `/MarkInfo`, a structure tree (H1/H2/P/L) and marked content.
    - This helps accessibility. No ATS vendor documents using tags, so it is
      last.
12. **A private "apply" copy with an email address (A11). Needs you;
    policy.**
    - The public PDF stays contact-free.
    - A local-only script could render the same model with an email address
      for applications. It would never be built or deployed. Only worth doing
      if you want it.

### Status (24 Nov 2026)

- **Done: 1, 4 and 7.**
  - Stream-order extraction now reads `Backend Software Developer Jul 2024 – Present`.
  - Skills and Certifications rows extract as one `Label: values` line each.
  - Publications lists the 2023 paper. The AP paper carries `resume: false`,
    so it stays on /research only.
- **Partly done: 2.** The resume now prints only featured projects (at most
  3, `MAX_RESUME_PROJECTS`), with 10 pt body text and 0.6 in margins. It is
  **still two pages**: about 220 pt of Skills, Certifications and Leadership
  spills over. Getting to one page needs trims to content, so the test still
  allows two pages until you decide:
  - turn the current role's tool paragraph into bullets (3);
  - drop the "Business & Leadership" row from the resume (6);
  - drop the Udemy courses (9).
- **Still to do.** Layout-based extractors such as pdfminer still file a
  right-aligned date as its own text block. If that matters, the date can move
  onto the subtitle row (`Raymond James · Tampa, FL · Jul 2024 – Present`).

## Sources

The full research notes, with every citation, are kept outside the repo. The
most authoritative sources:

- [Greenhouse – Unsuccessful resume parse](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse) [V]
- [Greenhouse – Supported file formats](https://support.greenhouse.io/hc/en-us/articles/360052218132) [V]
- [Workday – HiredScore screening](https://blog.workday.com/en-us/screen-candidates-50-faster-workday-recruiting.html) [V]
- [MIT CAPD – Make your resume ATS-friendly](https://capd.mit.edu/resources/make-your-resume-ats-friendly/) [U]
- [MIT CAPD – Resume checklist](https://capd.mit.edu/resources/resume-checklist/) [U]
- [MIT CAPD – 2026 resume resources](https://capd.mit.edu/blog/2026/06/23/interphase-2026-resume-resources/) [U]
- [Harvard FAS – Create a strong resume](https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/) [U]
- [Tech Interview Handbook – Resume](https://www.techinterviewhandbook.org/resume/) [R]
- [IT Brief – recruiter study on ATS auto-rejection](https://itbrief.co.uk/story/study-reveals-ats-rarely-auto-rejects-cvs-debunks-75-myth) [R/M]
- [Duke Pratt – hidden prompt injection in resumes](https://pratt.duke.edu/news/thwarting-prompt-injection/) [R]
- [Adobe – Create and verify PDF accessibility](https://helpx.adobe.com/acrobat/current/create-verify-pdf-accessibility.html) [V]
- [Exponent – FDE resume](https://www.tryexponent.com/blog/forward-deployed-engineer-resume) [R]
- [First Round – Hiring an FDE](https://review.firstround.com/so-you-want-to-hire-a-forward-deployed-engineer/) [R]

**Gaps.**
- Lever's help article would not load.
- Workday, Taleo, SmartRecruiters and Ashby publish no format docs for
  candidates.
- iCIMS's only first-party format list is an admin bulk-import document.
- The FDE sources are mostly career blogs.
