import { AdvertiserTable } from "@/components/advertiser-table";
import { AddAdvertiserDialog } from "@/components/add-advertiser-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Advertiser } from "@shared/schema";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Advertisers() {
  const [, setLocation] = useLocation();
  
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

  const mappedAdvertisers = advertisers.map((adv) => ({
    id: adv.id.toString(),
    name: adv.name,
    contact: adv.contact,
    email: adv.email,
    status: adv.status as any,
    amount: adv.amount ? `₩${parseInt(adv.amount).toLocaleString()}` : "₩0",
    date: adv.inquiryDate,
  }));

  return (
    <div className="space-y-6" data-testid="page-advertisers">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">광고주 관리</h1>
          <p className="text-muted-foreground mt-1">모든 광고주를 관리하고 상태를 추적하세요</p>
        </div>
        <AddAdvertiserDialog />
      </div>

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
