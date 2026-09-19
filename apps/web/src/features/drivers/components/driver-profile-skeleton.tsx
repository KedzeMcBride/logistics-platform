export function DriverProfileSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page heading skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-gray-200" />
        </div>

        {/* Profile header skeleton */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-32 animate-pulse bg-gray-200 sm:h-40" />

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end">
              <div className="h-28 w-28 shrink-0 animate-pulse rounded-full border-4 border-white bg-gray-300 sm:h-36 sm:w-36" />

              <div className="space-y-3 pb-1">
                <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />

                <div className="flex gap-2">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account information skeleton */}
        <SkeletonSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonInfoItem />
            <SkeletonInfoItem />
            <SkeletonInfoItem />
            <SkeletonInfoItem />
          </div>
        </SkeletonSection>

        {/* Status skeleton */}
        <SkeletonSection>
          <div className="grid gap-4 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </SkeletonSection>

        {/* Performance skeleton */}
        <SkeletonSection>
          <div className="grid gap-4 sm:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </SkeletonSection>

        {/* Documents and vehicles skeleton */}
        <SkeletonSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </SkeletonSection>

        {/* Location skeleton */}
        <SkeletonSection>
          <SkeletonInfoItem />
        </SkeletonSection>

        {/* Timeline skeleton */}
        <SkeletonSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonInfoItem />
            <SkeletonInfoItem />
          </div>
        </SkeletonSection>
      </div>
    </main>
  );
}

function SkeletonSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 space-y-2">
        <div className="h-5 w-36 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded bg-gray-200" />
      </div>

      {children}
    </section>
  );
}

function SkeletonInfoItem() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-gray-200" />

      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-40 max-w-full animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-gray-200" />

        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-36 max-w-full animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
