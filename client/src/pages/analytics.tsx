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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Eye, MousePointer, Mail, AlertCircle, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Advertiser } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

type AnalyticsStat = {
  metric: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
};

type AnalyticsResponse = {
  isDemo: boolean;
  stats: AnalyticsStat[];
};

type StibeeEmail = {
  id: number;
  subject: string;
  sentTime: string;
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
};

type StibeeEmailsResponse = {
  isDemo: boolean;
  emails: StibeeEmail[];
  total: number;
};

type StibeeEmailDetail = StibeeEmail & {
  logs: any[];
};

export default function Analytics() {
  const [currentPage, setCurrentPage] = useState(1);
  const [emailPage, setEmailPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const itemsPerPage = 10;
  const emailsPerPage = 20;

  const { data: advertisers = [] } = useQuery<Advertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const { data: stibeeData } = useQuery<AnalyticsResponse>({
    queryKey: ["/api/analytics/stibee/summary"],
  });

  const { data: stibeeEmailsData } = useQuery<StibeeEmailsResponse>({
    queryKey: ["/api/analytics/stibee/emails"],
  });

  const { data: emailDetailData } = useQuery<{ isDemo: boolean; email: StibeeEmailDetail }>({
    queryKey: [`/api/analytics/stibee/emails/${selectedEmail}`],
    enabled: selectedEmail !== null,
  });

  const { data: googleData } = useQuery<AnalyticsResponse>({
    queryKey: ["/api/analytics/google"],
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

  const newsletterStats = stibeeData?.stats || [];
  const webStats = googleData?.stats || [];
  const emails = stibeeEmailsData?.emails || [];

  const emailTotalPages = Math.ceil(emails.length / emailsPerPage);
  const paginatedEmails = useMemo(() => {
    const startIndex = (emailPage - 1) * emailsPerPage;
    return emails.slice(startIndex, startIndex + emailsPerPage);
  }, [emails, emailPage, emailsPerPage]);

  const handleExportCSV = () => {
    if (emails.length === 0) return;

    const escapeCSVField = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const headers = ["제목", "발송일", "발송 건수", "오픈 건수", "클릭 건수", "오픈율", "클릭률"];
    const rows = emails.map(email => [
      escapeCSVField(email.subject),
      format(new Date(email.sentTime), "yyyy-MM-dd HH:mm:ss"),
      email.sent.toString(),
      email.opened.toString(),
      email.clicked.toString(),
      email.openRate.toFixed(1),
      email.clickRate.toFixed(1)
    ]);

    const csvContent = [
      headers.map(h => escapeCSVField(h)).join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `stibee-newsletter-stats-${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          {stibeeData?.isDemo && (
            <Alert data-testid="alert-stibee-demo">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                데모 데이터를 표시하고 있습니다. 실제 데이터를 보려면 Stibee API 키를 설정하세요.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {newsletterStats.map((stat) => (
              <Card key={stat.metric}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{stat.metric}</p>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p
                    className={`text-xs mt-1 flex items-center ${
                      stat.trend === "up" ? "text-green-600" : 
                      stat.trend === "down" ? "text-red-600" : 
                      "text-muted-foreground"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : stat.trend === "down" ? (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>이메일 발송 내역</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stibeeEmailsData?.isDemo 
                      ? "Stibee API 키를 설정하면 실제 발송 내역을 확인할 수 있습니다."
                      : `총 ${stibeeEmailsData?.total || 0}개의 이메일`}
                  </p>
                </div>
                <Button
                  onClick={handleExportCSV}
                  disabled={emails.length === 0}
                  size="sm"
                  data-testid="button-export-csv"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV 다운로드
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {emails.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {stibeeEmailsData?.isDemo 
                    ? "데모 데이터가 없습니다." 
                    : "발송된 이메일이 없습니다."}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>제목</TableHead>
                        <TableHead>발송일</TableHead>
                        <TableHead className="text-right">발송</TableHead>
                        <TableHead className="text-right">오픈</TableHead>
                        <TableHead className="text-right">클릭</TableHead>
                        <TableHead className="text-right">오픈율</TableHead>
                        <TableHead className="text-right">클릭률</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEmails.map((email) => (
                        <TableRow
                          key={email.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => setSelectedEmail(email.id)}
                          data-testid={`row-email-${email.id}`}
                        >
                          <TableCell className="font-medium max-w-md truncate">
                            {email.subject}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(email.sentTime), "yyyy-MM-dd HH:mm")}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {email.sent.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {email.opened.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {email.clicked.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={email.openRate >= 30 ? "default" : "secondary"}>
                              {email.openRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={email.clickRate >= 10 ? "default" : "secondary"}>
                              {email.clickRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {emailTotalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setEmailPage(prev => Math.max(1, prev - 1))}
                              className={emailPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              data-testid="button-email-prev-page"
                            />
                          </PaginationItem>
                          
                          {[...Array(emailTotalPages)].map((_, idx) => {
                            const pageNum = idx + 1;
                            if (
                              pageNum === 1 ||
                              pageNum === emailTotalPages ||
                              (pageNum >= emailPage - 1 && pageNum <= emailPage + 1)
                            ) {
                              return (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    onClick={() => setEmailPage(pageNum)}
                                    isActive={emailPage === pageNum}
                                    className="cursor-pointer"
                                    data-testid={`button-email-page-${pageNum}`}
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            } else if (
                              pageNum === emailPage - 2 ||
                              pageNum === emailPage + 2
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
                              onClick={() => setEmailPage(prev => Math.min(emailTotalPages, prev + 1))}
                              className={emailPage === emailTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              data-testid="button-email-next-page"
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

        <TabsContent value="web" className="space-y-6">
          {googleData?.isDemo && (
            <Alert data-testid="alert-google-demo">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                데모 데이터를 표시하고 있습니다. 실제 데이터를 보려면 Google Analytics API를 설정하세요.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {webStats.map((stat) => (
              <Card key={stat.metric}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{stat.metric}</p>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs mt-1 flex items-center ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}>
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
              <CardTitle>Google Analytics {googleData?.isDemo ? "데모" : "실시간 연동"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {googleData?.isDemo
                  ? "Google Analytics API를 설정하면 실시간 웹사이트 트래픽 및 사용자 행동을 분석할 수 있습니다."
                  : "Google Analytics API와 연동하여 실시간 데이터를 표시하고 있습니다."}
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
                              <span className="text-sm">{ad.ceoName || '-'}</span>
                              <span className="text-xs text-muted-foreground">-</span>
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

      <Dialog open={selectedEmail !== null} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>이메일 상세 통계</DialogTitle>
            <DialogDescription>
              {emailDetailData?.email?.subject || "로딩 중..."}
            </DialogDescription>
          </DialogHeader>

          {emailDetailData?.email && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">발송일</div>
                    <div className="text-lg font-semibold">
                      {format(new Date(emailDetailData.email.sentTime), "yyyy-MM-dd HH:mm")}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">발송 건수</div>
                    <div className="text-lg font-semibold">
                      {emailDetailData.email.sent.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">오픈 건수</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {emailDetailData.email.opened.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">클릭 건수</div>
                    <div className="text-lg font-semibold text-green-600">
                      {emailDetailData.email.clicked.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">오픈율</div>
                    <div className="text-lg font-semibold">
                      {emailDetailData.email.openRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">클릭률</div>
                    <div className="text-lg font-semibold">
                      {emailDetailData.email.clickRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {emailDetailData.email.logs && emailDetailData.email.logs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">최근 활동 로그 (최대 100개)</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>구독자</TableHead>
                          <TableHead>액션</TableHead>
                          <TableHead>시간</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emailDetailData.email.logs.slice(0, 20).map((log: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">
                              {log.subscriber}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                log.action === 'P' ? "secondary" :
                                log.action === 'O' ? "default" :
                                log.action === 'C' ? "default" : "outline"
                              }>
                                {log.action === 'P' ? '발송' :
                                 log.action === 'O' ? '오픈' :
                                 log.action === 'C' ? '클릭' : log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {format(new Date(log.createdTime), "yyyy-MM-dd HH:mm:ss")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
