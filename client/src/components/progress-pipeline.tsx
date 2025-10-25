import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, AdStatus } from "./status-badge";
import { useLocation } from "wouter";

interface PipelineStage {
  status: AdStatus;
  count: number;
}

interface ProgressPipelineProps {
  stages: PipelineStage[];
}

export function ProgressPipeline({ stages }: ProgressPipelineProps) {
  const [, setLocation] = useLocation();

  const handleStageClick = (status: AdStatus) => {
    setLocation(`/ad-slots?status=${encodeURIComponent(status)}`);
  };

  return (
    <Card data-testid="card-progress-pipeline">
      <CardHeader>
        <CardTitle>진행 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {stages.map((stage) => (
            <button
              key={stage.status}
              onClick={() => handleStageClick(stage.status)}
              className="cursor-pointer hover-elevate active-elevate-2 bg-transparent border-0 p-0"
              data-testid={`pipeline-stage-${stage.status}`}
              type="button"
            >
              <StatusBadge status={stage.status} count={stage.count} />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
