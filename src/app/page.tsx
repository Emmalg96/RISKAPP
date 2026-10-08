import { Her2RiskDashboard } from "@/components/her2-risk-dashboard";

export default function HomePage() {
  return (
    <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 max-w-3xl">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--pcs-accent)]">
          RISKAPP · HER2 Explorer
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          HER2 Risk Dashboard
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Scan risks with protocol and product requirement context. Filter by euRMW / dRMW, risk source and scope,
          DP52 / DP61 project, and free-text search across risk lines, summaries, PRs, and protocols.
        </p>
      </header>
      <Her2RiskDashboard />
    </main>
  );
}
