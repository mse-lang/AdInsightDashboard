import { StatusBadge } from "../status-badge";

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 p-6">
      <StatusBadge status="문의중" count={5} />
      <StatusBadge status="견적제시" count={3} />
      <StatusBadge status="일정조율중" count={2} />
      <StatusBadge status="부킹확정" count={8} />
      <StatusBadge status="집행중" count={12} />
      <StatusBadge status="결과보고" count={4} />
      <StatusBadge status="세금계산서 발행 및 대금 청구" count={1} />
      <StatusBadge status="매출 입금" count={6} />
    </div>
  );
}
