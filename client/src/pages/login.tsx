import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력하세요"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [linkSent, setLinkSent] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  const requestLinkMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/request-link", data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.autoLogin) {
        // Auto-login in development mode
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        toast({
          title: "로그인 완료",
          description: "자동으로 로그인되었습니다.",
        });
      } else {
        // Show email sent message in production mode
        setLinkSent(true);
        toast({
          title: "이메일 발송 완료",
          description: "인증 링크가 이메일로 발송되었습니다. 메일함을 확인하세요.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: error.message || "인증 링크 발송에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    requestLinkMutation.mutate(data);
  };

  if (linkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">이메일을 확인하세요</CardTitle>
            <CardDescription className="mt-2">
              {form.getValues("email")}로 인증 링크를 발송했습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p className="mb-2">이메일함에서 인증 링크를 클릭하면 자동으로 로그인됩니다.</p>
              <p>링크는 15분 동안 유효합니다.</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setLinkSent(false);
                form.reset();
              }}
              data-testid="button-back-to-login"
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">벤처스퀘어 광고 관리</CardTitle>
          <CardDescription className="mt-2">
            이메일 주소를 입력하시면 인증 링크를 보내드립니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ad@venturesquare.net"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={requestLinkMutation.isPending}
                data-testid="button-request-link"
              >
                {requestLinkMutation.isPending ? "발송 중..." : "인증 링크 받기"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>등록된 관리자 이메일 주소만 접근 가능합니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
