import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Image as ImageIcon } from "lucide-react";
import mainBannerImg from "@assets/image_1761406802584.png";
import sideBannerImg from "@assets/image_1761406824308.png";
import newsletterBannerImg from "@assets/image_1761406843052.png";
import edmBannerImg from "@assets/image_1761406864230.png";

interface AdSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: Array<{
    id: string;
    advertiser: string;
    slot: string;
    startDate: string;
    endDate: string;
    status: "부킹확정" | "집행중";
  }>;
}

export function AdSlotDialog({ open, onOpenChange, date, events }: AdSlotDialogProps) {
  if (!date) return null;

  const dateStr = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dateEvents = events.filter((event) => {
    const targetDateStr = date.toISOString().split("T")[0];
    return targetDateStr >= event.startDate && targetDateStr <= event.endDate;
  });

  const allSlots = [
    { name: "메인배너", positions: 8 },
    { name: "사이드배너1", positions: 4 },
    { name: "사이드배너2", positions: 4 },
    { name: "사이드배너3", positions: 4 },
    { name: "뉴스레터배너", positions: 3 },
    { name: "eDM", positions: 1 },
  ];

  const normalizeSlotName = (slotName: string): string[] => {
    if (slotName === "사이드배너") {
      return ["사이드배너1", "사이드배너2", "사이드배너3"];
    }
    if (slotName === "뉴스레터") {
      return ["뉴스레터배너"];
    }
    return [slotName];
  };

  const getOccupiedPositions = (slotName: string) => {
    return dateEvents.filter((event) => {
      const normalizedNames = normalizeSlotName(event.slot);
      return normalizedNames.includes(slotName);
    }).length;
  };

  const getBannerImage = (slotName: string) => {
    if (slotName === "메인배너") return mainBannerImg;
    if (slotName.startsWith("사이드배너")) return sideBannerImg;
    if (slotName === "뉴스레터배너") return newsletterBannerImg;
    if (slotName === "eDM") return edmBannerImg;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-ad-slots">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            광고 구좌 현황 - {dateStr}
          </DialogTitle>
          <DialogDescription>
            선택한 날짜의 광고 구좌 현황을 확인하고 관리하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {allSlots.map((slot) => {
            const occupied = getOccupiedPositions(slot.name);
            const available = slot.positions - occupied;
            const occupancyRate = Math.round((occupied / slot.positions) * 100);

            const bannerImage = getBannerImage(slot.name);
            
            return (
              <div
                key={slot.name}
                className="p-4 border rounded-md hover-elevate"
                data-testid={`slot-${slot.name}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{slot.name}</h3>
                  </div>
                  <Badge
                    variant={available > 0 ? "outline" : "secondary"}
                    className={
                      available > 0
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {occupied}/{slot.positions} 사용중
                  </Badge>
                </div>

                {bannerImage && (
                  <div className="mb-3 relative group overflow-hidden rounded-md">
                    <img 
                      src={bannerImage} 
                      alt={slot.name}
                      className="w-full h-auto rounded-md border scale-125"
                    />
                    <div className={`absolute inset-0 rounded-md transition-opacity ${
                      occupancyRate >= 100 
                        ? "bg-red-500/20" 
                        : occupancyRate >= 80 
                        ? "bg-yellow-500/20" 
                        : "bg-green-500/10"
                    }`} />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        occupancyRate >= 80
                          ? "bg-red-500"
                          : occupancyRate >= 50
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {occupancyRate}%
                  </span>
                </div>

                {dateEvents
                  .filter((event) => {
                    const normalizedNames = normalizeSlotName(event.slot);
                    return normalizedNames.includes(slot.name);
                  })
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-md mt-2"
                      data-testid={`event-${event.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{event.advertiser}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          event.status === "집행중"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
            닫기
          </Button>
          <Button data-testid="button-manage-slots">구좌 관리</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
