import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Receipt, Search, Filter, Plus, Edit, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AirtableInvoice } from "@/types/airtable";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Issued: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels = {
  Pending: "대기중",
  Issued: "발행완료",
  Paid: "입금완료",
  Overdue: "연체",
};

export default function Invoices() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices = [], isLoading } = useQuery<AirtableInvoice[]>({
    queryKey: ["/api/invoices"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/invoices/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "상태 업데이트 완료",
        description: "세금계산서 상태가 업데이트되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "상태 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      searchTerm === "" ||
      invoice.invoiceNumber?.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">세금계산서 관리</h1>
          <p className="text-muted-foreground mt-2">
            발행된 세금계산서를 관리하고 입금 상태를 추적합니다
          </p>
        </div>
        <Receipt className="h-8 w-8 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>세금계산서 목록</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="계산서 번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-invoice-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="Pending">대기중</SelectItem>
                  <SelectItem value="Issued">발행완료</SelectItem>
                  <SelectItem value="Paid">입금완료</SelectItem>
                  <SelectItem value="Overdue">연체</SelectItem>
                </SelectContent>
              </Select>
              <Button data-testid="button-add-invoice">
                <Plus className="h-4 w-4 mr-2" />
                인보이스 추가
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              조회된 세금계산서가 없습니다
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>계산서 번호</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>발행일</TableHead>
                    <TableHead>만기일</TableHead>
                    <TableHead>입금일</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-medium">
                        #{invoice.invoiceNumber || "N/A"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[invoice.status]}
                          data-testid={`status-${invoice.status}`}
                        >
                          {statusLabels[invoice.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.paymentDate)}</TableCell>
                      <TableCell>
                        <Select
                          value={invoice.status}
                          onValueChange={(status) =>
                            updateStatusMutation.mutate({ id: invoice.id, status })
                          }
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-status-${invoice.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">대기중</SelectItem>
                            <SelectItem value="Issued">발행완료</SelectItem>
                            <SelectItem value="Paid">입금완료</SelectItem>
                            <SelectItem value="Overdue">연체</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">총 계산서</p>
              <p className="text-2xl font-bold">{invoices.length}건</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">대기중</p>
              <p className="text-2xl font-bold text-yellow-600">
                {invoices.filter((i) => i.status === "Pending").length}건
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">발행완료</p>
              <p className="text-2xl font-bold text-blue-600">
                {invoices.filter((i) => i.status === "Issued").length}건
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">입금완료</p>
              <p className="text-2xl font-bold text-green-600">
                {invoices.filter((i) => i.status === "Paid").length}건
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
