import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { ReactNode } from "react"

import { getQueryClient } from "~/lib/query-client"

// TanStack Query provider for the flow subtree. Port of mono
// `providers/providers.tsx` (`createQueryClient({ onError: toastError })` +
// `<QueryClientProvider>` + `<ReactQueryDevtools>`). The client comes from the
// shared factory so it is the same instance the root router context holds.
// Devtools only render in dev — mono mounted them in the flow branch too.
export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  )
}
