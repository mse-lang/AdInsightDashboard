import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";

interface NotificationBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function NotificationBanner({ message, onDismiss }: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50" data-testid="alert-notification">
      <Bell className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-blue-900">{message}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDismiss}
          data-testid="button-dismiss-notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
