/**
 * Floor `value` to `precision` decimal places (rounds toward −∞). Faithful port
 * of es-toolkit/compat `floor` (`decimalAdjust`): shifts the decimal via the
 * exponent (`1.2367 → "1.2367e3" → Math.floor → "1236e-3"`) to dodge binary-FP
 * rounding error, clamps precision at 292, and preserves `-0`.
 */
export const floor = (value: number, precision = 0): number => {
  let n: number | string = Number(value)
  if (Object.is(n, -0)) n = "-0"
  const p = Math.min(Number.parseInt(String(precision), 10), 292)
  if (p) {
    const [magnitude, exponent = "0"] = n.toString().split("e")
    let adjusted: number | string = Math.floor(Number(`${magnitude}e${Number(exponent) + p}`))
    if (Object.is(adjusted, -0)) adjusted = "-0"
    const [newMagnitude, newExponent = "0"] = adjusted.toString().split("e")
    return Number(`${newMagnitude}e${Number(newExponent) - p}`)
  }
  return Math.floor(Number(n))
}
