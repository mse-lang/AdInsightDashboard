import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceChart } from "@/components/performance-chart";
import { SalesPieChart } from "@/components/sales-pie-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Eye, MousePointer, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Advertiser } from "@shared/schema";

export default function Analytics() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: advertisers = [] } = useQuery<Advertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const threeMonthsAgo = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date;
  }, []);

  const executedAds = useMemo(() => {
    const executedStatuses = ["집행중", "결과보고", "세금계산서 발행 및 대금 청구", "매출 입금"];
    return advertisers.filter(adv => {
      const isExecuted = executedStatuses.includes(adv.status);
      if (!isExecuted) return false;
      
      const inquiryDate = new Date(adv.inquiryDate);
      return inquiryDate >= threeMonthsAgo;
    }).sort((a, b) => {
      return new Date(b.inquiryDate).getTime() - new Date(a.inquiryDate).getTime();
    });
  }, [advertisers, threeMonthsAgo]);

  const totalPages = Math.ceil(executedAds.length / itemsPerPage);
  const paginatedAds = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return executedAds.slice(startIndex, startIndex + itemsPerPage);
  }, [executedAds, currentPage, itemsPerPage]);

  const mockMonthlyData = [
    { month: "1월", amount: 3500 },
    { month: "2월", amount: 4200 },
    { month: "3월", amount: 3800 },
    { month: "4월", amount: 5100 },
    { month: "5월", amount: 4700 },
    { month: "6월", amount: 5500 },
  ];

  const mockSlotData = [
    { name: "메인배너", value: 8000 },
    { name: "사이드배너", value: 4500 },
    { name: "뉴스레터", value: 2400 },
    { name: "eDM", value: 3200 },
  ];

  const mockNewsletterStats = [
    { metric: "발송 건수", value: "12,450", change: "+8.2%", trend: "up" },
    { metric: "오픈율", value: "34.2%", change: "+2.5%", trend: "up" },
    { metric: "클릭율", value: "12.8%", change: "-1.2%", trend: "down" },
    { metric: "구독자 수", value: "15,234", change: "+156", trend: "up" },
  ];

  const mockWebStats = [
    { metric: "페이지뷰", value: "45,892", change: "+12.4%", trend: "up" },
    { metric: "순방문자", value: "23,451", change: "+8.9%", trend: "up" },
    { metric: "평균 체류시간", value: "3분 24초", change: "+15초", trend: "up" },
    { metric: "이탈률", value: "42.3%", change: "-3.1%", trend: "up" },
  ];

  const mockTopPerformers = [
    { advertiser: "테크스타트업", slot: "메인배너", impressions: "45,892", clicks: "2,345", ctr: "5.11%" },
    { advertiser: "이커머스컴퍼니", slot: "사이드배너", impressions: "23,451", clicks: "1,234", ctr: "5.26%" },
    { advertiser: "핀테크솔루션", slot: "뉴스레터", impressions: "15,234", clicks: "892", ctr: "5.86%" },
  ];

  return (
    <div className="space-y-6" data-testid="page-analytics">
      <div>
        <h1 className="text-3xl font-bold">성과 분석</h1>
        <p className="text-muted-foreground mt-1">광고 성과를 분석하고 인사이트를 얻으세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart data={mockMonthlyData} title="월별 광고 집행 금액" />
        <SalesPieChart data={mockSlotData} title="구좌별 판매 현황" />
      </div>

      <Tabs defaultValue="newsletter" className="space-y-6">
        <TabsList>
          <TabsTrigger value="newsletter" data-testid="tab-newsletter">
            <Mail className="h-4 w-4 mr-2" />
            뉴스레터 분석
          </TabsTrigger>
          <TabsTrigger value="web" data-testid="tab-web">
            <Eye className="h-4 w-4 mr-2" />
            웹 분석
          </TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            광고 성과
          </TabsTrigger>
        </TabsList>

        <TabsContent value="newsletter" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockNewsletterStats.map((stat) => (
              <Card key={stat.metric}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{stat.metric}</p>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p
                    className={`text-xs mt-1 flex items-center ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>뉴스레터 성과 (Stibee 연동)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Stibee API와 연동하여 실시간 뉴스레터 성과를 확인하세요.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="web" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockWebStats.map((stat) => (
              <Card key={stat.metric}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{stat.metric}</p>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Google Analytics 연동</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Google Analytics API와 연동하여 웹사이트 트래픽 및 사용자 행동을 분석하세요.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>광고 성과 - 최근 3개월</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    총 {executedAds.length}건의 집행 광고
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {paginatedAds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  최근 3개월 내 집행한 광고가 없습니다
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>광고주</TableHead>
                        <TableHead>담당자</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>광고 금액</TableHead>
                        <TableHead>문의일자</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAds.map((ad) => (
                        <TableRow key={ad.id} data-testid={`row-ad-${ad.id}`}>
                          <TableCell className="font-medium">{ad.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm">{ad.contact}</span>
                              <span className="text-xs text-muted-foreground">{ad.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                ad.status === "집행중" 
                                  ? "default" 
                                  : ad.status === "매출 입금" 
                                  ? "secondary" 
                                  : "outline"
                              }
                            >
                              {ad.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {ad.amount || "₩0"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(ad.inquiryDate).toLocaleDateString("ko-KR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              data-testid="button-prev-page"
                            />
                          </PaginationItem>
                          
                          {[...Array(totalPages)].map((_, idx) => {
                            const pageNum = idx + 1;
                            if (
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(pageNum)}
                                    isActive={currentPage === pageNum}
                                    className="cursor-pointer"
                                    data-testid={`button-page-${pageNum}`}
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            } else if (
                              pageNum === currentPage - 2 ||
                              pageNum === currentPage + 2
                            ) {
                              return (
                                <PaginationItem key={pageNum}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }
                            return null;
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              data-testid="button-next-page"
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
