import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AirtableAdvertiser, AirtableAdProduct } from "@/types/airtable";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ShoppingCart } from "lucide-react";

interface QuoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface QuoteItemForm {
  adProductId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export function QuoteFormDialog({ open, onOpenChange, onSuccess }: QuoteFormDialogProps) {
  const { toast } = useToast();
  const [advertiserId, setAdvertiserId] = useState("");
  const [items, setItems] = useState<QuoteItemForm[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discountRate, setDiscountRate] = useState(0);
  const [status, setStatus] = useState<"Draft" | "Sent" | "Approved" | "Rejected">("Draft");

  const { data: advertisers = [] } = useQuery<AirtableAdvertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const { data: adProducts = [] } = useQuery<AirtableAdProduct[]>({
    queryKey: ["/api/ad-products"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { advertiserId: string; totalAmount: number; discountRate: number; status: string; items: QuoteItemForm[] }) => {
      // First create the quote
      // Note: discountRate is sent as 0-100, backend will convert to 0-1
      const quoteResponse = await apiRequest("/api/quotes", {
        method: "POST",
        body: JSON.stringify({
          advertiserId: data.advertiserId,
          totalAmount: data.totalAmount,
          discountRate: data.discountRate,
          status: data.status,
        }),
      });

      if (!quoteResponse.ok) {
        const error = await quoteResponse.json();
        throw new Error(error.error || '견적서 생성에 실패했습니다');
      }

      const quote = await quoteResponse.json();
      
      if (!quote.id) {
        throw new Error('견적서 ID를 가져올 수 없습니다');
      }

      // Then create quote items
      if (data.items.length > 0) {
        try {
          const itemsResponse = await apiRequest("/api/quote-items/bulk", {
            method: "POST",
            body: JSON.stringify({
              quoteId: quote.id,
              items: data.items.map(item => ({
                adProductId: item.adProductId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              })),
            }),
          });

          if (!itemsResponse.ok) {
            const error = await itemsResponse.json();
            throw new Error(error.error || '견적 품목 생성에 실패했습니다');
          }
        } catch (itemError) {
          // Rollback: Delete the created quote if item creation fails
          try {
            await apiRequest(`/api/quotes/${quote.id}`, {
              method: "DELETE",
            });
          } catch (deleteError) {
            console.error('Failed to delete orphan quote:', deleteError);
          }
          throw itemError;
        }
      }

      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "견적서 생성 완료",
        description: "견적서가 성공적으로 생성되었습니다.",
      });
      handleReset();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "견적서 생성 실패",
        description: error.message || "견적서 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    if (!selectedProductId) {
      toast({
        title: "상품 선택 필요",
        description: "추가할 상품을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "수량 입력 필요",
        description: "수량은 1 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    const product = adProducts.find(p => p.id === selectedProductId);
    if (!product) return;

    const newItem: QuoteItemForm = {
      adProductId: product.id,
      productName: product.productName,
      quantity,
      unitPrice: product.unitPrice,
      subtotal: quantity * product.unitPrice,
    };

    setItems([...items, newItem]);
    setSelectedProductId("");
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateFinalAmount = () => {
    const total = calculateTotal();
    return total * (1 - discountRate / 100);
  };

  const handleSubmit = () => {
    if (!advertiserId) {
      toast({
        title: "광고주 선택 필요",
        description: "광고주를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "품목 추가 필요",
        description: "최소 1개 이상의 품목을 추가해주세요.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      advertiserId,
      totalAmount: calculateTotal(),
      discountRate,
      status,
      items,
    });
  };

  const handleReset = () => {
    setAdvertiserId("");
    setItems([]);
    setSelectedProductId("");
    setQuantity(1);
    setDiscountRate(0);
    setStatus("Draft");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-quote-form">
        <DialogHeader>
          <DialogTitle>견적서 생성</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* 광고주 선택 */}
          <div>
            <Label htmlFor="advertiser">광고주 *</Label>
            <Select value={advertiserId} onValueChange={setAdvertiserId}>
              <SelectTrigger id="advertiser" data-testid="select-advertiser">
                <SelectValue placeholder="광고주를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {advertisers.filter(a => a.status === "Active").map((advertiser) => (
                  <SelectItem key={advertiser.id} value={advertiser.id} data-testid={`select-item-advertiser-${advertiser.id}`}>
                    {advertiser.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 품목 추가 섹션 */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              품목 추가
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="product">광고 상품</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product" data-testid="select-product">
                    <SelectValue placeholder="상품을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {adProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id} data-testid={`select-item-product-${product.id}`}>
                        {product.productName} - {formatCurrency(product.unitPrice)} ({product.format})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">수량</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  data-testid="input-quantity"
                />
              </div>
            </div>
            <Button onClick={handleAddItem} size="sm" data-testid="button-add-item">
              <Plus className="h-4 w-4 mr-2" />
              품목 추가
            </Button>
          </div>

          {/* 품목 목록 */}
          {items.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">품목 목록</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>상품명</TableHead>
                      <TableHead className="text-right">단가</TableHead>
                      <TableHead className="text-right">수량</TableHead>
                      <TableHead className="text-right">소계</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index} data-testid={`row-item-${index}`}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.subtotal)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            data-testid={`button-remove-item-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* 할인율 및 합계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountRate">할인율 (%)</Label>
              <Input
                id="discountRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountRate}
                onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                placeholder="예: 10"
                data-testid="input-discount-rate"
              />
            </div>
            <div>
              <Label htmlFor="status">상태</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
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

          {/* 금액 요약 */}
          {items.length > 0 && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>총액:</span>
                <span className="font-semibold">{formatCurrency(calculateTotal())}</span>
              </div>
              {discountRate > 0 && (
                <div className="flex justify-between items-center text-sm text-destructive">
                  <span>할인 ({discountRate}%):</span>
                  <span>-{formatCurrency(calculateTotal() * (discountRate / 100))}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                <span>최종 금액:</span>
                <span className="text-primary">{formatCurrency(calculateFinalAmount())}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-quote">
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !advertiserId || items.length === 0}
            data-testid="button-submit-quote"
          >
            {createMutation.isPending ? "생성 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
