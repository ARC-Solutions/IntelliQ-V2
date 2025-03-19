import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-card text-card-foreground">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center space-x-2 mb-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-32 mt-2" />
      </CardContent>
      <CardFooter className="pt-2 flex gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-10" />
      </CardFooter>
    </Card>
  );
}
