import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="container-page pb-16">
      <Skeleton className="my-5 h-5 w-40" />
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <Skeleton className="hidden h-[32rem] w-[18.5rem] shrink-0 rounded-2xl lg:block" />
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-36" />
          </div>
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
