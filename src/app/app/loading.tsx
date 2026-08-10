import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-14 px-4 py-8 sm:px-6 lg:px-8" aria-busy>
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {Array.from({ length: 3 }).map((_, section) => (
        <section key={section} className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-48" />
          </div>
          <div className="flex snap-x gap-4">
            {Array.from({ length: 6 }).map((_, card) => (
              <div key={card} className="w-40 shrink-0 snap-start sm:w-44">
                <div className="rounded-xl border border-border bg-card p-2.5">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="mt-2.5 h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}