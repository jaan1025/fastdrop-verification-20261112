"use client"
import { useContext } from "react"
import { createAcsError } from "../transport"
import { AcsContext } from "./provider"

export const useAcsConfig = () => {
  const config = useContext(AcsContext)
  if (!config) {
    throw createAcsError({
      status: 0,
      statusText: "Bad Request",
      body: undefined,
      url: "",
      message: "useAcsConfig must be used inside <AcsProvider>.",
    })
  }
  return config
}

export const useAdminClient = () => useAcsConfig().getClient("admin")
export const usePublicClient = () => useAcsConfig().getClient("public")
