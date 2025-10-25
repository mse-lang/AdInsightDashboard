import { CalendarView } from "../calendar-view";

export default function CalendarViewExample() {
  const mockEvents = [
    {
      id: "1",
      advertiser: "테크스타트업",
      slot: "메인배너",
      startDate: "2024-01-15",
      endDate: "2024-01-25",
      status: "집행중" as const,
    },
    {
      id: "2",
      advertiser: "이커머스컴퍼니",
      slot: "사이드배너 1",
      startDate: "2024-01-20",
      endDate: "2024-02-05",
      status: "부킹확정" as const,
    },
    {
      id: "3",
      advertiser: "핀테크솔루션",
      slot: "뉴스레터",
      startDate: "2024-02-01",
      endDate: "2024-02-28",
      status: "집행중" as const,
    },
  ];

  return (
    <div className="p-6">
      <CalendarView events={mockEvents} />
    </div>
  );
}
