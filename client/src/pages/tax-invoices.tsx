import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Eye, Search, Filter, FileText, CheckCircle, Clock, XCircle, Plus, ExternalLink, Check, ChevronsUpDown, Download } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface TaxInvoice {
  id: string;
  mgtKey: string;
  advertiserId: string;
  invoiceType: string;
  taxType: string;
  writeDate: string;
  supplyPriceTotal: number;
  taxTotal: number;
  totalAmount: number;
  status: string;
  ntsConfirmNum?: string;
  printUrl?: string;
  errorMessage?: string;
  items: string;
  issuerInfo: string;
  recipientInfo: string;
  remark?: string;
}

interface Advertiser {
  id: string;
  companyName: string;
  businessRegistrationNumber?: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: string;
  address?: string;
  businessType?: string;
  businessClass?: string;
  ceoName?: string;
}

interface Quote {
  id: string;
  advertiserId: string;
  totalAmount: number;
  discountRate: number;
  status: string;
  createdAt: string;
}

interface QuoteItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface GeneralSettings {
  companyName: string;
  ceoName: string;
  companyEmail: string;
  companyPhone: string;
  businessNumber: string;
  companyAddress: string;
  businessType: string;
  businessClass: string;
  bankName: string;
  bankAccountNumber: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  "작성중": { label: "작성중", variant: "secondary" },
  "발행완료": { label: "발행완료", variant: "default" },
  "발행실패": { label: "발행실패", variant: "destructive" },
};

export default function TaxInvoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [advertiserSearchOpen, setAdvertiserSearchOpen] = useState(false);
  const [advertiserSearch, setAdvertiserSearch] = useState("");
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [formData, setFormData] = useState({
    advertiserId: "",
    invoiceType: "세금계산서",
    taxType: "과세",
    writeDate: format(new Date(), "yyyy-MM-dd"),
    items: [{
      purchaseDate: format(new Date(), "yyyy-MM-dd"),
      itemName: "",
      spec: "",
      qty: 1,
      unitPrice: 0,
      supplyPrice: 0,
      tax: 0,
      remark: "",
    }],
    issuerCorpNum: "",
    issuerCorpName: "",
    issuerCEOName: "",
    issuerAddr: "",
    issuerBizType: "",
    issuerBizClass: "",
    issuerContactName: "",
    issuerTelNum: "",
    issuerEmail: "",
    recipientCorpNum: "",
    recipientCorpName: "",
    recipientCEOName: "",
    recipientAddr: "",
    recipientBizType: "",
    recipientBizClass: "",
    recipientContactName: "",
    recipientTelNum: "",
    recipientEmail: "",
    remark: "",
  });
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<TaxInvoice[]>({
    queryKey: ["/api/tax-invoices"],
  });

  const { data: advertisers = [] } = useQuery<Advertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const { data: allQuotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
    enabled: formDialogOpen,
  });

  const { data: generalSettings, isLoading: settingsLoading } = useQuery<GeneralSettings>({
    queryKey: ["/api/settings/general"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const issuerInfo = {
        corpNum: data.issuerCorpNum,
        corpName: data.issuerCorpName,
        ceoName: data.issuerCEOName,
        addr: data.issuerAddr,
        bizType: data.issuerBizType,
        bizClass: data.issuerBizClass,
        contactName: data.issuerContactName,
        telNum: data.issuerTelNum,
        email: data.issuerEmail,
      };

      const recipientInfo = {
        corpNum: data.recipientCorpNum,
        corpName: data.recipientCorpName,
        ceoName: data.recipientCEOName,
        addr: data.recipientAddr,
        bizType: data.recipientBizType,
        bizClass: data.recipientBizClass,
        contactName: data.recipientContactName,
        telNum: data.recipientTelNum,
        email: data.recipientEmail,
      };

      return apiRequest("/api/tax-invoices", {
        method: "POST",
        body: JSON.stringify({
          advertiserId: data.advertiserId,
          invoiceType: data.invoiceType,
          taxType: data.taxType,
          writeDate: data.writeDate,
          items: data.items,
          issuerInfo,
          recipientInfo,
          remark: data.remark,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-invoices"] });
      toast({
        title: "세금계산서 발행 완료",
        description: "세금계산서가 성공적으로 발행되었습니다.",
      });
      setFormDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "세금계산서 발행 실패",
        description: error.message || "세금계산서 발행 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      advertiserId: "",
      invoiceType: "세금계산서",
      taxType: "과세",
      writeDate: format(new Date(), "yyyy-MM-dd"),
      items: [{
        purchaseDate: format(new Date(), "yyyy-MM-dd"),
        itemName: "",
        spec: "",
        qty: 1,
        unitPrice: 0,
        supplyPrice: 0,
        tax: 0,
        remark: "",
      }],
      issuerCorpNum: generalSettings?.businessNumber || "",
      issuerCorpName: generalSettings?.companyName || "",
      issuerCEOName: generalSettings?.ceoName || "",
      issuerAddr: generalSettings?.companyAddress || "",
      issuerBizType: generalSettings?.businessType || "",
      issuerBizClass: generalSettings?.businessClass || "",
      issuerContactName: generalSettings?.ceoName || "",
      issuerTelNum: generalSettings?.companyPhone || "",
      issuerEmail: generalSettings?.companyEmail || "",
      recipientCorpNum: "",
      recipientCorpName: "",
      recipientCEOName: "",
      recipientAddr: "",
      recipientBizType: "",
      recipientBizClass: "",
      recipientContactName: "",
      recipientTelNum: "",
      recipientEmail: "",
      remark: "",
    });
    setAdvertiserSearch("");
    setSelectedQuote(null);
    setRecentQuotes([]);
  };

  // Handle advertiser selection
  const handleAdvertiserSelect = async (advertiserId: string) => {
    const advertiser = advertisers.find(a => a.id === advertiserId);
    if (!advertiser) return;

    // Auto-fill recipient info from advertiser
    setFormData(prev => ({
      ...prev,
      advertiserId,
      recipientCorpNum: advertiser.businessRegistrationNumber || "",
      recipientCorpName: advertiser.companyName,
      recipientCEOName: advertiser.ceoName || "",
      recipientAddr: advertiser.address || "",
      recipientBizType: advertiser.businessType || "",
      recipientBizClass: advertiser.businessClass || "",
      recipientContactName: advertiser.contactPerson,
      recipientTelNum: advertiser.phone,
      recipientEmail: advertiser.email,
    }));

    // Load recent quotes for this advertiser
    setLoadingQuotes(true);
    try {
      const quotes = allQuotes
        .filter(q => q.advertiserId === advertiserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentQuotes(quotes);
    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Load quote items when quote selected
  const handleQuoteSelect = async (quote: Quote) => {
    setSelectedQuote(quote);
    
    try {
      const response = await fetch(`/api/quote-items?quoteId=${quote.id}`);
      if (!response.ok) throw new Error('Failed to load quote items');
      
      const quoteItems: QuoteItem[] = await response.json();
      
      // Map quote items to tax invoice items
      const newItems = quoteItems.map(item => ({
        purchaseDate: format(new Date(), "yyyy-MM-dd"),
        itemName: item.productName,
        spec: "",
        qty: item.quantity,
        unitPrice: item.unitPrice,
        supplyPrice: item.subtotal,
        tax: Math.round(item.subtotal * 0.1),
        remark: "",
      }));

      setFormData(prev => ({
        ...prev,
        items: newItems.length > 0 ? newItems : prev.items,
      }));

      toast({
        title: "견적서 로드 완료",
        description: `${quoteItems.length}개 품목이 자동 입력되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "견적서 로드 실패",
        description: "견적서 품목을 불러올 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  const getSelectedAdvertiser = () => {
    return advertisers.find(a => a.id === formData.advertiserId);
  };

  const filteredAdvertisers = advertisers
    .filter(a => a.status === "Active")
    .filter(a => 
      advertiserSearch === "" || 
      a.companyName.toLowerCase().includes(advertiserSearch.toLowerCase())
    );

  const handleCreateInvoice = () => {
    resetForm();
    setFormDialogOpen(true);
  };

  const handleSubmitInvoice = () => {
    if (!formData.advertiserId) {
      toast({
        title: "입력 오류",
        description: "광고주를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.issuerCorpNum || !formData.recipientCorpNum) {
      toast({
        title: "입력 오류",
        description: "발행자와 공급받는자의 사업자번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (formData.items.length === 0 || formData.items.some(item => !item.itemName || item.supplyPrice <= 0)) {
      toast({
        title: "입력 오류",
        description: "품목 정보를 정확히 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        purchaseDate: format(new Date(), "yyyy-MM-dd"),
        itemName: "",
        spec: "",
        qty: 1,
        unitPrice: 0,
        supplyPrice: 0,
        tax: 0,
        remark: "",
      }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "qty" || field === "unitPrice") {
      const qty = field === "qty" ? value : newItems[index].qty;
      const unitPrice = field === "unitPrice" ? value : newItems[index].unitPrice;
      newItems[index].supplyPrice = qty * unitPrice;
      newItems[index].tax = Math.round(newItems[index].supplyPrice * 0.1);
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const mgtKey = invoice.mgtKey ? String(invoice.mgtKey) : '';
    const searchLower = (searchTerm ?? '').toLowerCase();
    
    const matchesSearch =
      searchTerm === "" ||
      mgtKey.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
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
      const cleanDate = dateString.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
      return format(new Date(cleanDate), "yyyy-MM-dd");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6" data-testid="page-tax-invoices">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">세금계산서 관리</h1>
          <p className="text-muted-foreground mt-2">
            바로빌을 통해 세금계산서를 발행하고 관리합니다
          </p>
        </div>
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 발행</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              전체 세금계산서
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">발행완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {invoices.filter((inv) => inv.status === "발행완료").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              정상 발행
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">작성중</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {invoices.filter((inv) => inv.status === "작성중").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              발행 대기
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">발행실패</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invoices.filter((inv) => inv.status === "발행실패").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              오류 발생
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>세금계산서 목록</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="관리번호 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-invoices"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="작성중">작성중</SelectItem>
                  <SelectItem value="발행완료">발행완료</SelectItem>
                  <SelectItem value="발행실패">발행실패</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleCreateInvoice} 
                disabled={settingsLoading}
                data-testid="button-add-invoice"
              >
                <Plus className="h-4 w-4 mr-2" />
                세금계산서 발행
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
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {invoices.length === 0 ? (
                <>
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">아직 세금계산서가 없습니다</p>
                  <p className="text-sm mt-2">첫 번째 세금계산서를 발행해보세요</p>
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
                    <TableHead>관리번호</TableHead>
                    <TableHead>계산서 유형</TableHead>
                    <TableHead>과세 유형</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead className="text-right">공급가액</TableHead>
                    <TableHead className="text-right">세액</TableHead>
                    <TableHead className="text-right">합계</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-medium">
                        {invoice.mgtKey}
                      </TableCell>
                      <TableCell>{invoice.invoiceType}</TableCell>
                      <TableCell>{invoice.taxType}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(invoice.writeDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.supplyPriceTotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.taxTotal)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusConfig[invoice.status]?.variant || "outline"}
                          data-testid={`status-${invoice.status}`}
                        >
                          {statusConfig[invoice.status]?.label || invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.printUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(invoice.printUrl, '_blank')}
                              data-testid={`button-view-${invoice.id}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.errorMessage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "발행 오류",
                                  description: invoice.errorMessage,
                                  variant: "destructive",
                                });
                              }}
                              data-testid={`button-error-${invoice.id}`}
                            >
                              <Eye className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-invoice-form">
          <DialogHeader>
            <DialogTitle>세금계산서 발행</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="advertiser">광고주 *</Label>
                <Popover open={advertiserSearchOpen} onOpenChange={setAdvertiserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="advertiser"
                      variant="outline"
                      role="combobox"
                      aria-expanded={advertiserSearchOpen}
                      className="w-full justify-between"
                      data-testid="select-advertiser"
                    >
                      {formData.advertiserId
                        ? getSelectedAdvertiser()?.companyName
                        : "광고주를 검색하거나 선택하세요"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="광고주 검색..." 
                        value={advertiserSearch}
                        onValueChange={setAdvertiserSearch}
                      />
                      <CommandList>
                        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                        <CommandGroup>
                          {filteredAdvertisers.map((advertiser) => (
                            <CommandItem
                              key={advertiser.id}
                              value={advertiser.companyName}
                              onSelect={() => {
                                handleAdvertiserSelect(advertiser.id);
                                setAdvertiserSearchOpen(false);
                              }}
                              data-testid={`select-item-advertiser-${advertiser.id}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.advertiserId === advertiser.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {advertiser.companyName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="writeDate">작성일</Label>
                <Input
                  id="writeDate"
                  type="date"
                  value={formData.writeDate}
                  onChange={(e) => setFormData({ ...formData, writeDate: e.target.value })}
                  data-testid="input-write-date"
                />
              </div>
            </div>

            {/* Recent Quotes Section */}
            {formData.advertiserId && recentQuotes.length > 0 && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  최근 견적서 ({recentQuotes.length}개)
                </h3>
                <div className="space-y-2">
                  {recentQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className={cn(
                        "p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors",
                        selectedQuote?.id === quote.id && "bg-accent border-primary"
                      )}
                      onClick={() => handleQuoteSelect(quote)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {formatCurrency(quote.totalAmount * (1 - quote.discountRate / 100))}
                            </span>
                            {quote.discountRate > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {quote.discountRate}% 할인
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(quote.createdAt), "yyyy-MM-dd")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{quote.status}</Badge>
                          {selectedQuote?.id === quote.id && (
                            <Download className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  💡 견적서를 클릭하면 품목이 자동으로 입력됩니다
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceType">계산서 유형</Label>
                <Select
                  value={formData.invoiceType}
                  onValueChange={(value) => setFormData({ ...formData, invoiceType: value })}
                >
                  <SelectTrigger id="invoiceType" data-testid="select-invoice-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="세금계산서">세금계산서</SelectItem>
                    <SelectItem value="수정세금계산서">수정세금계산서</SelectItem>
                    <SelectItem value="계산서">계산서</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="taxType">과세 유형</Label>
                <Select
                  value={formData.taxType}
                  onValueChange={(value) => setFormData({ ...formData, taxType: value })}
                >
                  <SelectTrigger id="taxType" data-testid="select-tax-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="과세">과세</SelectItem>
                    <SelectItem value="영세">영세</SelectItem>
                    <SelectItem value="면세">면세</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">공급자 정보</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issuerCorpNum">사업자번호 *</Label>
                  <Input
                    id="issuerCorpNum"
                    value={formData.issuerCorpNum}
                    onChange={(e) => setFormData({ ...formData, issuerCorpNum: e.target.value })}
                    placeholder="예: 123-45-67890"
                    data-testid="input-issuer-corp-num"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issuerCorpName">상호 *</Label>
                  <Input
                    id="issuerCorpName"
                    value={formData.issuerCorpName}
                    onChange={(e) => setFormData({ ...formData, issuerCorpName: e.target.value })}
                    data-testid="input-issuer-corp-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issuerCEOName">대표자명 *</Label>
                  <Input
                    id="issuerCEOName"
                    value={formData.issuerCEOName}
                    onChange={(e) => setFormData({ ...formData, issuerCEOName: e.target.value })}
                    data-testid="input-issuer-ceo-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issuerBizType">업태 *</Label>
                  <Input
                    id="issuerBizType"
                    value={formData.issuerBizType}
                    onChange={(e) => setFormData({ ...formData, issuerBizType: e.target.value })}
                    placeholder="예: 서비스업"
                    data-testid="input-issuer-biz-type"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issuerBizClass">업종 *</Label>
                  <Input
                    id="issuerBizClass"
                    value={formData.issuerBizClass}
                    onChange={(e) => setFormData({ ...formData, issuerBizClass: e.target.value })}
                    placeholder="예: 광고업"
                    data-testid="input-issuer-biz-class"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issuerContactName">담당자명 *</Label>
                  <Input
                    id="issuerContactName"
                    value={formData.issuerContactName}
                    onChange={(e) => setFormData({ ...formData, issuerContactName: e.target.value })}
                    data-testid="input-issuer-contact-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issuerTelNum">전화번호 *</Label>
                  <Input
                    id="issuerTelNum"
                    value={formData.issuerTelNum}
                    onChange={(e) => setFormData({ ...formData, issuerTelNum: e.target.value })}
                    placeholder="예: 02-1234-5678"
                    data-testid="input-issuer-tel-num"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issuerEmail">이메일 *</Label>
                  <Input
                    id="issuerEmail"
                    type="email"
                    value={formData.issuerEmail}
                    onChange={(e) => setFormData({ ...formData, issuerEmail: e.target.value })}
                    data-testid="input-issuer-email"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="issuerAddr">주소 *</Label>
                  <Input
                    id="issuerAddr"
                    value={formData.issuerAddr}
                    onChange={(e) => setFormData({ ...formData, issuerAddr: e.target.value })}
                    data-testid="input-issuer-addr"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">공급받는자 정보</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientCorpNum">사업자번호 *</Label>
                  <Input
                    id="recipientCorpNum"
                    value={formData.recipientCorpNum}
                    onChange={(e) => setFormData({ ...formData, recipientCorpNum: e.target.value })}
                    placeholder="예: 123-45-67890"
                    data-testid="input-recipient-corp-num"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="recipientCorpName">상호 *</Label>
                  <Input
                    id="recipientCorpName"
                    value={formData.recipientCorpName}
                    onChange={(e) => setFormData({ ...formData, recipientCorpName: e.target.value })}
                    data-testid="input-recipient-corp-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="recipientCEOName">대표자명 *</Label>
                  <Input
                    id="recipientCEOName"
                    value={formData.recipientCEOName}
                    onChange={(e) => setFormData({ ...formData, recipientCEOName: e.target.value })}
                    data-testid="input-recipient-ceo-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="recipientBizType">업태 *</Label>
                  <Input
                    id="recipientBizType"
                    value={formData.recipientBizType}
                    onChange={(e) => setFormData({ ...formData, recipientBizType: e.target.value })}
                    placeholder="예: 서비스업"
                    data-testid="input-recipient-biz-type"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="recipientBizClass">업종 *</Label>
                  <Input
                    id="recipientBizClass"
                    value={formData.recipientBizClass}
                    onChange={(e) => setFormData({ ...formData, recipientBizClass: e.target.value })}
                    placeholder="예: 광고업"
                    data-testid="input-recipient-biz-class"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="recipientContactName">담당자명 *</Label>
                  <Input
                    id="recipientContactName"
                    value={formData.recipientContactName}
                    onChange={(e) => setFormData({ ...formData, recipientContactName: e.target.value })}
                    data-testid="input-recipient-contact-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="recipientTelNum">전화번호 *</Label>
                  <Input
                    id="recipientTelNum"
                    value={formData.recipientTelNum}
                    onChange={(e) => setFormData({ ...formData, recipientTelNum: e.target.value })}
                    placeholder="예: 02-1234-5678"
                    data-testid="input-recipient-tel-num"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="recipientEmail">이메일 *</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    data-testid="input-recipient-email"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="recipientAddr">주소 *</Label>
                  <Input
                    id="recipientAddr"
                    value={formData.recipientAddr}
                    onChange={(e) => setFormData({ ...formData, recipientAddr: e.target.value })}
                    data-testid="input-recipient-addr"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">품목 정보</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  품목 추가
                </Button>
              </div>
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="border p-4 rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">품목 {index + 1}</span>
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          data-testid={`button-remove-item-${index}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>품목명</Label>
                        <Input
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                          placeholder="예: 광고 집행"
                          data-testid={`input-item-name-${index}`}
                        />
                      </div>
                      <div>
                        <Label>규격</Label>
                        <Input
                          value={item.spec}
                          onChange={(e) => handleItemChange(index, "spec", e.target.value)}
                          placeholder="예: 2025년 1월"
                          data-testid={`input-item-spec-${index}`}
                        />
                      </div>
                      <div>
                        <Label>수량</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, "qty", parseInt(e.target.value) || 1)}
                          data-testid={`input-item-quantity-${index}`}
                        />
                      </div>
                      <div>
                        <Label>단가</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, "unitPrice", parseInt(e.target.value) || 0)}
                          data-testid={`input-item-unit-price-${index}`}
                        />
                      </div>
                      <div>
                        <Label>공급가액</Label>
                        <Input
                          type="number"
                          value={item.supplyPrice}
                          disabled
                          data-testid={`input-item-supply-price-${index}`}
                        />
                      </div>
                      <div>
                        <Label>세액</Label>
                        <Input
                          type="number"
                          value={item.tax}
                          disabled
                          data-testid={`input-item-tax-${index}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="remark">비고</Label>
              <Textarea
                id="remark"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="추가 정보를 입력하세요"
                rows={3}
                data-testid="input-remark"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              data-testid="button-cancel-invoice"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmitInvoice}
              disabled={createMutation.isPending}
              data-testid="button-submit-invoice"
            >
              {createMutation.isPending ? "발행 중..." : "발행"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
