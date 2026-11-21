import Link from 'next/link'
import { DISCLAIMER_SHORT } from '@/lib/credits'

export default function Footer({ year = new Date().getFullYear() }: { year?: number }) {
  return (
    <footer className="border-t border-cp-border py-6 px-4 text-center text-xs uppercase tracking-widest text-cp-muted print:hidden">
      <p>© {year} · Compiled in Night City</p>
      <p className="mt-2 normal-case tracking-normal text-sm">
        {DISCLAIMER_SHORT}{' '}
        <Link
          href="/credits"
          className="inline-block py-1 underline underline-offset-4 hover:text-cp-teal"
        >
          Credits and licences
        </Link>
      </p>
    </footer>
  )
}
