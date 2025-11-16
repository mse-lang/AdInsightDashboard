import { useState, useMemo } from "react";
import { StatCard } from "@/components/stat-card";
import { ProgressPipeline } from "@/components/progress-pipeline";
import { PerformanceChart } from "@/components/performance-chart";
import { SalesPieChart } from "@/components/sales-pie-chart";
import { NotificationBanner } from "@/components/notification-banner";
import { NavigableCalendar } from "@/components/navigable-calendar";
import { Users, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

type PipelineStatus = 
  | '문의중'
  | '견적제시'
  | '일정조율중'
  | '부킹확정'
  | '집행중'
  | '결과보고'
  | '세금계산서 발행 및 대금 청구'
  | '매출 입금';

export default function Dashboard() {
  const [hasNotification, setHasNotification] = useState(true);
  const [, setLocation] = useLocation();

  // Fetch campaign pipeline status counts
  const { data: pipelineCounts, isLoading: isLoadingPipeline } = useQuery<Record<PipelineStatus, number>>({
    queryKey: ["/api/campaigns/pipeline-counts"],
  });

  const newInquiryCount = useMemo(() => {
    if (!pipelineCounts) return 0;
    return (pipelineCounts['문의중'] || 0) + 
           (pipelineCounts['견적제시'] || 0) + 
           (pipelineCounts['일정조율중'] || 0);
  }, [pipelineCounts]);

  const activeAdsCount = useMemo(() => {
    if (!pipelineCounts) return 0;
    return (pipelineCounts['부킹확정'] || 0) + 
           (pipelineCounts['집행중'] || 0);
  }, [pipelineCounts]);

  const totalProgressCount = useMemo(() => {
    if (!pipelineCounts) return 0;
    return Object.values(pipelineCounts).reduce((sum, count) => sum + count, 0);
  }, [pipelineCounts]);

  const stagesCounts = useMemo(() => {
    if (!pipelineCounts) return [];
    
    const allStatuses: PipelineStatus[] = [
      "문의중",
      "견적제시", 
      "일정조율중",
      "부킹확정",
      "집행중",
      "결과보고",
      "세금계산서 발행 및 대금 청구",
      "매출 입금"
    ];
    
    return allStatuses.map(status => ({
      status,
      count: pipelineCounts[status] || 0
    }));
  }, [pipelineCounts]);

  // Use real data if available, otherwise show loading state
  const displayStages = isLoadingPipeline ? [] : stagesCounts;

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
          value={newInquiryCount}
          icon={Users}
          change={{ value: "8.2%", trend: "up" }}
          onClick={() => setLocation("/campaigns?filter=inquiry")}
        />
        <StatCard 
          title="집행중 광고" 
          value={activeAdsCount} 
          icon={TrendingUp}
          onClick={() => setLocation("/campaigns?filter=active")}
        />
        <StatCard
          title="이번달 매출"
          value="₩0"
          icon={DollarSign}
          change={{ value: "12.5%", trend: "up" }}
          onClick={() => setLocation("/quotes")}
        />
        <StatCard 
          title="진행 건수" 
          value={totalProgressCount} 
          icon={Calendar}
          onClick={() => setLocation("/campaigns")}
        />
      </div>

      <ProgressPipeline stages={displayStages} />

      <NavigableCalendar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart data={mockChartData} />
        <SalesPieChart data={mockPieData} />
      </div>
    </div>
  );
}
