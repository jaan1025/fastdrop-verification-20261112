/** Wallet ecosystem tag (open union keeps known literals + autocomplete while allowing future sets). */
export type WalletSet = "evm" | "solana" | "sui" | (string & {})

export interface WalletEntry {
  addressHandler: string
  walletSet: string
}

export interface AddressBindingResult {
  addressHandler: string
  wallet: WalletEntry[]
}
