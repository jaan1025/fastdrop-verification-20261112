import { useState, type ReactNode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { createConfiguredQueryClient } from "./query-client"

/**
 * TanStack Query host. One client per browser session; configuration lives
 * in `query-client.ts` (auth-failure handling, retry policy).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createConfiguredQueryClient)
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
