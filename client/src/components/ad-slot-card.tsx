import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";

export interface AdSlot {
  id: string;
  name: string;
  maxSlots: number;
  currentSlots: number;
  price: string;
  status: "available" | "full" | "partial";
}

interface AdSlotCardProps {
  slot: AdSlot;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

export function AdSlotCard({ slot, onEdit, onView }: AdSlotCardProps) {
  const statusColors = {
    available: "bg-green-100 text-green-700 border-green-200",
    partial: "bg-yellow-100 text-yellow-700 border-yellow-200",
    full: "bg-red-100 text-red-700 border-red-200",
  };

  const statusText = {
    available: "이용 가능",
    partial: "부분 사용",
    full: "사용 중",
  };

  return (
    <Card data-testid={`card-ad-slot-${slot.id}`} className="hover-elevate">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{slot.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {slot.currentSlots} / {slot.maxSlots} 슬롯 사용중
            </p>
          </div>
          <Badge variant="outline" className={`${statusColors[slot.status]} border`}>
            {statusText[slot.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold font-mono">{slot.price}</p>
            <p className="text-xs text-muted-foreground">슬롯당 가격</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onView?.(slot.id)}
              data-testid={`button-view-slot-${slot.id}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit?.(slot.id)}
              data-testid={`button-edit-slot-${slot.id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
