import { Routes, Route } from 'react-router-dom';

function Shell() {
  return (
    <main className="min-h-screen bg-bg p-6 text-ink font-body">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="border-b border-border pb-4">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink">
            Kanban Board
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tactile paper ground, hairline borders, and calibrated typefaces.
          </p>
        </header>

        <section className="rounded bg-surface p-4 border border-border">
          <h2 className="font-heading text-base font-semibold text-ink">Typeface Verification</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-heading font-semibold text-ink">
              Heading (Bricolage Grotesque Semibold)
            </p>
            <p className="font-body text-ink">Body text (Instrument Sans Regular and Medium)</p>
            <p className="font-mono text-xs text-muted">
              Metadata stamp (JetBrains Mono 500) &middot; POS: 1.000 &middot; 2026-10-02
            </p>
          </div>
        </section>

        <section className="rounded bg-surface p-4 border border-border">
          <h2 className="font-heading text-base font-semibold text-ink">Palette Verification</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="rounded-sm border border-border bg-bg p-2 text-ink">bg: #F4F1EA</div>
            <div className="rounded-sm border border-border bg-surface p-2 text-ink">
              surface: #FBFAF6
            </div>
            <div className="rounded-sm border border-border bg-surface-subtle p-2 text-ink">
              surface-subtle: #EFECE4
            </div>
            <div className="rounded-sm border border-border bg-ink p-2 text-surface">
              ink: #1B1A17
            </div>
            <div className="rounded-sm border border-border bg-surface p-2 text-muted">
              muted: #6B665C
            </div>
            <div className="rounded-sm border border-border bg-accent p-2 text-surface">
              accent: #E4572E
            </div>
            <div className="rounded-sm border border-border bg-surface p-2 text-success">
              success: #2E6F40
            </div>
            <div className="rounded-sm border border-border bg-surface p-2 text-danger">
              danger: #C83E28
            </div>
          </div>
        </section>

        <section className="rounded bg-surface p-4 border border-border flex items-center justify-between">
          <span className="text-xs font-mono text-muted">Radius rule: 3px container, 2px chip</span>
          <div className="flex items-center gap-2">
            <span className="rounded-sm border border-border bg-surface-subtle px-2 py-0.5 text-xs font-mono text-ink">
              chip: 2px
            </span>
            <div className="h-[22px] w-[22px] rounded-full border border-border bg-surface flex items-center justify-center font-mono text-[10px] font-bold text-ink">
              RJ
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Shell />} />
    </Routes>
  );
}
