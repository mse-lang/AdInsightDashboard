import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuoteItem {
  id: string;
  product: string;
  unitPrice: number;
  quantity: number;
}

const adSlotProducts = [
  { value: "main-banner", label: "메인배너", defaultPrice: 1000000 },
  { value: "side-banner-1", label: "사이드배너 1", defaultPrice: 500000 },
  { value: "side-banner-2", label: "사이드배너 2", defaultPrice: 500000 },
  { value: "side-banner-3", label: "사이드배너 3", defaultPrice: 500000 },
  { value: "newsletter-banner", label: "뉴스레터 배너", defaultPrice: 800000 },
  { value: "edm-full", label: "eDM 전체 이미지", defaultPrice: 1200000 },
];

export default function Quotes() {
  const [quoteNumber] = useState(() => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `VS-${dateStr}-${randomNum}`;
  });

  const [quoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [proposedAmount, setProposedAmount] = useState("");
  const [quoteInfo, setQuoteInfo] = useState(
    "본 견적서는 벤처스퀘어 광고 게재에 관한 견적서입니다.\n게재 일정 및 상세 내용은 협의를 통해 조정 가능합니다."
  );
  const [specialNotes, setSpecialNotes] = useState(
    "- 부가세 별도\n- 광고 소재는 게재 3일 전까지 제출\n- 결제는 게재 전 선입금 원칙"
  );

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        product: "",
        unitPrice: 0,
        quantity: 1,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const selectProduct = (id: string, productValue: string) => {
    const product = adSlotProducts.find((p) => p.value === productValue);
    if (product) {
      updateItem(id, "product", product.label);
      updateItem(id, "unitPrice", product.defaultPrice);
    }
  };

  const calculateSubtotal = (item: QuoteItem) => {
    return item.unitPrice * item.quantity;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  };

  const calculateTax = () => {
    return Math.floor(calculateTotal() * 0.1);
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateTax();
  };

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  const handleBilling = () => {
    window.open("https://hometax.go.kr/", "_blank");
  };

  const mockQuotes = [
    {
      id: "1",
      number: "VS-20240115-001",
      client: "테크스타트업",
      amount: "₩5,500,000",
      date: "2024-01-15",
      status: "발송완료",
    },
    {
      id: "2",
      number: "VS-20240118-002",
      client: "이커머스컴퍼니",
      amount: "₩3,300,000",
      date: "2024-01-18",
      status: "확정",
    },
  ];

  return (
    <div className="space-y-6" data-testid="page-quotes">
      <div>
        <h1 className="text-3xl font-bold">견적/청구 관리</h1>
        <p className="text-muted-foreground mt-1">견적서를 생성하고 청구를 관리하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>견적서 작성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>견적번호</Label>
                  <Input value={quoteNumber} disabled className="font-mono" data-testid="input-quote-number" />
                </div>
                <div>
                  <Label>견적일자</Label>
                  <Input type="date" value={quoteDate} disabled data-testid="input-quote-date" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>견적 항목</Label>
                  <Button onClick={addItem} size="sm" data-testid="button-add-item">
                    <Plus className="h-4 w-4 mr-2" />
                    항목 추가
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>품명</TableHead>
                      <TableHead>단가</TableHead>
                      <TableHead>수량</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select
                            value={item.product}
                            onValueChange={(value) => selectProduct(item.id, value)}
                          >
                            <SelectTrigger data-testid={`select-product-${item.id}`}>
                              <SelectValue placeholder="품목 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {adSlotProducts.map((product) => (
                                <SelectItem key={product.value} value={product.value}>
                                  {product.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(item.id, "unitPrice", Number(e.target.value))
                            }
                            className="font-mono"
                            data-testid={`input-price-${item.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, "quantity", Number(e.target.value))
                            }
                            className="w-20"
                            data-testid={`input-quantity-${item.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(calculateSubtotal(item))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {items.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>소계</span>
                      <span className="font-mono">{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>세액 (10%)</span>
                      <span className="font-mono">{formatCurrency(calculateTax())}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>합계</span>
                      <span className="font-mono">{formatCurrency(calculateGrandTotal())}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>제안 금액</Label>
                <Input
                  type="number"
                  value={proposedAmount}
                  onChange={(e) => setProposedAmount(e.target.value)}
                  placeholder="제안 금액 입력"
                  className="font-mono"
                  data-testid="input-proposed-amount"
                />
              </div>

              <div>
                <Label>견적 정보</Label>
                <Textarea
                  value={quoteInfo}
                  onChange={(e) => setQuoteInfo(e.target.value)}
                  rows={3}
                  data-testid="textarea-quote-info"
                />
              </div>

              <div>
                <Label>특기사항</Label>
                <Textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  rows={4}
                  data-testid="textarea-special-notes"
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" data-testid="button-save-quote">
                  <FileText className="h-4 w-4 mr-2" />
                  견적서 저장
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBilling}
                  data-testid="button-billing"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  청구하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>견적서 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="p-3 border rounded-md hover-elevate cursor-pointer"
                    data-testid={`card-quote-${quote.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-mono text-sm text-muted-foreground">
                        {quote.number}
                      </div>
                      <Badge variant="outline">{quote.status}</Badge>
                    </div>
                    <div className="font-medium">{quote.client}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">{quote.date}</span>
                      <span className="font-mono font-bold">{quote.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
