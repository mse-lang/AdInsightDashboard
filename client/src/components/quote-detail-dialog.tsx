import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface QuoteItem {
  id: string;
  productKey: string;
  product: string;
  unitPrice: number;
  quantity: number;
}

interface QuoteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: {
    id: string;
    number: string;
    client: string;
    amount: string;
    date: string;
    status: string;
    items?: QuoteItem[];
    quoteInfo?: string;
    specialNotes?: string;
  } | null;
}

export function QuoteDetailDialog({ open, onOpenChange, quote }: QuoteDetailDialogProps) {
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const isDownloading = useRef(false);

  if (!quote) return null;

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  const calculateSubtotal = (item: QuoteItem) => {
    return item.unitPrice * item.quantity;
  };

  const items = quote.items || [
    {
      id: "1",
      productKey: "MAIN_BANNER_1",
      product: "메인 배너 1번 위치 (1개월)",
      unitPrice: 2000000,
      quantity: 1,
    },
    {
      id: "2",
      productKey: "SIDE_BANNER_1_1",
      product: "사이드 배너 1-1번 위치 (1개월)",
      unitPrice: 1500000,
      quantity: 2,
    },
  ];

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  };

  const calculateTax = () => {
    return Math.floor(calculateTotal() * 0.1);
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateTax();
  };

  const handleDownloadPDF = async () => {
    if (isDownloading.current) return;
    
    try {
      isDownloading.current = true;
      
      if (!contentRef.current) {
        toast({
          title: "오류",
          description: "PDF 생성에 실패했습니다.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "PDF 생성 중",
        description: "잠시만 기다려주세요...",
      });

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      pdf.save(`견적서_${quote.number}.pdf`);

      toast({
        title: "PDF 다운로드 완료",
        description: "견적서가 성공적으로 다운로드되었습니다.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "오류 발생",
        description: "PDF 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      isDownloading.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-quote-detail">
        <DialogHeader>
          <DialogTitle>견적서 상세</DialogTitle>
        </DialogHeader>

        <div ref={contentRef} className="bg-white p-8 space-y-6 text-black">
          <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-3xl font-bold mb-2">견적서</h1>
            <p className="text-sm text-gray-600">QUOTATION</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2">
                <span className="font-semibold">견적번호:</span> {quote.number}
              </div>
              <div>
                <span className="font-semibold">견적일자:</span> {quote.date}
              </div>
            </div>
            <div>
              <div className="mb-2">
                <span className="font-semibold">수신:</span> {quote.client}
              </div>
              <div>
                <span className="font-semibold">상태:</span> {quote.status}
              </div>
            </div>
          </div>

          <div className="border-t-2 border-gray-300 pt-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">발신</h2>
              <div className="text-sm space-y-1">
                <div>회사명: 주식회사 벤처스퀘어</div>
                <div>주소: 서울특별시 강남구 테헤란로</div>
                <div>전화: 02-1234-5678</div>
                <div>이메일: contact@venturesquare.net</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">견적 내역</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border border-gray-300 bg-gray-100 text-black">품명</TableHead>
                  <TableHead className="border border-gray-300 bg-gray-100 text-black text-right">단가</TableHead>
                  <TableHead className="border border-gray-300 bg-gray-100 text-black text-center">수량</TableHead>
                  <TableHead className="border border-gray-300 bg-gray-100 text-black text-right">금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="border border-gray-300">{item.product}</TableCell>
                    <TableCell className="border border-gray-300 text-right font-mono">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="border border-gray-300 text-center">{item.quantity}</TableCell>
                    <TableCell className="border border-gray-300 text-right font-mono">
                      {formatCurrency(calculateSubtotal(item))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="border border-gray-300 text-right font-semibold">
                    소계
                  </TableCell>
                  <TableCell className="border border-gray-300 text-right font-mono font-semibold">
                    {formatCurrency(calculateTotal())}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="border border-gray-300 text-right font-semibold">
                    세액 (10%)
                  </TableCell>
                  <TableCell className="border border-gray-300 text-right font-mono font-semibold">
                    {formatCurrency(calculateTax())}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="border border-gray-300 text-right font-bold text-lg">
                    합계
                  </TableCell>
                  <TableCell className="border border-gray-300 text-right font-mono font-bold text-lg">
                    {formatCurrency(calculateGrandTotal())}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">견적 정보</h3>
              <p className="text-sm whitespace-pre-wrap">
                {quote.quoteInfo || "본 견적서는 벤처스퀘어 광고 게재에 관한 견적서입니다.\n게재 일정 및 상세 내용은 협의를 통해 조정 가능합니다."}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">특기사항</h3>
              <p className="text-sm whitespace-pre-wrap">
                {quote.specialNotes || "- 부가세 별도\n- 광고 소재는 게재 3일 전까지 제출\n- 결제는 게재 전 선입금 원칙"}
              </p>
            </div>
          </div>

          <div className="border-t-2 border-gray-300 pt-4 text-center text-sm text-gray-600">
            <p>본 견적서는 발행일로부터 30일간 유효합니다.</p>
            <p className="mt-2">감사합니다.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-quote"
          >
            닫기
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading.current}
            data-testid="button-download-pdf"
          >
            {isDownloading.current && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Download className="h-4 w-4 mr-2" />
            PDF 다운로드
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
