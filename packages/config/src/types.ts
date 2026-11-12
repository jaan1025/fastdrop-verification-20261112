export interface Config {
  name: string
  token: {
    name: string
    symbol: string
  }
  meta: {
    title: string
    description: string
    keywords: string
  }
  links: {
    x: string
    discord: string
    github: string
    telegram: string
    privacyPolicy: string
    termsOfService: string
    airdropTermsOfService: string
  }
}
