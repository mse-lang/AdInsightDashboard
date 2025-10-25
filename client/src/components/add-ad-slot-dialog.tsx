import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertAdSlot } from "@shared/schema";

const adSlotFormSchema = z.object({
  name: z.string().min(1, "구좌명을 입력해주세요"),
  type: z.string().min(1, "구좌 유형을 선택해주세요"),
  maxSlots: z.string().min(1, "최대 슬롯 수를 입력해주세요"),
  price: z.string().min(1, "가격을 입력해주세요"),
  description: z.string().optional(),
});

type AdSlotFormData = z.infer<typeof adSlotFormSchema>;

export function AddAdSlotDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<AdSlotFormData>({
    resolver: zodResolver(adSlotFormSchema),
    defaultValues: {
      name: "",
      type: "",
      maxSlots: "",
      price: "",
      description: "",
    },
  });

  const createAdSlotMutation = useMutation({
    mutationFn: async (data: AdSlotFormData) => {
      const adSlotData: InsertAdSlot = {
        name: data.name,
        type: data.type,
        maxSlots: parseInt(data.maxSlots),
        price: data.price,
        description: data.description || null,
      };
      
      return await apiRequest("POST", "/api/ad-slots", adSlotData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-slots"] });
      toast({
        title: "구좌 추가 완료",
        description: "새로운 광고 구좌가 추가되었습니다.",
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

  const onSubmit = (data: AdSlotFormData) => {
    createAdSlotMutation.mutate(data);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} data-testid="button-add-slot">
        <Plus className="h-4 w-4 mr-2" />
        구좌 추가
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-add-ad-slot">
        <DialogHeader>
          <DialogTitle>새 광고 구좌 추가</DialogTitle>
          <DialogDescription>
            새로운 광고 구좌를 추가하세요
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>구좌명</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: 메인배너" 
                      {...field}
                      data-testid="input-slot-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>구좌 유형</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-slot-type">
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="메인배너">메인배너</SelectItem>
                      <SelectItem value="사이드배너">사이드배너</SelectItem>
                      <SelectItem value="뉴스레터배너">뉴스레터배너</SelectItem>
                      <SelectItem value="eDM">eDM</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxSlots"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>최대 슬롯 수</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="예: 8" 
                      {...field}
                      data-testid="input-max-slots"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>가격 (원)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: 1000000" 
                      {...field}
                      data-testid="input-slot-price"
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
                  <FormLabel>설명 (선택)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="구좌 설명" 
                      {...field}
                      data-testid="input-slot-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
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
                disabled={createAdSlotMutation.isPending}
                data-testid="button-submit-slot"
              >
                {createAdSlotMutation.isPending ? "추가중..." : "추가"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
      </Dialog>
    </>
  );
}
