import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAdSchema } from "@shared/schema";
import type { Advertiser } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const formSchema = insertAdSchema.extend({
  advertiserId: z.number({
    required_error: "광고주를 선택해주세요",
  }),
  adId: z.string().min(1, "광고 ID를 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

export function AddAdDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: advertisers = [] } = useQuery<Advertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adId: "",
      advertiserId: undefined,
      status: "문의중",
      startDate: "",
      endDate: "",
      amount: "",
      description: "",
    },
  });

  const createAdMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/ads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      toast({
        title: "광고 추가 완료",
        description: "새 광고가 추가되었습니다.",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "오류",
        description: "광고 추가에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createAdMutation.mutate(data);
  };

  const generateAdId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    form.setValue("adId", `VSAD-${randomNum}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-ad">
          <Plus className="w-4 h-4 mr-2" />
          광고 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 광고 추가</DialogTitle>
          <DialogDescription>
            VSAD-XXXXXX 형식의 광고를 추가합니다
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>광고 ID *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="VSAD-XXXXXX"
                        {...field}
                        data-testid="input-ad-id"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateAdId}
                      data-testid="button-generate-ad-id"
                    >
                      자동 생성
                    </Button>
                  </div>
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
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-advertiser">
                        <SelectValue placeholder="광고주 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {advertisers.map((advertiser) => (
                        <SelectItem
                          key={advertiser.id}
                          value={advertiser.id.toString()}
                          data-testid={`select-item-advertiser-${advertiser.id}`}
                        >
                          {advertiser.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상태</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="문의중">문의중</SelectItem>
                      <SelectItem value="견적제시">견적제시</SelectItem>
                      <SelectItem value="일정조율중">일정조율중</SelectItem>
                      <SelectItem value="부킹확정">부킹확정</SelectItem>
                      <SelectItem value="집행중">집행중</SelectItem>
                      <SelectItem value="집행완료">집행완료</SelectItem>
                      <SelectItem value="중단">중단</SelectItem>
                      <SelectItem value="보류">보류</SelectItem>
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
                    <FormLabel>집행 시작일</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-start-date"
                      />
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
                    <FormLabel>집행 종료일</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-end-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>금액 (원)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="10000000"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="광고 설명"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createAdMutation.isPending}
                data-testid="button-submit"
              >
                {createAdMutation.isPending ? "추가 중..." : "추가"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
