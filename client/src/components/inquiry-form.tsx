import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import successImage from "@assets/generated_images/Inquiry_success_illustration_design_4953f188.png";

const inquirySchema = z.object({
  content: z.string().min(10, "문의 내용을 10자 이상 입력해주세요"),
  material: z.string().min(1, "소재를 입력해주세요"),
  period: z.string().min(1, "기간을 입력해주세요"),
  budget: z.string().min(1, "예산을 입력해주세요"),
  name: z.string().min(2, "담당자 이름을 입력해주세요"),
  phone: z.string().min(10, "휴대폰번호를 입력해주세요"),
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

export function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      content: "",
      material: "",
      period: "",
      budget: "",
      name: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = (data: InquiryFormData) => {
    console.log("Form submitted:", data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <img src={successImage} alt="Success" className="w-32 h-32 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">문의 주셔서 감사합니다</h2>
            <p className="text-muted-foreground">곧 광고담당자가 연락드리도록 하겠습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl">광고 문의</CardTitle>
          <CardDescription>아래 양식을 작성해주시면 담당자가 연락드리겠습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>문의 내용</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="광고 문의 내용을 상세히 작성해주세요" 
                        {...field} 
                        data-testid="input-inquiry-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>소재</FormLabel>
                      <FormControl>
                        <Input placeholder="광고 소재" {...field} data-testid="input-inquiry-material" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>기간</FormLabel>
                      <FormControl>
                        <Input placeholder="예: 2024-01-01 ~ 2024-01-31" {...field} data-testid="input-inquiry-period" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>예산</FormLabel>
                    <FormControl>
                      <Input placeholder="예산 (원)" {...field} data-testid="input-inquiry-budget" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>담당자 이름</FormLabel>
                      <FormControl>
                        <Input placeholder="이름" {...field} data-testid="input-inquiry-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>휴대폰번호</FormLabel>
                      <FormControl>
                        <Input placeholder="010-1234-5678" {...field} data-testid="input-inquiry-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일주소</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@email.com" {...field} data-testid="input-inquiry-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" data-testid="button-submit-inquiry">
                확인
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
