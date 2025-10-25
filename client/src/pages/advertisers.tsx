import { AdvertiserTable } from "@/components/advertiser-table";
import { AddAdvertiserDialog } from "@/components/add-advertiser-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Advertiser } from "@shared/schema";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function Advertisers() {
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<string | null>(null);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    setFilterType(filter);
  }, [window.location.search]);
  
  const { data: advertisers = [], isLoading } = useQuery<Advertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/advertisers/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers"] });
    },
  });

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id: parseInt(id), status });
  };

  const handleViewDetails = (id: string) => {
    setLocation(`/advertisers/${id}`);
  };

  const filteredAdvertisers = useMemo(() => {
    if (!filterType) return advertisers;
    
    if (filterType === 'inquiry') {
      return advertisers.filter(adv => 
        ['문의중', '견적제시', '일정조율중'].includes(adv.status)
      );
    }
    
    if (filterType === 'active') {
      return advertisers.filter(adv => 
        ['부킹확정', '집행중'].includes(adv.status)
      );
    }
    
    return advertisers;
  }, [advertisers, filterType]);

  const mappedAdvertisers = filteredAdvertisers.map((adv) => ({
    id: adv.id.toString(),
    name: adv.name,
    contact: adv.contact,
    email: adv.email,
    status: adv.status as any,
    amount: adv.amount ? `₩${parseInt(adv.amount).toLocaleString()}` : "₩0",
    date: adv.inquiryDate,
  }));

  const clearFilter = () => {
    setFilterType(null);
    setLocation("/advertisers");
  };

  const getFilterLabel = () => {
    if (filterType === 'inquiry') return '신규 문의';
    if (filterType === 'active') return '집행중 광고';
    return null;
  };

  return (
    <div className="space-y-6" data-testid="page-advertisers">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">광고주 관리</h1>
          <p className="text-muted-foreground mt-1">모든 광고주를 관리하고 상태를 추적하세요</p>
        </div>
        <AddAdvertiserDialog />
      </div>

      {filterType && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">필터:</span>
          <Badge 
            variant="secondary" 
            className="gap-1 cursor-pointer hover-elevate"
            onClick={clearFilter}
            data-testid="badge-filter"
          >
            {getFilterLabel()}
            <X className="h-3 w-3" />
          </Badge>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <AdvertiserTable
          advertisers={mappedAdvertisers}
          onViewDetails={handleViewDetails}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
