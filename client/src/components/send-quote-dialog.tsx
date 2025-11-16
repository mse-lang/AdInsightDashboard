import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, Phone } from "lucide-react";

interface SendQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  advertiserEmail?: string;
  advertiserPhone?: string;
  onSuccess?: () => void;
}

export function SendQuoteDialog({
  open,
  onOpenChange,
  quoteId,
  advertiserEmail,
  advertiserPhone,
  onSuccess,
}: SendQuoteDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("email");
  const [message, setMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState(advertiserEmail || "");
  const [recipientPhone, setRecipientPhone] = useState(advertiserPhone || "");
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/quotes/${quoteId}/send-email`, {
        recipientEmail: recipientEmail || undefined,
        message,
      }),
    onSuccess: () => {
      toast({
        title: "이메일 발송 완료",
        description: "견적서가 이메일로 발송되었습니다.",
      });
      onOpenChange(false);
      setMessage("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "이메일 발송 실패",
        description: error.error || error.message || "이메일 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const sendSMSMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/quotes/${quoteId}/send-sms`, {
        recipientPhone: recipientPhone || undefined,
        message,
      }),
    onSuccess: () => {
      toast({
        title: "SMS 발송 완료",
        description: "견적서가 SMS로 발송되었습니다.",
      });
      onOpenChange(false);
      setMessage("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "SMS 발송 실패",
        description: error.error || error.message || "SMS 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const sendKakaoMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/quotes/${quoteId}/send-kakao`, {
        recipientPhone: recipientPhone || undefined,
        message,
      }),
    onSuccess: () => {
      toast({
        title: "카카오톡 발송 완료",
        description: "견적서가 카카오톡으로 발송되었습니다.",
      });
      onOpenChange(false);
      setMessage("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "카카오톡 발송 실패",
        description: error.error || error.message || "카카오톡 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (activeTab === "email") {
      sendEmailMutation.mutate();
    } else if (activeTab === "sms") {
      sendSMSMutation.mutate();
    } else if (activeTab === "kakao") {
      sendKakaoMutation.mutate();
    }
  };

  const isPending =
    sendEmailMutation.isPending ||
    sendSMSMutation.isPending ||
    sendKakaoMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-send-quote">
        <DialogHeader>
          <DialogTitle>견적서 발송</DialogTitle>
          <DialogDescription>
            이메일, SMS, 카카오톡 중 원하는 방법으로 견적서를 발송하세요.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" data-testid="tab-email">
              <Mail className="h-4 w-4 mr-2" />
              이메일
            </TabsTrigger>
            <TabsTrigger value="sms" data-testid="tab-sms">
              <Phone className="h-4 w-4 mr-2" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="kakao" data-testid="tab-kakao">
              <MessageSquare className="h-4 w-4 mr-2" />
              카카오톡
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">받는 사람 이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                data-testid="input-recipient-email"
              />
              {advertiserEmail && (
                <p className="text-xs text-muted-foreground">
                  기본값: {advertiserEmail}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-message">메시지 (선택사항)</Label>
              <Textarea
                id="email-message"
                placeholder="추가 메시지를 입력하세요..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                data-testid="textarea-email-message"
              />
            </div>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="phone">받는 사람 전화번호</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                data-testid="input-recipient-phone-sms"
              />
              {advertiserPhone && (
                <p className="text-xs text-muted-foreground">
                  기본값: {advertiserPhone}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-message">메시지 (선택사항)</Label>
              <Textarea
                id="sms-message"
                placeholder="추가 메시지를 입력하세요..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                data-testid="textarea-sms-message"
              />
              <p className="text-xs text-muted-foreground">
                기본 메시지가 자동으로 추가됩니다.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="kakao" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="kakao-phone">받는 사람 전화번호</Label>
              <Input
                id="kakao-phone"
                type="tel"
                placeholder="010-1234-5678"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                data-testid="input-recipient-phone-kakao"
              />
              {advertiserPhone && (
                <p className="text-xs text-muted-foreground">
                  기본값: {advertiserPhone}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="kakao-message">메시지 (선택사항)</Label>
              <Textarea
                id="kakao-message"
                placeholder="추가 메시지를 입력하세요..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                data-testid="textarea-kakao-message"
              />
              <p className="text-xs text-muted-foreground">
                기본 메시지가 자동으로 추가됩니다.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-testid="button-cancel"
          >
            취소
          </Button>
          <Button
            onClick={handleSend}
            disabled={isPending}
            data-testid="button-send"
          >
            {isPending ? "발송 중..." : "발송"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
