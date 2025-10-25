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
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Eye, MousePointer, Mail } from "lucide-react";

export default function Analytics() {
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
              <CardTitle>광고 성과 Top 3</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>광고주</TableHead>
                    <TableHead>구좌</TableHead>
                    <TableHead className="text-right">노출수</TableHead>
                    <TableHead className="text-right">클릭수</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTopPerformers.map((performer, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{performer.advertiser}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{performer.slot}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{performer.impressions}</TableCell>
                      <TableCell className="text-right font-mono">{performer.clicks}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{performer.ctr}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
