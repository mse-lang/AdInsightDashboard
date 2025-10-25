import { AdvertiserTable } from "@/components/advertiser-table";
import { AddAdvertiserDialog } from "@/components/add-advertiser-dialog";

export default function Advertisers() {
  // Mock data - todo: remove mock functionality
  const mockAdvertisers = [
    {
      id: "1",
      name: "테크스타트업",
      contact: "010-1234-5678",
      email: "contact@techstartup.com",
      status: "집행중" as const,
      amount: "₩5,000,000",
      date: "2024-01-15",
    },
    {
      id: "2",
      name: "이커머스컴퍼니",
      contact: "010-9876-5432",
      email: "ad@ecommerce.com",
      status: "견적제시" as const,
      amount: "₩3,000,000",
      date: "2024-01-20",
    },
    {
      id: "3",
      name: "핀테크솔루션",
      contact: "010-5555-1234",
      email: "marketing@fintech.com",
      status: "문의중" as const,
      amount: "₩8,000,000",
      date: "2024-01-22",
    },
    {
      id: "4",
      name: "모빌리티플랫폼",
      contact: "010-7777-8888",
      email: "ads@mobility.com",
      status: "부킹확정" as const,
      amount: "₩6,500,000",
      date: "2024-01-18",
    },
  ];

  return (
    <div className="space-y-6" data-testid="page-advertisers">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">광고주 관리</h1>
          <p className="text-muted-foreground mt-1">모든 광고주를 관리하고 상태를 추적하세요</p>
        </div>
        <AddAdvertiserDialog onAdd={(data) => console.log("New advertiser:", data)} />
      </div>

      <AdvertiserTable
        advertisers={mockAdvertisers}
        onViewDetails={(id) => console.log("View details:", id)}
        onStatusChange={(id, status) => console.log("Status changed:", id, status)}
      />
    </div>
  );
}
