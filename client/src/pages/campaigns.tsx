import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AirtableCampaign, AirtableAdvertiser } from "@/types/airtable";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, Search, Filter, Plus, Edit, Trash2, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColors = {
  Planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels = {
  Planning: "기획",
  Active: "진행중",
  Completed: "완료",
  Cancelled: "취소",
};

const campaignSchema = z.object({
  campaignName: z.string().min(1, "캠페인명을 입력하세요"),
  advertiserId: z.string().min(1, "광고주를 선택하세요"),
  startDate: z.string().min(1, "시작일을 입력하세요"),
  endDate: z.string().min(1, "종료일을 입력하세요"),
  status: z.enum(["Planning", "Active", "Completed", "Cancelled"]),
  utmCampaign: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AirtableCampaign | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<AirtableCampaign | null>(null);
  const { toast } = useToast();

  const { data: campaigns = [], isLoading } = useQuery<AirtableCampaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: advertisers = [] } = useQuery<AirtableAdvertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaignName: "",
      advertiserId: "",
      startDate: "",
      endDate: "",
      status: "Planning",
      utmCampaign: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CampaignFormData) =>
      apiRequest("POST", "/api/campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "캠페인 추가 완료",
        description: "새로운 캠페인이 생성되었습니다.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "캠페인 추가 실패",
        description: error.message || "캠페인 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CampaignFormData }) =>
      apiRequest("PATCH", `/api/campaigns/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "캠페인 수정 완료",
        description: "캠페인 정보가 업데이트되었습니다.",
      });
      setDialogOpen(false);
      setEditingCampaign(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "캠페인 수정 실패",
        description: error.message || "캠페인 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "캠페인 삭제 완료",
        description: "캠페인이 삭제되었습니다.",
      });
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "캠페인 삭제 실패",
        description: error.message || "캠페인 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleAddClick = () => {
    setEditingCampaign(null);
    form.reset({
      campaignName: "",
      advertiserId: "",
      startDate: "",
      endDate: "",
      status: "Planning",
      utmCampaign: "",
    });
    setDialogOpen(true);
  };

  const handleEditClick = (campaign: AirtableCampaign) => {
    setEditingCampaign(campaign);
    form.reset({
      campaignName: campaign.campaignName,
      advertiserId: campaign.advertiserId || "",
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status,
      utmCampaign: campaign.utmCampaign || "",
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (campaign: AirtableCampaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: CampaignFormData) => {
    if (editingCampaign) {
      updateMutation.mutate({ id: editingCampaign.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (campaignToDelete) {
      deleteMutation.mutate(campaignToDelete.id);
    }
  };

  const getAdvertiserName = (advertiserId: string | null) => {
    if (!advertiserId) return "-";
    const advertiser = advertisers.find(a => a.id === advertiserId);
    return advertiser?.companyName || "-";
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const searchLower = (searchTerm ?? '').toLowerCase();
    const campaignName = (campaign.campaignName ?? '').toLowerCase();
    const advertiserName = getAdvertiserName(campaign.advertiserId).toLowerCase();
    
    const matchesSearch =
      searchTerm === "" ||
      campaignName.includes(searchLower) ||
      advertiserName.includes(searchLower);
      
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6" data-testid="page-campaigns">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">캠페인 관리</h1>
          <p className="text-muted-foreground mt-2">
            광고 캠페인을 생성하고 관리합니다
          </p>
        </div>
        <Briefcase className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 캠페인</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              전체 캠페인
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행중</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {campaigns.filter((c) => c.status === "Active").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              현재 진행중
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {campaigns.filter((c) => c.status === "Completed").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              완료된 캠페인
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">기획</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {campaigns.filter((c) => c.status === "Planning").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              기획 단계
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filter, and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>캠페인 목록</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="캠페인명, 광고주 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-campaigns"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="Planning">기획</SelectItem>
                  <SelectItem value="Active">진행중</SelectItem>
                  <SelectItem value="Completed">완료</SelectItem>
                  <SelectItem value="Cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddClick}
                data-testid="button-add-campaign"
              >
                <Plus className="h-4 w-4 mr-2" />
                캠페인 추가
              </Button>
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
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {campaigns.length === 0 ? (
                <>
                  <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">아직 캠페인이 없습니다</p>
                  <p className="text-sm mt-2">캠페인 추가 버튼을 클릭하여 새 캠페인을 생성하세요</p>
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
                    <TableHead>캠페인명</TableHead>
                    <TableHead>광고주</TableHead>
                    <TableHead>시작일</TableHead>
                    <TableHead>종료일</TableHead>
                    <TableHead>UTM</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                      <TableCell className="font-medium">
                        {campaign.campaignName}
                      </TableCell>
                      <TableCell>{getAdvertiserName(campaign.advertiserId)}</TableCell>
                      <TableCell>{formatDate(campaign.startDate)}</TableCell>
                      <TableCell>{formatDate(campaign.endDate)}</TableCell>
                      <TableCell className="text-sm">{campaign.utmCampaign || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[campaign.status]}
                          data-testid={`status-${campaign.status}`}
                        >
                          {statusLabels[campaign.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(campaign)}
                            data-testid={`button-edit-${campaign.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(campaign)}
                            data-testid={`button-delete-${campaign.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? "캠페인 수정" : "새 캠페인 추가"}
            </DialogTitle>
            <DialogDescription>
              {editingCampaign
                ? "캠페인 정보를 수정합니다."
                : "새로운 캠페인을 생성합니다."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="campaignName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>캠페인명 *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-campaign-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="advertiserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>광고주 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-advertiser">
                          <SelectValue placeholder="광고주를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {advertisers.map((advertiser) => (
                          <SelectItem key={advertiser.id} value={advertiser.id}>
                            {advertiser.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>시작일 *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>종료일 *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-end-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상태 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Planning">기획</SelectItem>
                          <SelectItem value="Active">진행중</SelectItem>
                          <SelectItem value="Completed">완료</SelectItem>
                          <SelectItem value="Cancelled">취소</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="utmCampaign"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UTM Campaign</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-utm-campaign" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {editingCampaign ? "수정" : "추가"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>캠페인 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>{campaignToDelete?.campaignName}</strong>을(를) 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
              className="bg-destructive hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
