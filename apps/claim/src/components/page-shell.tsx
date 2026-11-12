import type { ReactNode } from "react"

import { Header } from "./header"
import { Banner } from "./banner"
import { Footer } from "./footer"

// Full-height page frame: header, support banner (hidden on `/`), content in a
// growing main region, then the footer. mono's `(light)/layout.tsx` used
// Header/section/Footer (no Banner); the landing + info pages share this shell.
// The Banner self-hides on `/`, so including it here is safe for both.
export const PageShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-dvh flex-col">
    <Header />
    <Banner />
    <main className="flex flex-1 flex-col">{children}</main>
    <Footer />
  </div>
)
