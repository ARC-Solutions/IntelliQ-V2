import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface HistoryCardProps {
  id: string;
  title: string;
  date: string;
  score: number | null;
  correct: number | null;
  incorrect: number | null;
  totalTime?: string; // Optional since multiplayer doesn't have it
  passed?: boolean;
  type: string; // Make this required since we need it for conditional rendering
}

export function HistoryCard({
  id,
  title,
  score,
  totalTime,
  date,
  incorrect,
  correct,
  passed,
  type,
}: HistoryCardProps) {
  // Format tags based on quiz type
  const tags =
    type === "multiplayer"
      ? [
          `Score: ${score !== null ? `${score}` : "N/A"}`,
          `Correct: ${correct ?? "N/A"}`,
          `Incorrect: ${incorrect ?? "N/A"}`,
        ]
      : [
          `Score: ${score !== null ? `${score}%` : "N/A"}`,
          `Time: ${totalTime ?? "N/A"}`,
          `Correct: ${correct ?? "N/A"}`,
          `Incorrect: ${incorrect ?? "N/A"}`,
        ];

  return (
    <Card className="bg-[#0c0d0d] border-[#c8b6ff]/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-[#c8b6ff]">{title}</CardTitle>
            <CardDescription className="text-[#c8b6ff]/70">
              {date}
            </CardDescription>
          </div>
          {type !== "multiplayer" && (
            <Badge
              variant={passed ? "success" : "destructive"}
              className={
                passed
                  ? "bg-green-500/20 text-green-500"
                  : "bg-destructive/20 text-destructive"
              }
            >
              {passed ? "Passed" : "Failed"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="border-[#c8b6ff]/20 text-[#c8b6ff]/70"
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-[#c8b6ff]/20 text-[#c8b6ff]/70"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
