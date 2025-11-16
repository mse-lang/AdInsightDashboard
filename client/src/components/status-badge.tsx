import { Badge } from "@/components/ui/badge";
import type { PipelineStatus } from "@shared/schema";

// Deprecated: Use PipelineStatus from @shared/schema instead
export type AdStatus = PipelineStatus;

interface StatusBadgeProps {
  status: PipelineStatus;
  count?: number;
}

const statusColors: Record<PipelineStatus, string> = {
  "문의중": "bg-blue-100 text-blue-700 border-blue-200",
  "견적제시": "bg-purple-100 text-purple-700 border-purple-200",
  "일정조율중": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "부킹확정": "bg-green-100 text-green-700 border-green-200",
  "집행중": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "결과보고": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "세금계산서 발행 및 대금 청구": "bg-orange-100 text-orange-700 border-orange-200",
  "매출 입금": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function getStatusColor(status: string): string {
  return statusColors[status as PipelineStatus] || "bg-gray-100 text-gray-700 border-gray-200";
}

export function StatusBadge({ status, count }: StatusBadgeProps) {
  const colorClass = getStatusColor(status);
  
  return (
    <Badge 
      variant="outline" 
      className={`${colorClass} border`}
      data-testid={`badge-status-${status}`}
    >
      {status}
      {count !== undefined && ` (${count})`}
    </Badge>
  );
}
