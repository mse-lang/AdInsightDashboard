import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AirtableAdvertiser } from "@/types/airtable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Search, Filter, Users, Building2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

const statusColors = {
  Lead: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const statusLabels = {
  Lead: "리드",
  Active: "활성",
  Inactive: "비활성",
};

export default function AdvertisersAirtable() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");

  const { data: advertisers = [], isLoading } = useQuery<AirtableAdvertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  // Get unique industries for filter (including null/undefined for unclassified)
  const allIndustries = advertisers.map(a => a.industry);
  const hasUnclassified = allIndustries.some(i => !i);
  const industries = Array.from(new Set(allIndustries.filter(Boolean)));

  // Filter advertisers
  const filteredAdvertisers = advertisers.filter((advertiser) => {
    const searchLower = (searchTerm ?? '').toLowerCase();
    
    // Safely handle potentially undefined fields
    const companyName = (advertiser.companyName ?? '').toLowerCase();
    const contactPerson = (advertiser.contactPerson ?? '').toLowerCase();
    const email = (advertiser.email ?? '').toLowerCase();
    
    const matchesSearch =
      searchTerm === "" ||
      companyName.includes(searchLower) ||
      contactPerson.includes(searchLower) ||
      email.includes(searchLower);
      
    const matchesStatus = statusFilter === "all" || advertiser.status === statusFilter;
    
    const matchesIndustry = 
      industryFilter === "all" || 
      (industryFilter === "__UNCLASSIFIED__" ? advertiser.industry == null : advertiser.industry === industryFilter);
      
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  return (
    <div className="space-y-6" data-testid="page-advertisers-airtable">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">광고주 관리</h1>
          <p className="text-muted-foreground mt-2">
            광고주 정보를 조회하고 관리합니다
          </p>
        </div>
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 광고주</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advertisers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              전체 등록 광고주
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 광고주</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {advertisers.filter((a) => a.status === "Active").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              현재 활성 상태
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">리드</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {advertisers.filter((a) => a.status === "Lead").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              잠재 고객
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>광고주 목록</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="회사명, 담당자, 이메일 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-advertisers"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="Lead">리드</SelectItem>
                  <SelectItem value="Active">활성</SelectItem>
                  <SelectItem value="Inactive">비활성</SelectItem>
                </SelectContent>
              </Select>
              {(industries.length > 0 || hasUnclassified) && (
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-32" data-testid="select-industry-filter">
                    <SelectValue placeholder="업종" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                    {hasUnclassified && (
                      <SelectItem value="__UNCLASSIFIED__">미분류</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredAdvertisers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {advertisers.length === 0 ? (
                <>
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">아직 광고주가 없습니다</p>
                  <p className="text-sm mt-2">Airtable에서 광고주를 추가하세요</p>
                </>
              ) : (
                <>
                  <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">검색 결과가 없습니다</p>
                  <p className="text-sm mt-2">다른 검색어나 필터를 시도해보세요</p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>회사명</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>업종</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdvertisers.map((advertiser) => (
                    <TableRow key={advertiser.id} data-testid={`row-advertiser-${advertiser.id}`}>
                      <TableCell className="font-medium">
                        {advertiser.companyName}
                      </TableCell>
                      <TableCell>{advertiser.contactPerson}</TableCell>
                      <TableCell className="text-sm">{advertiser.email}</TableCell>
                      <TableCell>{advertiser.phone}</TableCell>
                      <TableCell>{advertiser.industry || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[advertiser.status]}
                          data-testid={`status-${advertiser.status}`}
                        >
                          {statusLabels[advertiser.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/advertisers/${advertiser.id}`)}
                          data-testid={`button-view-${advertiser.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          상세보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
