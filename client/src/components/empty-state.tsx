import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import emptyImage from "@assets/generated_images/Empty_state_illustration_dashboard_00ecec2c.png";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <img src={emptyImage} alt="Empty state" className="w-32 h-32 mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center mb-4 max-w-sm">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} data-testid="button-empty-action">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
