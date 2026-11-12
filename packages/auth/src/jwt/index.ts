// Barrel for the `@repo/auth/jwt` subpath: the pure, framework-free JWT grammar +
// token build/parse/expiry/ecosystem surface. The only public face of `jwt/*`;
// consumers import from here, leaves stay private behind it.
export type { ChainEcosystem, JwtAlg } from "./grammar"
export { buildJwtMessage } from "./message"
export type { BuildJwtMessageInput, JwtHeader, JwtPayload } from "./message"
export { buildJwtTokenFromBytes, buildJwtTokenFromHex } from "./token"
export { decodeJwt, parseJwtHeader, parseJwtPayload } from "./parse"
export type { DecodedJwt } from "./parse"
export { isTokenExpired } from "./expiry"
export { jwtEcosystem } from "./ecosystem"
