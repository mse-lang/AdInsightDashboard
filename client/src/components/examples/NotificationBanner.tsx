import { NotificationBanner } from "../notification-banner";

export default function NotificationBannerExample() {
  return (
    <div className="p-6">
      <NotificationBanner 
        message="광고주 문의가 도착했습니다." 
        onDismiss={() => console.log("Notification dismissed")}
      />
    </div>
  );
}
