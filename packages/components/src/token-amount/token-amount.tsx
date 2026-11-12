export function TokenAmount({
  amount,
  symbol,
  usd,
  className,
}: {
  amount: string
  symbol: string
  usd?: string
  className?: string
}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${className ?? ""}`}>
      <span className="text-muted-foreground text-sm">{symbol}</span>
      <div className="flex flex-col items-end">
        <span className="font-mono text-sm tabular-nums">{amount}</span>
        {usd && <span className="text-muted-foreground text-xs tabular-nums">{usd}</span>}
      </div>
    </div>
  )
}
