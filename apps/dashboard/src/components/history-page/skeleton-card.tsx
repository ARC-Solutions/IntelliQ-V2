import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function SkeletonCard() {
  return (
    <Card className="bg-[#0c0d0d] border-[#c8b6ff]/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-[180px] bg-[#c8b6ff]/10" />
            <Skeleton className="h-4 w-[120px] bg-[#c8b6ff]/10" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full bg-[#c8b6ff]/10" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-full bg-[#c8b6ff]/10" />
          <Skeleton className="h-6 w-28 rounded-full bg-[#c8b6ff]/10" />
          <Skeleton className="h-6 w-32 rounded-full bg-[#c8b6ff]/10" />
          <Skeleton className="h-6 w-36 rounded-full bg-[#c8b6ff]/10" />
        </div>
      </CardContent>
    </Card>
  )
}

