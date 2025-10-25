import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Ad, Advertiser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Building2, Calendar, DollarSign, FileText } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { StatusDropdown } from "@/components/status-dropdown";
import type { AdStatus } from "@/components/status-badge";

export default function AdDetail() {
  const [, params] = useRoute("/ads/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const adId = params?.id ? parseInt(params.id) : 0;

  const { data: ad, isLoading: adLoading } = useQuery<Ad>({
    queryKey: ["/api/ads", adId],
    enabled: !!adId,
  });

  const { data: advertiser, isLoading: advertiserLoading } = useQuery<Advertiser>({
    queryKey: ["/api/advertisers", ad?.advertiserId],
    enabled: !!ad?.advertiserId,
  });

  const updateAdStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/ads/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads", adId] });
      toast({
        title: "상태 변경 완료",
        description: "광고 상태가 성공적으로 변경되었습니다.",
      });
    },
  });

  const handleStatusChange = (status: AdStatus) => {
    updateAdStatusMutation.mutate({ id: adId, status });
  };

  if (adLoading || !ad) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-ad-detail">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/ads")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{ad.adId}</h1>
            <p className="text-muted-foreground mt-1">광고 상세 정보</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              광고주
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {advertiserLoading ? <Skeleton className="h-8 w-32" /> : advertiser?.name || "-"}
            </p>
            {advertiser && (
              <Button
                variant="link"
                className="p-0 h-auto mt-2"
                onClick={() => setLocation(`/advertisers/${advertiser.id}`)}
              >
                광고주 상세보기
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDropdown
              currentStatus={ad.status as AdStatus}
              onStatusChange={handleStatusChange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              금액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {ad.amount ? `₩${parseInt(ad.amount).toLocaleString()}` : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            광고 기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">광고 ID</p>
              <p className="font-medium">{ad.adId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">상태</p>
              <StatusDropdown
                currentStatus={ad.status as AdStatus}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">시작일</p>
              <p className="font-medium">
                {ad.startDate ? format(new Date(ad.startDate), "yyyy-MM-dd") : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">종료일</p>
              <p className="font-medium">
                {ad.endDate ? format(new Date(ad.endDate), "yyyy-MM-dd") : "-"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">금액</p>
            <p className="font-medium">
              {ad.amount ? `₩${parseInt(ad.amount).toLocaleString()}` : "-"}
            </p>
          </div>

          {ad.description && (
            <div>
              <p className="text-sm text-muted-foreground">설명</p>
              <p className="font-medium whitespace-pre-wrap">{ad.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
