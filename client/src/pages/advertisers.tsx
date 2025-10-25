import { AddAdvertiserDialog } from "@/components/add-advertiser-dialog";
import { EditAdvertiserDialog } from "@/components/edit-advertiser-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Advertiser, Contact, Quote } from "@shared/schema";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusDropdown } from "@/components/status-dropdown";
import type { AdStatus } from "@/components/status-badge";

export default function Advertisers() {
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<string | null>(null);
  const [editingAdvertiserId, setEditingAdvertiserId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    setFilterType(filter);
  }, [window.location.search]);
  
  const { data: advertisers = [], isLoading } = useQuery<Advertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: allContacts = [] } = useQuery<Record<number, Contact[]>>({
    queryKey: ["/api/contacts/all"],
    queryFn: async () => {
      const contactsByAdvertiser: Record<number, Contact[]> = {};
      
      for (const advertiser of advertisers) {
        const res = await fetch(`/api/advertisers/${advertiser.id}/contacts`);
        const contacts = await res.json();
        contactsByAdvertiser[advertiser.id] = contacts;
      }
      
      return contactsByAdvertiser;
    },
    enabled: advertisers.length > 0,
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

  const handleEditAdvertiser = (id: string) => {
    setEditingAdvertiserId(parseInt(id));
    setIsEditDialogOpen(true);
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

  const mappedAdvertisers = filteredAdvertisers.map((adv) => {
    const contacts = allContacts[adv.id] || [];
    const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];
    
    // 광고주의 모든 견적서 총액 계산
    const advertiserQuotes = quotes.filter(q => q.advertiserId === adv.id);
    const totalQuoteAmount = advertiserQuotes.reduce((sum, quote) => {
      return sum + parseInt(quote.total || "0");
    }, 0);
    
    return {
      id: adv.id.toString(),
      name: adv.name,
      contact: primaryContact?.name || "-",
      email: primaryContact?.email || "-",
      status: adv.status as any,
      amount: totalQuoteAmount > 0 ? `₩${totalQuoteAmount.toLocaleString()}` : "₩0",
      date: adv.inquiryDate,
    };
  });

  const toggleFilter = (filter: string) => {
    if (filterType === filter) {
      setFilterType(null);
      setLocation("/advertisers");
    } else {
      setFilterType(filter);
      setLocation(`/advertisers?filter=${filter}`);
    }
  };

  const filters = [
    { id: 'inquiry', label: '신규 문의', description: '문의중, 견적제시, 일정조율중' },
    { id: 'active', label: '집행중 광고', description: '부킹확정, 집행중' },
  ];

  return (
    <div className="space-y-6" data-testid="page-advertisers">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">광고주 관리</h1>
          <p className="text-muted-foreground mt-1">모든 광고주를 관리하고 상태를 추적하세요</p>
        </div>
        <AddAdvertiserDialog />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">필터:</span>
        {filters.map((filter) => (
          <Badge
            key={filter.id}
            variant={filterType === filter.id ? "default" : "outline"}
            className="cursor-pointer hover-elevate"
            onClick={() => toggleFilter(filter.id)}
            data-testid={`badge-filter-${filter.id}`}
          >
            {filter.label}
            {filterType === filter.id && <X className="h-3 w-3 ml-1" />}
          </Badge>
        ))}
      </div>

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
                <TableHead>광고주명</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappedAdvertisers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    광고주가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                mappedAdvertisers.map((advertiser) => (
                  <TableRow 
                    key={advertiser.id} 
                    className="hover-elevate"
                    data-testid={`row-advertiser-${advertiser.id}`}
                  >
                    <TableCell 
                      className="font-medium cursor-pointer hover:text-primary hover:underline"
                      onClick={() => handleEditAdvertiser(advertiser.id)}
                      data-testid={`cell-name-${advertiser.id}`}
                    >
                      {advertiser.name}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer hover:text-primary hover:underline"
                      onClick={() => handleEditAdvertiser(advertiser.id)}
                      data-testid={`cell-contact-${advertiser.id}`}
                    >
                      {advertiser.contact}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer hover:text-primary hover:underline"
                      onClick={() => handleEditAdvertiser(advertiser.id)}
                      data-testid={`cell-email-${advertiser.id}`}
                    >
                      {advertiser.email}
                    </TableCell>
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`cell-status-${advertiser.id}`}
                    >
                      <StatusDropdown
                        currentStatus={advertiser.status}
                        onStatusChange={(newStatus) => handleStatusChange(advertiser.id, newStatus)}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono">{advertiser.amount}</TableCell>
                    <TableCell className="text-muted-foreground">{advertiser.date}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(advertiser.id)}
                        data-testid={`button-view-${advertiser.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <EditAdvertiserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        advertiserId={editingAdvertiserId}
      />
    </div>
  );
}
