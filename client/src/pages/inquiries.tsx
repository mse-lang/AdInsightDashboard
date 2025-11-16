import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, FileText, Clock, Building, Phone, User, ExternalLink, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface InquiryStats {
  total: number;
  lastWeek: number;
  lastMonth: number;
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  hasAttachments: boolean;
  labels: string[];
  matchedAdvertiserId: string | null;
  matchedAdvertiserName: string | null;
}

interface SurveyResponse {
  timestamp: string;
  companyName: string;
  email: string;
  phone: string;
  contactPerson: string;
  adBudget?: string;
  adType?: string;
  targetAudience?: string;
  additionalNotes?: string;
  matchedAdvertiserId: string | null;
  matchedAdvertiserName: string | null;
}

export default function Inquiries() {
  const [activeTab, setActiveTab] = useState("gmail");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<string>("");
  const [selectedInquiry, setSelectedInquiry] = useState<{
    type: 'gmail' | 'survey';
    data: any;
  } | null>(null);
  
  const { toast } = useToast();

  const { data: gmailData, isLoading: gmailLoading } = useQuery<{
    success: boolean;
    emails: GmailMessage[];
    total: number;
  }>({
    queryKey: ["/api/inquiries/gmail"],
  });

  const { data: surveyData, isLoading: surveyLoading } = useQuery<{
    success: boolean;
    responses: SurveyResponse[];
    total: number;
  }>({
    queryKey: ["/api/inquiries/survey"],
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<{
    success: boolean;
    total: InquiryStats;
    gmail: InquiryStats;
    survey: InquiryStats;
  }>({
    queryKey: ["/api/inquiries/stats"],
  });

  const { data: advertisersData } = useQuery<{
    success: boolean;
    advertisers: Array<{
      id: string;
      companyName: string;
      email: string;
      phone: string;
      status: string;
    }>;
  }>({
    queryKey: ["/api/advertisers"],
  });

  const linkMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/inquiries/link-advertiser", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries/survey"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries/gmail"] });
      toast({
        title: "성공",
        description: "광고주와 문의가 성공적으로 연결되었습니다"
      });
      setLinkDialogOpen(false);
      setSelectedAdvertiserId("");
      setSelectedInquiry(null);
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "광고주 연결에 실패했습니다",
        variant: "destructive"
      });
    }
  });

  const emails = gmailData?.emails || [];
  const surveyResponses = surveyData?.responses || [];
  const advertisers = advertisersData?.advertisers || [];
  const stats = statsData || {
    total: { total: 0, lastWeek: 0, lastMonth: 0 },
    gmail: { total: 0, lastWeek: 0, lastMonth: 0 },
    survey: { total: 0, lastWeek: 0, lastMonth: 0 }
  };

  const handleLinkAdvertiser = () => {
    if (!selectedAdvertiserId || !selectedInquiry) {
      toast({
        title: "오류",
        description: "광고주를 선택해주세요",
        variant: "destructive"
      });
      return;
    }

    const linkData: any = {
      advertiserId: selectedAdvertiserId,
      inquiryType: selectedInquiry.type,
    };

    if (selectedInquiry.type === 'gmail') {
      linkData.emailData = selectedInquiry.data;
    } else {
      linkData.surveyData = selectedInquiry.data;
    }

    linkMutation.mutate(linkData);
  };

  const openLinkDialog = (type: 'gmail' | 'survey', data: any) => {
    setSelectedInquiry({ type, data });
    setSelectedAdvertiserId("");
    setLinkDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">광고 문의 관리</h1>
        <p className="text-muted-foreground">
          ad@venturesquare.net 메일과 설문지 응답을 한 곳에서 확인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-total-inquiries">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">총 문의</p>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-2" data-testid="text-total-count">
              {statsLoading ? "-" : stats.total.total}
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>최근 1주일</span>
                <span className="font-medium" data-testid="text-total-week">
                  {statsLoading ? "-" : stats.total.lastWeek}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>최근 한 달</span>
                <span className="font-medium" data-testid="text-total-month">
                  {statsLoading ? "-" : stats.total.lastMonth}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-email-inquiries">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">이메일 문의</p>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-2" data-testid="text-email-count">
              {statsLoading ? "-" : stats.gmail.total}
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>최근 1주일</span>
                <span className="font-medium" data-testid="text-email-week">
                  {statsLoading ? "-" : stats.gmail.lastWeek}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>최근 한 달</span>
                <span className="font-medium" data-testid="text-email-month">
                  {statsLoading ? "-" : stats.gmail.lastMonth}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-survey-responses">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">설문 응답</p>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-2" data-testid="text-survey-count">
              {statsLoading ? "-" : stats.survey.total}
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>최근 1주일</span>
                <span className="font-medium" data-testid="text-survey-week">
                  {statsLoading ? "-" : stats.survey.lastWeek}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>최근 한 달</span>
                <span className="font-medium" data-testid="text-survey-month">
                  {statsLoading ? "-" : stats.survey.lastMonth}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="gmail" data-testid="tab-gmail">
            <Mail className="h-4 w-4 mr-2" />
            이메일 문의 ({emails.length})
          </TabsTrigger>
          <TabsTrigger value="survey" data-testid="tab-survey">
            <FileText className="h-4 w-4 mr-2" />
            설문지 응답 ({surveyResponses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gmail" className="space-y-4">
          {gmailLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">로딩 중...</p>
              </CardContent>
            </Card>
          ) : emails.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  ad@venturesquare.net으로 받은 메일이 없습니다
                </p>
              </CardContent>
            </Card>
          ) : (
            emails.map((email) => (
              <Card key={email.id} data-testid={`email-card-${email.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {email.subject || "(제목 없음)"}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {email.from}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {email.internalDate
                            ? format(
                                new Date(parseInt(email.internalDate)),
                                "yyyy-MM-dd HH:mm",
                                { locale: ko }
                              )
                            : "날짜 없음"}
                        </div>
                      </div>
                    </div>
                    {email.hasAttachments && (
                      <Badge variant="secondary" data-testid={`badge-attachment-${email.id}`}>
                        첨부파일
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {email.snippet || "(내용 없음)"}
                  </p>
                  {email.matchedAdvertiserName && (
                    <div className="mb-4 p-3 bg-muted rounded-md">
                      <p className="text-sm">
                        <span className="font-medium text-primary">
                          기존 광고주와 매칭됨:
                        </span>{" "}
                        {email.matchedAdvertiserName}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `https://mail.google.com/mail/u/0/#inbox/${email.id}`,
                          "_blank"
                        )
                      }
                      data-testid={`button-view-email-${email.id}`}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Gmail에서 보기
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openLinkDialog('gmail', email)}
                      data-testid={`button-link-email-${email.id}`}
                    >
                      <LinkIcon className="h-3 w-3 mr-2" />
                      광고주 연결
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="survey" className="space-y-4">
          {surveyLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">로딩 중...</p>
              </CardContent>
            </Card>
          ) : surveyResponses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  설문 응답이 없습니다
                </p>
              </CardContent>
            </Card>
          ) : (
            surveyResponses.map((response, index) => (
              <Card key={index} data-testid={`survey-card-${index}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {response.companyName}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {response.timestamp
                            ? format(
                                new Date(response.timestamp),
                                "yyyy-MM-dd HH:mm",
                                { locale: ko }
                              )
                            : "날짜 없음"}
                        </div>
                      </div>
                    </div>
                    {response.matchedAdvertiserId && (
                      <Badge variant="default" data-testid={`badge-matched-${index}`}>
                        기존 광고주
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">담당자:</span>{" "}
                        {response.contactPerson}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">이메일:</span>{" "}
                        {response.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">전화:</span>{" "}
                        {response.phone}
                      </span>
                    </div>
                    {response.adBudget && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="font-medium">예산:</span>{" "}
                          {response.adBudget}
                        </span>
                      </div>
                    )}
                  </div>

                  {response.adType && (
                    <div>
                      <p className="text-sm font-medium mb-1">광고 유형</p>
                      <p className="text-sm text-muted-foreground">
                        {response.adType}
                      </p>
                    </div>
                  )}

                  {response.targetAudience && (
                    <div>
                      <p className="text-sm font-medium mb-1">목표 타겟</p>
                      <p className="text-sm text-muted-foreground">
                        {response.targetAudience}
                      </p>
                    </div>
                  )}

                  {response.additionalNotes && (
                    <div>
                      <p className="text-sm font-medium mb-1">추가 메모</p>
                      <p className="text-sm text-muted-foreground">
                        {response.additionalNotes}
                      </p>
                    </div>
                  )}

                  {response.matchedAdvertiserName && (
                    <div className="pt-3 border-t">
                      <p className="text-sm">
                        <span className="font-medium text-primary">
                          기존 광고주와 매칭됨:
                        </span>{" "}
                        {response.matchedAdvertiserName}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `https://docs.google.com/spreadsheets/d/1UQnH5bGhmZIkQ_-WJil-vsibpjq0pmbophowGjLqhCE/edit#gid=0`,
                          "_blank"
                        )
                      }
                      data-testid={`button-view-survey-${index}`}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Google Sheets에서 보기
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openLinkDialog('survey', response)}
                      data-testid={`button-link-survey-${index}`}
                    >
                      <LinkIcon className="h-3 w-3 mr-2" />
                      광고주 연결
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent data-testid="dialog-link-advertiser">
          <DialogHeader>
            <DialogTitle>광고주 연결</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">광고주 선택</label>
              <Select value={selectedAdvertiserId} onValueChange={setSelectedAdvertiserId}>
                <SelectTrigger data-testid="select-advertiser">
                  <SelectValue placeholder="광고주를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {advertisers.filter(a => a.status === 'Active').map((advertiser) => (
                    <SelectItem key={advertiser.id} value={advertiser.id} data-testid={`select-item-${advertiser.id}`}>
                      {advertiser.companyName} ({advertiser.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedInquiry && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="font-medium mb-1">선택된 문의</p>
                {selectedInquiry.type === 'gmail' ? (
                  <p className="text-muted-foreground">
                    이메일: {selectedInquiry.data.subject || "(제목 없음)"}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    설문 응답: {selectedInquiry.data.companyName}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkDialogOpen(false)}
              data-testid="button-cancel-link"
            >
              취소
            </Button>
            <Button
              onClick={handleLinkAdvertiser}
              disabled={!selectedAdvertiserId || linkMutation.isPending}
              data-testid="button-confirm-link"
            >
              {linkMutation.isPending ? "연결 중..." : "연결"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
