export interface RelayerResponse {
  address: string
  /** Chain the relayer serves (ACS chainId grammar). */
  chainId: string
  /** Current relayer nonce (string-encoded). */
  nonce: string
  online: boolean
}
