import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"
import { normalizeEvmAddress } from "../../model"

export interface AuthorizeParams {
  /** Wallet identifier — EVM addresses lowercased; Solana base58 left as-is. */
  aud: string
  scopes?: string[]
}

export const authorize = (client: AcsClient, params: AuthorizeParams) =>
  client.request<unknown>("/admin/auth", {
    method: "POST",
    body: {
      app_id: requireAppId(client, "authorize"),
      aud: normalizeEvmAddress(params.aud),
      scopes: params.scopes ?? ["all"],
    },
  })
