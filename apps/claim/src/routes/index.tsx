import { createFileRoute, Link } from "@tanstack/react-router"

import { Footer } from "~/components/footer"
import { Header } from "~/components/header"
import { ClaimButton } from "~/features/claim-ui/claim-button"

export const Route = createFileRoute("/")({ ssr: false, component: ClaimLanding })

function ClaimLanding() {
  return (
    <main className="stack min-h-dvh">
      <Header />
      <section className="container stack max-w-full flex-1 items-center justify-center py-20">
        <h1 className="mt-4 text-center text-4xl leading-tight font-medium sm:text-7xl">Ready to claim</h1>
        <p className="opacity-60">Verified with persistent PostgreSQL drafts</p>
        <ClaimButton asChild className="mt-6 w-full sm:max-w-40">
          <Link to="/flow">Enter</Link>
        </ClaimButton>
      </section>
      <Footer />
    </main>
  )
}
