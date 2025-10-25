import { AdSlotCard } from "../ad-slot-card";

export default function AdSlotCardExample() {
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
      name: "뉴스레터 배너",
      maxSlots: 1,
      currentSlots: 1,
      price: "₩800,000",
      status: "full" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {mockSlots.map((slot) => (
        <AdSlotCard
          key={slot.id}
          slot={slot}
          onEdit={(id) => console.log("Edit slot:", id)}
          onView={(id) => console.log("View slot:", id)}
        />
      ))}
    </div>
  );
}
