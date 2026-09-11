import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="container-page pb-16">
      <Skeleton className="my-5 h-5 w-64" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-5">
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="h-13 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
