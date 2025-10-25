import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { AdStatus } from "./status-badge";

const advertiserSchema = z.object({
  name: z.string().min(2, "광고주명을 입력해주세요"),
  contact: z.string().min(10, "연락처를 입력해주세요"),
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  businessNumber: z.string().optional(),
  ceoName: z.string().optional(),
  status: z.string(),
  inquiryDate: z.string(),
});

type AdvertiserFormData = z.infer<typeof advertiserSchema>;

interface AddAdvertiserDialogProps {
  onAdd?: (data: AdvertiserFormData) => void;
}

const allStatuses: AdStatus[] = [
  "문의중",
  "견적제시",
  "일정조율중",
  "부킹확정",
  "집행중",
  "결과보고",
  "세금계산서 발행 및 대금 청구",
  "매출 입금",
];

export function AddAdvertiserDialog({ onAdd }: AddAdvertiserDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<AdvertiserFormData>({
    resolver: zodResolver(advertiserSchema),
    defaultValues: {
      name: "",
      contact: "",
      email: "",
      businessNumber: "",
      ceoName: "",
      status: "문의중",
      inquiryDate: new Date().toISOString().split('T')[0],
    },
  });

  const createAdvertiserMutation = useMutation({
    mutationFn: async (data: AdvertiserFormData) => {
      return await apiRequest("POST", "/api/advertisers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers"] });
      toast({
        title: "광고주 추가 완료",
        description: "새로운 광고주가 추가되었습니다.",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdvertiserFormData) => {
    createAdvertiserMutation.mutate(data);
    onAdd?.(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-advertiser">
          <Plus className="h-4 w-4 mr-2" />
          광고주 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>광고주 추가</DialogTitle>
          <DialogDescription>새로운 광고주 정보를 입력하세요</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>광고주명 *</FormLabel>
                    <FormControl>
                      <Input placeholder="회사명" {...field} data-testid="input-advertiser-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ceoName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>대표이사</FormLabel>
                    <FormControl>
                      <Input placeholder="대표이사명" {...field} data-testid="input-ceo-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처 *</FormLabel>
                    <FormControl>
                      <Input placeholder="010-1234-5678" {...field} data-testid="input-contact" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일 *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@company.com"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="businessNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사업자등록번호</FormLabel>
                  <FormControl>
                    <Input placeholder="123-45-67890" {...field} data-testid="input-business-number" />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>첨부 파일</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" size="sm" data-testid="button-upload-business">
                  사업자등록증 업로드
                </Button>
                <Button type="button" variant="outline" size="sm" data-testid="button-upload-bank">
                  통장사본 업로드
                </Button>
                <Button type="button" variant="outline" size="sm" data-testid="button-upload-logo">
                  로고 업로드
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button 
                type="submit" 
                data-testid="button-submit-advertiser"
                disabled={createAdvertiserMutation.isPending}
              >
                {createAdvertiserMutation.isPending ? "추가 중..." : "추가"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
