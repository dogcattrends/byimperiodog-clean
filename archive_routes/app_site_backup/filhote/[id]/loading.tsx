export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-[4/3] w-full animate-pulse rounded-3xl bg-zinc-100" />
        <div className="space-y-4">
          <div className="h-6 w-1/3 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
          <div className="h-24 w-full animate-pulse rounded-3xl bg-zinc-100" />
          <div className="h-12 w-full animate-pulse rounded-2xl bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
