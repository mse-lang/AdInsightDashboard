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
import { Plus, Upload, X } from "lucide-react";
import { AdStatus } from "./status-badge";
import { Textarea } from "@/components/ui/textarea";
import type { InsertAdvertiser, InsertContact, InsertMemo } from "@shared/schema";

const advertiserSchema = z.object({
  name: z.string().min(2, "광고주명을 입력해주세요"),
  contactName: z.string().min(2, "담당자명을 입력해주세요"),
  contactPhone: z.string().min(10, "연락처를 입력해주세요"),
  contactEmail: z.string().email("올바른 이메일 주소를 입력해주세요"),
  contactPosition: z.string().optional(),
  businessNumber: z.string().optional(),
  ceoName: z.string().optional(),
  status: z.string(),
  inquiryDate: z.string(),
  memo: z.string().optional(),
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
  const [businessRegFile, setBusinessRegFile] = useState<string>("");
  const [bankAccountFile, setBankAccountFile] = useState<string>("");
  const [logoFile, setLogoFile] = useState<string>("");
  
  const form = useForm<AdvertiserFormData>({
    resolver: zodResolver(advertiserSchema),
    defaultValues: {
      name: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      contactPosition: "",
      businessNumber: "",
      ceoName: "",
      status: "문의중",
      inquiryDate: new Date().toISOString().split('T')[0],
      memo: "",
    },
  });

  const createAdvertiserMutation = useMutation({
    mutationFn: async (data: AdvertiserFormData) => {
      const advertiserData: InsertAdvertiser = {
        name: data.name,
        businessNumber: data.businessNumber,
        ceoName: data.ceoName,
        status: data.status,
        inquiryDate: data.inquiryDate,
        businessRegFile: businessRegFile || undefined,
        bankAccountFile: bankAccountFile || undefined,
        logoFile: logoFile || undefined,
      };
      
      const res = await apiRequest("POST", "/api/advertisers", advertiserData);
      const advertiser = await res.json();
      
      try {
        const contactData: InsertContact = {
          advertiserId: advertiser.id,
          name: data.contactName,
          email: data.contactEmail,
          phone: data.contactPhone,
          position: data.contactPosition,
          isPrimary: true,
        };
        
        await apiRequest("POST", "/api/contacts", contactData);
        
        if (data.memo && data.memo.trim()) {
          const memoData: InsertMemo = {
            advertiserId: advertiser.id,
            content: data.memo,
            files: [],
          };
          await apiRequest("POST", "/api/memos", memoData);
        }
        
        return advertiser;
      } catch (error) {
        await apiRequest("DELETE", `/api/advertisers/${advertiser.id}`, undefined);
        throw new Error("담당자/메모 정보 저장 실패. 광고주 추가를 롤백했습니다.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/all"] });
      toast({
        title: "광고주 추가 완료",
        description: "새로운 광고주가 추가되었습니다.",
      });
      form.reset();
      setBusinessRegFile("");
      setBankAccountFile("");
      setLogoFile("");
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
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file.name);
    }
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

            <div className="space-y-4 p-4 border rounded-md">
              <Label className="font-semibold">주 담당자 정보 *</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>담당자명 *</FormLabel>
                      <FormControl>
                        <Input placeholder="홍길동" {...field} data-testid="input-contact-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>직책</FormLabel>
                      <FormControl>
                        <Input placeholder="마케팅 팀장" {...field} data-testid="input-contact-position" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>연락처 *</FormLabel>
                      <FormControl>
                        <Input placeholder="010-1234-5678" {...field} data-testid="input-contact-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일 *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@company.com"
                          {...field}
                          data-testid="input-contact-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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

            <div className="space-y-3">
              <Label>첨부 파일</Label>
              <div className="space-y-2">
                <div>
                  <Input
                    type="file"
                    id="business-reg-file"
                    onChange={(e) => handleFileChange(e, setBusinessRegFile)}
                    className="hidden"
                    data-testid="input-file-business"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("business-reg-file")?.click()}
                      data-testid="button-upload-business"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      사업자등록증 업로드
                    </Button>
                    {businessRegFile && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{businessRegFile}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setBusinessRegFile("")}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Input
                    type="file"
                    id="bank-account-file"
                    onChange={(e) => handleFileChange(e, setBankAccountFile)}
                    className="hidden"
                    data-testid="input-file-bank"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("bank-account-file")?.click()}
                      data-testid="button-upload-bank"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      통장사본 업로드
                    </Button>
                    {bankAccountFile && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{bankAccountFile}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setBankAccountFile("")}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Input
                    type="file"
                    id="logo-file"
                    onChange={(e) => handleFileChange(e, setLogoFile)}
                    className="hidden"
                    accept="image/*"
                    data-testid="input-file-logo"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logo-file")?.click()}
                      data-testid="button-upload-logo"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      로고 업로드
                    </Button>
                    {logoFile && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{logoFile}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setLogoFile("")}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>초기 메모 (선택)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="광고주에 대한 초기 메모를 입력하세요"
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="textarea-memo"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
