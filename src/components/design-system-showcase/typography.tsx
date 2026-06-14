export function Typography({ displayLabel, sansLabel }: { displayLabel: string; sansLabel: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-border p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{displayLabel}</p>
        <p className="font-display mt-3 text-4xl">Titouan Lebocq</p>
        <p className="font-display mt-1 text-2xl text-muted">Aa Bb Cc · 0123</p>
      </div>
      <div className="rounded-xl border border-border p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{sansLabel}</p>
        <p className="mt-3 text-2xl font-bold tracking-tight">Engineering with the craft of design.</p>
        <p className="mt-2 text-muted">The quick brown fox jumps over the lazy dog. 0123456789</p>
      </div>
    </div>
  );
}
