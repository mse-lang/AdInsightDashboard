import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AirtableAdvertiser, AirtableAgency } from "@/types/airtable";
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
import { Eye, Search, Filter, Users, Building2, TrendingUp, Plus, Edit, Trash2, Upload, Download } from "lucide-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

const advertiserSchema = z.object({
  companyName: z.string().min(1, "회사명을 입력하세요"),
  businessNumber: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  adMaterials: z.string().optional(),
  contactPerson: z.string().min(1, "담당자명을 입력하세요"),
  contactPersonType: z.enum(["Advertiser", "Agency"]),
  agencyId: z.string().optional(),
  email: z.string().email("올바른 이메일을 입력하세요"),
  phone: z.string().min(1, "전화번호를 입력하세요"),
  industry: z.string().optional(),
  status: z.enum(["Lead", "Active", "Inactive"]),
});

type AdvertiserFormData = z.infer<typeof advertiserSchema>;

export default function AdvertisersAirtable() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<AirtableAdvertiser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [advertiserToDelete, setAdvertiserToDelete] = useState<AirtableAdvertiser | null>(null);
  const { toast } = useToast();

  const { data: advertisers = [], isLoading } = useQuery<AirtableAdvertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const { data: agencies = [] } = useQuery<AirtableAgency[]>({
    queryKey: ["/api/agencies"],
  });

  const form = useForm<AdvertiserFormData>({
    resolver: zodResolver(advertiserSchema),
    defaultValues: {
      companyName: "",
      businessNumber: "",
      businessRegistrationNumber: "",
      bankAccountNumber: "",
      adMaterials: "",
      contactPerson: "",
      contactPersonType: "Advertiser",
      agencyId: "",
      email: "",
      phone: "",
      industry: "",
      status: "Lead",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AdvertiserFormData) =>
      apiRequest("POST", "/api/advertisers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers"] });
      toast({
        title: "광고주 추가 완료",
        description: "새로운 광고주가 등록되었습니다.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "광고주 추가 실패",
        description: error.message || "광고주 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdvertiserFormData }) =>
      apiRequest("PATCH", `/api/advertisers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers"] });
      toast({
        title: "광고주 수정 완료",
        description: "광고주 정보가 업데이트되었습니다.",
      });
      setDialogOpen(false);
      setEditingAdvertiser(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "광고주 수정 실패",
        description: error.message || "광고주 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/advertisers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers"] });
      toast({
        title: "광고주 삭제 완료",
        description: "광고주가 삭제되었습니다.",
      });
      setDeleteDialogOpen(false);
      setAdvertiserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "광고주 삭제 실패",
        description: error.message || "광고주 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleAddClick = () => {
    setEditingAdvertiser(null);
    form.reset({
      companyName: "",
      businessNumber: "",
      businessRegistrationNumber: "",
      bankAccountNumber: "",
      adMaterials: "",
      contactPerson: "",
      contactPersonType: "Advertiser",
      agencyId: "",
      email: "",
      phone: "",
      industry: "",
      status: "Lead",
    });
    setDialogOpen(true);
  };

  const handleEditClick = (advertiser: AirtableAdvertiser) => {
    setEditingAdvertiser(advertiser);
    form.reset({
      companyName: advertiser.companyName,
      businessNumber: advertiser.businessNumber || "",
      businessRegistrationNumber: advertiser.businessRegistrationNumber || "",
      bankAccountNumber: advertiser.bankAccountNumber || "",
      adMaterials: advertiser.adMaterials || "",
      contactPerson: advertiser.contactPerson,
      contactPersonType: advertiser.contactPersonType,
      agencyId: advertiser.agencyId || "",
      email: advertiser.email,
      phone: advertiser.phone,
      industry: advertiser.industry || "",
      status: advertiser.status,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (advertiser: AirtableAdvertiser) => {
    setAdvertiserToDelete(advertiser);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: AdvertiserFormData) => {
    if (editingAdvertiser) {
      updateMutation.mutate({ id: editingAdvertiser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (advertiserToDelete) {
      deleteMutation.mutate(advertiserToDelete.id);
    }
  };

  const handleDownloadCSV = () => {
    const headers = [
      "광고주",
      "사업자번호",
      "사업자등록번호",
      "계좌번호",
      "광고소재",
      "담당자",
      "담당자구분",
      "에이전시",
      "이메일",
      "전화번호",
      "업종",
      "상태"
    ];
    
    const contactPersonTypeLabels = {
      Advertiser: "광고주",
      Agency: "에이전시"
    };
    
    const rows = filteredAdvertisers.map(a => [
      a.companyName,
      a.businessNumber || "",
      a.businessRegistrationNumber || "",
      a.bankAccountNumber || "",
      a.adMaterials || "",
      a.contactPerson,
      contactPersonTypeLabels[a.contactPersonType],
      a.agencyName || "",
      a.email,
      a.phone,
      a.industry || "",
      statusLabels[a.status],
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `광고주목록_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV 다운로드 완료",
      description: `${filteredAdvertisers.length}개의 광고주 데이터를 다운로드했습니다.`,
    });
  };

  const handleUploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        if (lines.length < 2) {
          throw new Error("CSV 파일이 비어있거나 형식이 올바르지 않습니다");
        }

        // Fetch agencies to map names to IDs
        const agenciesResponse = await apiRequest("GET", "/api/agencies");
        const allAgencies = agenciesResponse as AirtableAgency[];

        const dataLines = lines.slice(1);
        let successCount = 0;
        let errorCount = 0;

        const contactPersonTypeLabels = {
          "광고주": "Advertiser" as const,
          "에이전시": "Agency" as const
        };

        for (const line of dataLines) {
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 12) {
            console.warn("Skipping invalid line:", line);
            errorCount++;
            continue;
          }

          const values = matches.map(v => v.replace(/^"(.*)"$/, '$1').trim());
          const [
            companyName,
            businessNumber,
            businessRegistrationNumber,
            bankAccountNumber,
            adMaterials,
            contactPerson,
            contactPersonTypeLabel,
            agencyName,
            email,
            phone,
            industry,
            statusLabel
          ] = values;

          const statusKey = Object.entries(statusLabels).find(
            ([, label]) => label === statusLabel
          )?.[0] as "Lead" | "Active" | "Inactive" | undefined;

          const contactPersonType = contactPersonTypeLabels[contactPersonTypeLabel as keyof typeof contactPersonTypeLabels] || "Advertiser";

          // Find agency ID by name if agency name is provided
          let agencyId: string | undefined;
          if (agencyName && contactPersonType === "Agency") {
            const agency = allAgencies.find(a => a.name === agencyName);
            agencyId = agency?.id;
            if (!agency) {
              console.warn(`Agency not found: ${agencyName}`);
            }
          }

          try {
            await apiRequest("POST", "/api/advertisers", {
              companyName,
              businessNumber: businessNumber || undefined,
              businessRegistrationNumber: businessRegistrationNumber || undefined,
              bankAccountNumber: bankAccountNumber || undefined,
              adMaterials: adMaterials || undefined,
              contactPerson,
              contactPersonType,
              agencyId,
              email,
              phone,
              industry: industry || undefined,
              status: statusKey || "Lead",
            });
            successCount++;
          } catch (error) {
            console.error("Failed to create advertiser:", error);
            errorCount++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ["/api/advertisers"] });
        
        toast({
          title: "CSV 업로드 완료",
          description: `${successCount}개 성공, ${errorCount}개 실패`,
        });
      } catch (error: any) {
        toast({
          title: "CSV 업로드 실패",
          description: error.message || "CSV 파일 처리 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  // Get unique industries for filter
  const allIndustries = advertisers.map(a => a.industry);
  const hasUnclassified = allIndustries.some(i => !i);
  const industries = Array.from(new Set(allIndustries.filter(Boolean)));

  // Filter advertisers
  const filteredAdvertisers = advertisers.filter((advertiser) => {
    const searchLower = (searchTerm ?? '').toLowerCase();
    
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

      {/* Search, Filter, and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>광고주 목록</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCSV}
                disabled={filteredAdvertisers.length === 0}
                data-testid="button-download-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <label htmlFor="csv-upload">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                  data-testid="button-upload-csv"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    CSV
                  </span>
                </Button>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleUploadCSV}
                  className="hidden"
                />
              </label>
              <Button
                onClick={handleAddClick}
                data-testid="button-add-advertiser"
              >
                <Plus className="h-4 w-4 mr-2" />
                광고주 추가
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
          ) : filteredAdvertisers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {advertisers.length === 0 ? (
                <>
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">아직 광고주가 없습니다</p>
                  <p className="text-sm mt-2">광고주 추가 버튼을 클릭하여 새 광고주를 등록하세요</p>
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
                    <TableHead>광고주</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>캠페인</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdvertisers.map((advertiser) => (
                    <TableRow key={advertiser.id} data-testid={`row-advertiser-${advertiser.id}`}>
                      <TableCell className="font-medium">
                        <div data-testid={`text-company-name-${advertiser.id}`}>{advertiser.companyName}</div>
                        {advertiser.industry && (
                          <div className="text-xs text-muted-foreground mt-1" data-testid={`text-industry-${advertiser.id}`}>{advertiser.industry}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div data-testid={`text-contact-person-${advertiser.id}`}>{advertiser.contactPerson}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            data-testid={`badge-contact-type-${advertiser.id}`}
                          >
                            {advertiser.contactPersonType === 'Agency' ? '에이전시' : '광고주'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-email-${advertiser.id}`}>{advertiser.email}</TableCell>
                      <TableCell data-testid={`text-phone-${advertiser.id}`}>{advertiser.phone}</TableCell>
                      <TableCell>
                        {advertiser.campaigns && advertiser.campaigns.length > 0 ? (
                          <Badge 
                            variant="secondary"
                            data-testid={`badge-campaigns-${advertiser.id}`}
                          >
                            {advertiser.campaigns.length}개
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm" data-testid={`text-no-campaigns-${advertiser.id}`}>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[advertiser.status]}
                          data-testid={`status-${advertiser.status}`}
                        >
                          {statusLabels[advertiser.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/advertisers/${advertiser.id}`)}
                            data-testid={`button-view-${advertiser.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(advertiser)}
                            data-testid={`button-edit-${advertiser.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(advertiser)}
                            data-testid={`button-delete-${advertiser.id}`}
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
              {editingAdvertiser ? "광고주 수정" : "새 광고주 추가"}
            </DialogTitle>
            <DialogDescription>
              {editingAdvertiser
                ? "광고주 정보를 수정합니다."
                : "새로운 광고주를 등록합니다."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>회사명 *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사업자번호</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-business-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>담당자 *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-contact-person" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>전화번호 *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일 *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사업자등록번호</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-business-registration-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>통장 번호</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-bank-account-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="adMaterials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>광고 소재/서비스/제품명</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="예: 배너 광고, 뉴스레터 광고, 네이티브 광고" data-testid="input-ad-materials" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPersonType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>담당자 소속 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contact-person-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Advertiser">광고주</SelectItem>
                          <SelectItem value="Agency">에이전시</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("contactPersonType") === "Agency" && (
                  <FormField
                    control={form.control}
                    name="agencyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>에이전시 선택</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-agency">
                              <SelectValue placeholder="에이전시 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {agencies.map((agency) => (
                              <SelectItem key={agency.id} value={agency.id}>
                                {agency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>업종</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-industry" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          <SelectItem value="Lead">리드</SelectItem>
                          <SelectItem value="Active">활성</SelectItem>
                          <SelectItem value="Inactive">비활성</SelectItem>
                        </SelectContent>
                      </Select>
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
                  {editingAdvertiser ? "수정" : "추가"}
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
            <AlertDialogTitle>광고주 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>{advertiserToDelete?.companyName}</strong>을(를) 삭제하시겠습니까?
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
