import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, AdStatus } from "./status-badge";

interface PipelineStage {
  status: AdStatus;
  count: number;
}

interface ProgressPipelineProps {
  stages: PipelineStage[];
}

export function ProgressPipeline({ stages }: ProgressPipelineProps) {
  return (
    <Card data-testid="card-progress-pipeline">
      <CardHeader>
        <CardTitle>진행 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {stages.map((stage) => (
            <StatusBadge key={stage.status} status={stage.status} count={stage.count} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
