import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AirtableQuote, AirtableAdvertiser } from "@/types/airtable";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Eye, Search, Filter, FileText, CheckCircle, Clock, XCircle, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  Draft: { label: "작성중", variant: "secondary" },
  Sent: { label: "발송", variant: "default" },
  Approved: { label: "승인", variant: "default" },
  Rejected: { label: "거절", variant: "outline" },
};

export default function QuotesAirtable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<AirtableQuote | null>(null);
  const [formData, setFormData] = useState({
    advertiserId: "",
    totalAmount: 0,
    discountRate: 0,
    status: "Draft" as const,
  });
  const { toast } = useToast();

  const { data: quotes = [], isLoading } = useQuery<AirtableQuote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: advertisers = [] } = useQuery<AirtableAdvertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest("/api/quotes", {
        method: "POST",
        body: JSON.stringify({
          advertiserId: data.advertiserId,
          totalAmount: data.totalAmount,
          discountRate: data.discountRate / 100,
          status: data.status,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "견적서 생성 완료",
        description: "견적서가 성공적으로 생성되었습니다.",
      });
      setFormDialogOpen(false);
      setFormData({
        advertiserId: "",
        totalAmount: 0,
        discountRate: 0,
        status: "Draft",
      });
    },
    onError: (error: any) => {
      toast({
        title: "견적서 생성 실패",
        description: error.message || "견적서 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/quotes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "견적서 삭제 완료",
        description: "견적서가 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "견적서 삭제 실패",
        description: error.message || "견적서 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleCreateQuote = () => {
    setSelectedQuote(null);
    setFormData({
      advertiserId: "",
      totalAmount: 0,
      discountRate: 0,
      status: "Draft",
    });
    setFormDialogOpen(true);
  };

  const handleSubmitQuote = () => {
    if (!formData.advertiserId) {
      toast({
        title: "입력 오류",
        description: "광고주를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(formData.totalAmount) || formData.totalAmount <= 0) {
      toast({
        title: "입력 오류",
        description: "총액은 0보다 큰 값이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(formData.discountRate) || formData.discountRate < 0 || formData.discountRate > 100) {
      toast({
        title: "입력 오류",
        description: "할인율은 0-100 사이의 숫자여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  // Filter quotes
  const filteredQuotes = quotes.filter((quote) => {
    const quoteNumber = quote.quoteNumber ? String(quote.quoteNumber) : '';
    const searchLower = (searchTerm ?? '').toLowerCase();
    
    const matchesSearch =
      searchTerm === "" ||
      quoteNumber.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6" data-testid="page-quotes-airtable">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">견적서 관리</h1>
          <p className="text-muted-foreground mt-2">
            견적서를 조회하고 관리합니다
          </p>
        </div>
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 견적서</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              전체 견적서
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {quotes.filter((q) => q.status === "Approved").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              승인된 견적서
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기중</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {quotes.filter((q) => q.status === "Sent").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              발송 대기
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">거절</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {quotes.filter((q) => q.status === "Rejected").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              거절된 견적서
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>견적서 목록</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="견적서 번호 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-quotes"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="Draft">작성중</SelectItem>
                  <SelectItem value="Sent">발송</SelectItem>
                  <SelectItem value="Approved">승인</SelectItem>
                  <SelectItem value="Rejected">거절</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreateQuote} data-testid="button-add-quote">
                <Plus className="h-4 w-4 mr-2" />
                견적서 생성
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
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {quotes.length === 0 ? (
                <>
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">아직 견적서가 없습니다</p>
                  <p className="text-sm mt-2">첫 번째 견적서를 생성해보세요</p>
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
                    <TableHead>견적서 번호</TableHead>
                    <TableHead>총액</TableHead>
                    <TableHead>할인율</TableHead>
                    <TableHead>최종 금액</TableHead>
                    <TableHead>발송일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id} data-testid={`row-quote-${quote.id}`}>
                      <TableCell className="font-medium">
                        #{quote.quoteNumber}
                      </TableCell>
                      <TableCell>{formatCurrency(quote.totalAmount)}</TableCell>
                      <TableCell>{quote.discountRate}%</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(quote.finalAmount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(quote.sentAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusConfig[quote.status]?.variant || "outline"}
                          data-testid={`status-${quote.status}`}
                        >
                          {statusConfig[quote.status]?.label || quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-view-${quote.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-edit-${quote.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(quote.id)}
                            data-testid={`button-delete-${quote.id}`}
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

      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent data-testid="dialog-quote-form">
          <DialogHeader>
            <DialogTitle>
              {selectedQuote ? "견적서 수정" : "견적서 생성"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="advertiser">광고주</Label>
              <Select
                value={formData.advertiserId}
                onValueChange={(value) =>
                  setFormData({ ...formData, advertiserId: value })
                }
              >
                <SelectTrigger id="advertiser" data-testid="select-advertiser">
                  <SelectValue placeholder="광고주를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {advertisers.filter(a => a.status === "Active").map((advertiser) => (
                    <SelectItem
                      key={advertiser.id}
                      value={advertiser.id}
                      data-testid={`select-item-advertiser-${advertiser.id}`}
                    >
                      {advertiser.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="totalAmount">총액 (원)</Label>
              <Input
                id="totalAmount"
                type="number"
                min="1"
                step="1000"
                value={formData.totalAmount || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  setFormData({
                    ...formData,
                    totalAmount: isNaN(value) ? 0 : value,
                  });
                }}
                placeholder="예: 1000000"
                data-testid="input-total-amount"
                required
              />
            </div>
            <div>
              <Label htmlFor="discountRate">할인율 (%)</Label>
              <Input
                id="discountRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.discountRate || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  setFormData({
                    ...formData,
                    discountRate: isNaN(value) ? 0 : value,
                  });
                }}
                placeholder="예: 10"
                data-testid="input-discount-rate"
              />
            </div>
            <div>
              <Label htmlFor="status">상태</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">작성중</SelectItem>
                  <SelectItem value="Sent">발송</SelectItem>
                  <SelectItem value="Approved">승인</SelectItem>
                  <SelectItem value="Rejected">거절</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              data-testid="button-cancel-quote"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmitQuote}
              disabled={createMutation.isPending || !formData.advertiserId || formData.totalAmount <= 0}
              data-testid="button-submit-quote"
            >
              {createMutation.isPending ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
