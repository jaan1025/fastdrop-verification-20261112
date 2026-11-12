"use client"
import { createContext, type ReactNode } from "react"
import type { AcsConfig } from "../transport"

export const AcsContext = createContext<AcsConfig | undefined>(undefined)

export interface AcsProviderProps {
  config: AcsConfig
  children: ReactNode
}

export const AcsProvider = ({ config, children }: AcsProviderProps) => (
  <AcsContext.Provider value={config}>{children}</AcsContext.Provider>
)
