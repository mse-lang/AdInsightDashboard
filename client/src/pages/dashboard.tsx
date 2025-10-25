import { useState } from "react";
import { StatCard } from "@/components/stat-card";
import { ProgressPipeline } from "@/components/progress-pipeline";
import { AdvertiserTable } from "@/components/advertiser-table";
import { PerformanceChart } from "@/components/performance-chart";
import { SalesPieChart } from "@/components/sales-pie-chart";
import { NotificationBanner } from "@/components/notification-banner";
import { CalendarView } from "@/components/calendar-view";
import { Users, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [hasNotification, setHasNotification] = useState(true);
  const [, setLocation] = useLocation();

  // Mock data - todo: remove mock functionality
  const mockStages = [
    { status: "문의중" as const, count: 5 },
    { status: "견적제시" as const, count: 3 },
    { status: "일정조율중" as const, count: 2 },
    { status: "부킹확정" as const, count: 8 },
    { status: "집행중" as const, count: 12 },
    { status: "결과보고" as const, count: 4 },
    { status: "세금계산서 발행 및 대금 청구" as const, count: 1 },
    { status: "매출 입금" as const, count: 6 },
  ];

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

  const mockChartData = [
    { month: "1월", amount: 3500 },
    { month: "2월", amount: 4200 },
    { month: "3월", amount: 3800 },
    { month: "4월", amount: 5100 },
    { month: "5월", amount: 4700 },
    { month: "6월", amount: 5500 },
  ];

  const mockPieData = [
    { name: "메인배너", value: 8000 },
    { name: "사이드배너", value: 4500 },
    { name: "뉴스레터", value: 2400 },
    { name: "eDM", value: 3200 },
  ];

  const mockCalendarEvents = [
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
      slot: "사이드배너",
      startDate: "2024-01-20",
      endDate: "2024-02-05",
      status: "부킹확정" as const,
    },
  ];

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      {hasNotification && (
        <NotificationBanner
          message="광고주 문의가 도착했습니다."
          onDismiss={() => setHasNotification(false)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="신규 문의"
          value={12}
          icon={Users}
          change={{ value: "8.2%", trend: "up" }}
          onClick={() => setLocation("/advertisers?filter=inquiry")}
        />
        <StatCard 
          title="집행중 광고" 
          value={24} 
          icon={TrendingUp}
          onClick={() => setLocation("/advertisers?filter=active")}
        />
        <StatCard
          title="이번달 매출"
          value="₩45,000,000"
          icon={DollarSign}
          change={{ value: "12.5%", trend: "up" }}
        />
        <StatCard title="진행 건수" value={38} icon={Calendar} />
      </div>

      <ProgressPipeline stages={mockStages} />

      <CalendarView events={mockCalendarEvents} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart data={mockChartData} />
        <SalesPieChart data={mockPieData} />
      </div>

      <AdvertiserTable
        advertisers={mockAdvertisers}
        onViewDetails={(id) => console.log("View details:", id)}
        onStatusChange={(id, status) => console.log("Status changed:", id, status)}
      />
    </div>
  );
}
