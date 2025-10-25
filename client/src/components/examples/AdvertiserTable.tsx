import { AdvertiserTable } from "../advertiser-table";

export default function AdvertiserTableExample() {
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
  ];

  return (
    <div className="p-6">
      <AdvertiserTable 
        advertisers={mockAdvertisers} 
        onViewDetails={(id) => console.log("View details for:", id)}
      />
    </div>
  );
}
