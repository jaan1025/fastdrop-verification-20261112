import { isNil } from "./predicate"

export const toBigInt = (value: string | number | bigint) => {
  if (isNil(value)) throw new Error("toBigInt: value is null or undefined")

  if (typeof value === "bigint") return value

  if (typeof value === "number") {
    value = value.toString()
  }

  const s = value.trim()
  if (s === "") throw new Error("toBigInt: value is an empty string")

  // hex string (no decimals allowed)
  if (/^[-+]?0[xX][0-9a-fA-F]+$/.test(s)) {
    const isNegative = s.startsWith("-")
    const hex = isNegative || s.startsWith("+") ? s.slice(1) : s
    const result = BigInt(hex)
    return isNegative ? -result : result
  }

  // normalize common separators
  const n = s.replace(/[,_\s]/g, "")

  // scientific notation support (e.g., 1e18, -1.23e4, .5e3)
  if (/[eE]/.test(n)) {
    const m1 = n.match(/^([+-]?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/) // match +1.2e3; [1] sign, [2] integer part, [3] fractional part, [4] exponent
    const m2 = m1 ? null : n.match(/^([+-]?)\.(\d+)[eE]([+-]?\d+)$/) // match +.2e3; [1] sign, [2] fractional part, [3] exponent

    if (!m1 && !m2)
      throw new Error("toBigInt: invalid scientific notation format. " + `value: ${value}`)

    const sign = (m1 ? m1[1] : m2![1]) === "-" ? "-" : ""
    const integerPart = m1 ? m1[2]! : "0"
    const fractionalPart = m1 ? (m1[3] ?? "") : m2![2]!
    const exponentStr = m1 ? m1[4]! : m2![3]!

    // construct coefficient as BigInt from all significant digits
    const digits = integerPart + fractionalPart
    if (!/^\d+$/.test(digits)) throw new Error("toBigInt: invalid digits in scientific notation.")

    const coefficient = BigInt(digits)
    const exponent = BigInt(exponentStr)
    const fracLen = BigInt(fractionalPart.length)
    const shift = exponent - fracLen

    if (shift >= 0n) {
      const pow10 = 10n ** shift
      const result = coefficient * pow10
      return sign === "-" ? -result : result
    }

    // Negative shift means division. Ensure it divides evenly to remain an integer.
    const absShift = -shift
    const pow10 = 10n ** absShift
    if (coefficient % pow10 !== 0n)
      throw new Error(
        "toBigInt: scientific notation results in a non-integer. " + `value: ${value}`,
      )
    const result = coefficient / pow10
    return sign === "-" ? -result : result
  }

  // allow decimals only when fractional part is all zeros
  if (n.includes(".")) {
    const parts = n.match(/^([+-]?)(\d+)\.(\d+)$/)
    if (!parts) throw new Error("toBigInt: invalid decimal format. " + `value: ${value}`)
    const sign = parts[1] === "-" ? "-" : ""
    const integerPart = parts[2]!
    const fractionalPart = parts[3]!
    if (!/^0+$/.test(fractionalPart)) {
      throw new Error(
        "toBigInt: decimal value must have zero fractional part. " + `value: ${value}`,
      )
    }
    const intStr = integerPart
    return BigInt(sign + intStr)
  }

  // integer string
  if (!/^[+-]?\d+$/.test(n))
    throw new Error("toBigInt: invalid integer string. " + `value: ${value}`)
  const intStr = n.startsWith("+") ? n.slice(1) : n
  return BigInt(intStr)
}
