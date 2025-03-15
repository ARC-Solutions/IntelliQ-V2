import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface HistoryCardProps {
  id: string
  quiz_title: string
  created_at: string
  score: number | null
  correct: number | null
  incorrect: number | null
  totalTime: string
}

export function HistoryCard({ id, quiz_title, created_at, score, incorrect, correct, totalTime }: HistoryCardProps) {
  // Determine status based on score
  const status = score !== null && score > 50 ? "passed" : "failed"

  // Format tags based on the quiz data
  const tags = [
    `Score: ${score !== null ? `${score}%` : "N/A"}`,
    `Time: ${totalTime}`,
    `Correct: ${correct ?? "N/A"}`,
    `Incorrect: ${incorrect ?? "N/A"}`,
  ]

  return (
    <Card className="bg-[#0c0d0d] border-[#c8b6ff]/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-[#c8b6ff]">{quiz_title}</CardTitle>
            <CardDescription className="text-[#c8b6ff]/70">{new Date(created_at).toLocaleString()}</CardDescription>
          </div>
          <Badge
            variant={status === "passed" ? "default" : "destructive"}
            className={status === "passed" ? "bg-[#c8b6ff]/20 text-[#c8b6ff]" : "bg-destructive/20 text-destructive"}
          >
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-[#c8b6ff]/20 text-[#c8b6ff]/70">
            singleplayer
          </Badge>
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-[#c8b6ff]/20 text-[#c8b6ff]/70">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

