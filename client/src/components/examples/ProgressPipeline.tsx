import { ProgressPipeline } from "../progress-pipeline";

export default function ProgressPipelineExample() {
  const mockStages = [
    { status: "문의중" as const, count: 5 },
    { status: "견적제시" as const, count: 3 },
    { status: "일정조율중" as const, count: 2 },
    { status: "부킹확정" as const, count: 8 },
    { status: "집행중" as const, count: 12 },
    { status: "결과보고" as const, count: 4 },
    { status: "세금계산서 발행 및 대금 청구" as const, count: 1 },
    { status: "매출 입금" as const, count: 6 },
  ];

  return (
    <div className="p-6">
      <ProgressPipeline stages={mockStages} />
    </div>
  );
}
