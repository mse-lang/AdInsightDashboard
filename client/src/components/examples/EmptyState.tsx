import { EmptyState } from "../empty-state";

export default function EmptyStateExample() {
  return (
    <div className="p-6">
      <EmptyState
        title="광고주가 없습니다"
        description="아직 등록된 광고주가 없습니다. 새로운 광고주를 추가해보세요."
        actionLabel="광고주 추가"
        onAction={() => console.log("Add advertiser clicked")}
      />
    </div>
  );
}
