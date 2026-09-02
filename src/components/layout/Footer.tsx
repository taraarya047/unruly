import { Link } from 'react-router-dom'
import { GUIDES } from '@/content/guides'
import { Logo } from './Logo'

const PRODUCT_LINKS = [
  { to: '/playground', label: 'Playground' },
  { to: '/compose', label: 'Compose' },
  { to: '/explore', label: 'Explore' },
  { to: '/saved', label: 'Saved' },
]

const COMPANY_LINKS = [
  { to: '/about', label: 'About & FAQ' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
]

// A handful of guides, not the full list — the "All guides" link covers the rest via /guides.
const FEATURED_GUIDE_SLUGS = ['what-is-parametric-design', 'svg-vs-png', 'svg-to-figma', 'svg-pattern-generator', 'generative-art-tool']
const featuredGuides = GUIDES.filter((g) => FEATURED_GUIDE_SLUGS.includes(g.slug))

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-5 py-12 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-text">
            <Logo />
            Unruly
          </Link>
          <p className="mt-3 max-w-[22ch] text-sm text-text-muted">Make something unexpected. Free, ad-supported, no account needed.</p>
        </div>

        <FooterColumn title="Product" links={PRODUCT_LINKS} />

        <FooterColumn title="Guides" links={[{ to: '/guides', label: 'All guides' }, ...featuredGuides.map((g) => ({ to: `/guides/${g.slug}`, label: g.title }))]} />

        <FooterColumn title="Company" links={COMPANY_LINKS} />
      </div>

      <div className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-5 text-xs text-text-muted">© {new Date().getFullYear()} Unruly.</div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-text-muted">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="text-sm text-text-muted hover:text-text">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
