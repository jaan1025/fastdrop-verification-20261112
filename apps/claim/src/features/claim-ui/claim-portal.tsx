import { useState, type ReactNode } from "react"
import { config } from "@repo/config"
import { EligibleIcon, NotEligibleIcon, WalletIcon } from "@repo/icons"
import { cn } from "@repo/ui/lib/utils"

import { PageShell } from "~/components/page-shell"
import { ClaimRuntime } from "~/features/claim/claim-runtime"
import type { ClaimSession } from "~/features/claim/claim-session"
import { formatClaimDate } from "~/features/flow/live-claim"

import { ClaimButton } from "./claim-button"
import { ClaimProgress } from "./claim-progress"
import { claimStep } from "./claim-step"

type EligibleSession = Extract<ClaimSession, { phase: "ready" }>

export function ClaimPortal() {
  return (
    <PageShell>
      <ClaimRuntime>{(session) => {
        const wallet = session.phase === "ready" || session.phase === "ineligible" ? session.wallet : null
        return <ClaimFlow key={wallet} session={session} />
      }}</ClaimRuntime>
    </PageShell>
  )
}

function ClaimFlow({ session }: { session: ClaimSession }) {
  const [continued, setContinued] = useState(false)
  const step = claimStep(session, continued)

  let content
  if (step === "eligibility") content = <NotEligible onBack={() => setContinued(false)} />
  else if (session.phase === "ready" && step === "action") content = <ClaimAction session={session} />
  else if (session.phase === "ready" && step === "complete") content = <ClaimComplete session={session} />
  else content = <ConnectStep session={session} onNext={() => setContinued(true)} />

  return (
    <div className="container stack w-full max-w-[618px] gap-3 py-8">
      {session.mode === "demo" ? (
        <p className="text-center text-sm text-muted-foreground">Design preview · Sample allocations · No wallet transactions</p>
      ) : null}
      <div className="divide-y rounded-2xl border bg-card text-card-foreground">
        <div className="stack p-6"><ClaimProgress step={step} /></div>
        <section className="stack p-6" aria-busy={session.phase === "checking" || !!session.busy}>
          {content}
          {session.notice ? <p className="mt-4 text-center text-sm text-muted-foreground" role="status">{session.notice}</p> : null}
        </section>
      </div>
    </div>
  )
}

function StepContent({ title, description, icon, children }: {
  title: string
  description: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="stack">
      {icon ? <div className="mb-2 self-center" aria-hidden="true">{icon}</div> : null}
      <h1 className="text-center text-2xl leading-tight font-semibold sm:text-3xl">{title}</h1>
      <p className="mt-4 text-center text-sm text-muted-foreground">{description}</p>
      <div className="stack mt-6 gap-6">{children}</div>
    </div>
  )
}

function ConnectStep({ session, onNext }: { session: ClaimSession; onNext: () => void }) {
  const connected = session.phase === "ready" || session.phase === "ineligible"
  const checking = session.phase === "checking"
  const demo = session.mode === "demo"

  return (
    <StepContent title="Connect Wallet" description="Connect your wallet to check your eligibility for rewards.">
      {connected ? (
        <div className="flex min-h-12 items-center gap-4 rounded-xl bg-secondary p-3 sm:px-4">
          <WalletIcon className="shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm sm:text-base" title={session.wallet}>{session.wallet}</span>
          <ClaimButton size="sm" variant="destructive" type="button" onClick={session.disconnect}>
            {demo ? "Reset demo wallet" : "Disconnect"}
          </ClaimButton>
        </div>
      ) : (
        <button
          className="flex min-h-12 w-full items-center gap-4 rounded-xl bg-secondary p-3 text-start focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:px-4"
          type="button"
          disabled={session.phase !== "connect"}
          onClick={session.phase === "connect" ? session.connect : undefined}
        >
          <WalletIcon className="shrink-0" aria-hidden="true" />
          <span className="flex-1 text-sm sm:text-base">
            {checking ? "Checking eligibility…" : session.phase === "unavailable" ? "Wallet connection unavailable" : demo ? "Connect Demo Wallet" : "Connect Wallet"}
          </span>
          <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      )}
      <ClaimButton type="button" className="w-full" loading={checking} disabled={!connected} onClick={onNext}>Next</ClaimButton>
    </StepContent>
  )
}

function NotEligible({ onBack }: { onBack: () => void }) {
  return (
    <StepContent icon={<NotEligibleIcon className="size-16" />} title="Unfortunately" description="You have not qualified for an airdrop.">
      <div className={cn("grid gap-6", config.links.x && "sm:grid-cols-2")}>
        <ClaimButton type="button" variant="outline" className="w-full" onClick={onBack}>Back</ClaimButton>
        {config.links.x ? (
          <ClaimButton asChild className="w-full">
            <a href={config.links.x} target="_blank" rel="noreferrer">Follow {config.name || "us"} on X</a>
          </ClaimButton>
        ) : null}
      </div>
    </StepContent>
  )
}

function ClaimAction({ session }: { session: EligibleSession }) {
  const { quote, amount, busy } = session
  const demo = session.mode === "demo"
  return quote ? (
    <StepContent icon={<EligibleIcon className="size-16" />} title="Review claim" description="Check how your tokens will be distributed before confirming.">
      <dl className="divide-y rounded-xl border px-4">
        <AmountRow label="Available now" value={amount(quote.claimable)} />
        <AmountRow label="To wallet" value={amount(quote.walletAmount)} />
        {quote.lockedAmount > 0n ? <AmountRow label="Locked" value={amount(quote.lockedAmount)} /> : null}
        {quote.forfeitedAmount > 0n ? <AmountRow label="Penalty" value={amount(quote.forfeitedAmount)} /> : null}
      </dl>
      <ClaimButton type="button" className="w-full" loading={busy === "claim"} disabled={!session.canConfirm} onClick={session.confirm}>
        {demo ? "Simulate Claim" : "Confirm Claim"}
      </ClaimButton>
      <ClaimButton type="button" variant="outline" className="w-full" disabled={!!busy} onClick={session.clearReview}>Back</ClaimButton>
    </StepContent>
  ) : (
    <StepContent icon={<EligibleIcon className="size-16" />} title="You're Eligible!" description="You are eligible for the airdrop!">
      <AllocationAmount session={session} />
      <ClaimButton type="button" className="w-full" loading={busy === "review"} disabled={!session.canReview || !!busy} onClick={session.review}>
        {demo ? "Review Sample Claim" : "Claim Now"}
      </ClaimButton>
      <LockedTokens session={session} />
    </StepContent>
  )
}

function ClaimComplete({ session }: { session: EligibleSession }) {
  const { consumed, receipt, tokenSymbol, amount, busy } = session
  const demo = session.mode === "demo"
  const claimed = consumed !== undefined && consumed > 0n ? amount(consumed) + " " : ""
  return (
    <StepContent icon={<EligibleIcon className="size-16" />} title={demo ? "Sample Claim Complete!" : claimed + "Claim Success!"}
      description={demo ? "The example claim is complete." : `Congratulations, you have claimed your ${tokenSymbol}!`}>
      <AllocationAmount session={session} />
      {receipt?.url ? <a className="self-center text-sm underline" href={receipt.url} target="_blank" rel="noreferrer">View transaction</a> : null}
      <LockedTokens session={session} />
      {session.canReview ? (
        <ClaimButton type="button" className="w-full" loading={busy === "review"} disabled={!!busy} onClick={session.review}>Check for more releases</ClaimButton>
      ) : null}
    </StepContent>
  )
}

function AllocationAmount({ session }: { session: EligibleSession }) {
  return (
    <dl className="rounded-xl border px-4 py-3">
      <div className="flex min-h-10 items-center justify-between gap-2">
        <dt className="opacity-60">Your allocation:</dt>
        <dd className="text-end text-xl font-bold tabular-nums">{session.amount(session.allocation)}</dd>
      </div>
    </dl>
  )
}

function AmountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function LockedTokens({ session }: { session: EligibleSession }) {
  const { lock, amount, busy, mode } = session
  if (!lock.position) {
    if (lock.isError) return <p className="text-sm text-muted-foreground" role="alert">The lock position could not be refreshed.</p>
    return lock.isLoading ? <p className="text-sm text-muted-foreground" role="status">Checking locked tokens…</p> : null
  }
  return (
    <section className="stack gap-3 rounded-xl border p-4" aria-label="Locked tokens">
      <h2 className="font-semibold">Locked tokens</h2>
      <dl className="divide-y">
        <AmountRow label="Locked balance" value={amount(lock.position.balance)} />
        <AmountRow label="Available to withdraw" value={lock.position.withdrawable === undefined ? "Checking…" : amount(lock.position.withdrawable)} />
        <AmountRow label="Fully unlocked by" value={formatClaimDate(lock.position.endTime)} />
      </dl>
      <ClaimButton type="button" variant="outline" className="w-full" loading={busy === "withdraw"} disabled={!lock.canWithdraw || !!busy} onClick={session.withdraw}>
        {mode === "demo" ? "Simulate Withdrawal" : "Withdraw Unlocked Tokens"}
      </ClaimButton>
      {lock.receipt ? (
        <p role="status" className="text-center text-sm">
          {lock.receipt.url ? <a className="underline" href={lock.receipt.url} target="_blank" rel="noreferrer">View withdrawal</a> : "Withdrawal complete."}
        </p>
      ) : null}
    </section>
  )
}
