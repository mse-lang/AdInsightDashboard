import { AdSlotCard } from "@/components/ad-slot-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdSlots() {
  const { toast } = useToast();
  // Mock data - todo: remove mock functionality
  const mockSlots = [
    {
      id: "1",
      name: "메인배너",
      maxSlots: 8,
      currentSlots: 5,
      price: "₩1,000,000",
      status: "partial" as const,
    },
    {
      id: "2",
      name: "사이드배너 1",
      maxSlots: 4,
      currentSlots: 0,
      price: "₩500,000",
      status: "available" as const,
    },
    {
      id: "3",
      name: "사이드배너 2",
      maxSlots: 4,
      currentSlots: 2,
      price: "₩500,000",
      status: "partial" as const,
    },
    {
      id: "4",
      name: "사이드배너 3",
      maxSlots: 4,
      currentSlots: 4,
      price: "₩500,000",
      status: "full" as const,
    },
    {
      id: "5",
      name: "뉴스레터 배너",
      maxSlots: 3,
      currentSlots: 2,
      price: "₩800,000",
      status: "partial" as const,
    },
    {
      id: "6",
      name: "eDM 전체 이미지",
      maxSlots: 1,
      currentSlots: 0,
      price: "₩1,200,000",
      status: "available" as const,
    },
  ];

  return (
    <div className="space-y-6" data-testid="page-ad-slots">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">광고 구좌 관리</h1>
          <p className="text-muted-foreground mt-1">광고 구좌별 현황을 확인하고 관리하세요</p>
        </div>
        <Button 
          onClick={() => toast({
            title: "구좌 추가 기능",
            description: "이 기능은 현재 개발 중입니다.",
          })}
          data-testid="button-add-slot"
        >
          <Plus className="h-4 w-4 mr-2" />
          구좌 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockSlots.map((slot) => (
          <AdSlotCard
            key={slot.id}
            slot={slot}
            onEdit={(id) => console.log("Edit slot:", id)}
            onView={(id) => console.log("View slot:", id)}
          />
        ))}
      </div>
    </div>
  );
}
