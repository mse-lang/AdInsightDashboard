import { useQuery } from "@tanstack/react-query";
import type { Ad, Advertiser } from "@shared/schema";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { AddAdDialog } from "@/components/add-ad-dialog";

export default function Ads() {
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<string | null>(null);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    setFilterType(filter);
  }, [window.location.search]);
  
  const { data: ads = [], isLoading: adsLoading } = useQuery<Ad[]>({
    queryKey: ["/api/ads"],
  });

  const { data: advertisers = [], isLoading: advertisersLoading } = useQuery<Advertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const isLoading = adsLoading || advertisersLoading;

  const filteredAds = useMemo(() => {
    if (!filterType) return ads;
    
    if (filterType === 'inquiry') {
      return ads.filter(ad => 
        ['문의중', '견적제시', '일정조율중'].includes(ad.status)
      );
    }
    
    if (filterType === 'active') {
      return ads.filter(ad => 
        ['부킹확정', '집행중'].includes(ad.status)
      );
    }
    
    return ads;
  }, [ads, filterType]);

  const mappedAds = filteredAds.map((ad) => {
    const advertiser = advertisers.find(a => a.id === ad.advertiserId);
    
    return {
      ...ad,
      advertiserName: advertiser?.name || "-",
    };
  });

  const toggleFilter = (filter: string) => {
    if (filterType === filter) {
      setFilterType(null);
      setLocation("/ads");
    } else {
      setFilterType(filter);
      setLocation(`/ads?filter=${filter}`);
    }
  };

  const filters = [
    { id: 'inquiry', label: '신규 문의', description: '문의중, 견적제시, 일정조율중' },
    { id: 'active', label: '집행중 광고', description: '부킹확정, 집행중' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '문의중':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case '견적제시':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case '일정조율중':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case '부킹확정':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case '집행중':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case '집행완료':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case '중단':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case '보류':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-4 p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">광고 목록</h1>
            <p className="text-sm text-muted-foreground">VSAD-XXXXXX 형식의 광고를 관리합니다</p>
          </div>
          <AddAdDialog />
        </div>

        <div className="flex gap-2 flex-wrap">
          {filters.map((filter) => (
            <Badge
              key={filter.id}
              variant={filterType === filter.id ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 hover-elevate active-elevate-2"
              onClick={() => toggleFilter(filter.id)}
              data-testid={`badge-filter-${filter.id}`}
            >
              {filter.label}
              {filterType === filter.id && (
                <X className="w-3 h-3 ml-1.5" />
              )}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="header-ad-id">광고 ID</TableHead>
                  <TableHead data-testid="header-advertiser">광고주</TableHead>
                  <TableHead data-testid="header-status">상태</TableHead>
                  <TableHead data-testid="header-period">집행 기간</TableHead>
                  <TableHead data-testid="header-amount">금액</TableHead>
                  <TableHead data-testid="header-description">설명</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappedAds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      광고가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  mappedAds.map((ad) => (
                    <TableRow 
                      key={ad.id} 
                      className="cursor-pointer hover-elevate"
                      onClick={() => setLocation(`/ads/${ad.id}`)}
                      data-testid={`row-ad-${ad.id}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-ad-id-${ad.id}`}>
                        {ad.adId}
                      </TableCell>
                      <TableCell data-testid={`text-advertiser-${ad.id}`}>
                        {ad.advertiserName}
                      </TableCell>
                      <TableCell data-testid={`status-ad-${ad.id}`}>
                        <Badge className={getStatusColor(ad.status)}>
                          {ad.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-period-${ad.id}`}>
                        {ad.startDate && ad.endDate ? (
                          <>
                            {format(new Date(ad.startDate), "yyyy-MM-dd")} ~ {format(new Date(ad.endDate), "yyyy-MM-dd")}
                          </>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-amount-${ad.id}`}>
                        {ad.amount ? `₩${parseInt(ad.amount).toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" data-testid={`text-description-${ad.id}`}>
                        {ad.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
