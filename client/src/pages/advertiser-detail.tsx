import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Advertiser, AdMaterial, Memo } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Building2, Mail, Phone, User, Calendar, DollarSign, FileText, TrendingUp } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function AdvertiserDetail() {
  const [, params] = useRoute("/advertisers/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const advertiserId = params?.id ? parseInt(params.id) : 0;

  const { data: advertiser, isLoading: advertiserLoading } = useQuery<Advertiser>({
    queryKey: ["/api/advertisers", advertiserId],
    enabled: !!advertiserId,
  });

  const { data: adMaterials = [], isLoading: materialsLoading } = useQuery<AdMaterial[]>({
    queryKey: ["/api/ad-materials/advertiser", advertiserId],
    enabled: !!advertiserId,
  });

  const { data: memos = [], isLoading: memosLoading } = useQuery<Memo[]>({
    queryKey: ["/api/memos/advertiser", advertiserId],
    enabled: !!advertiserId,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    contact: "",
    email: "",
    ceoName: "",
    businessNumber: "",
  });

  const updateAdvertiserMutation = useMutation({
    mutationFn: async (data: Partial<Advertiser>) => {
      return await apiRequest("PATCH", `/api/advertisers/${advertiserId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers", advertiserId] });
      toast({
        title: "광고주 정보 수정 완료",
        description: "광고주 정보가 성공적으로 수정되었습니다.",
      });
      setIsEditing(false);
    },
  });

  const handleEdit = () => {
    if (advertiser) {
      setEditForm({
        name: advertiser.name,
        contact: advertiser.contact,
        email: advertiser.email,
        ceoName: advertiser.ceoName || "",
        businessNumber: advertiser.businessNumber || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateAdvertiserMutation.mutate(editForm);
  };

  if (advertiserLoading || !advertiser) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalSpent = adMaterials.reduce((sum, material) => {
    return sum + (material.amount ? parseInt(material.amount) : 0);
  }, 0);

  const completedCampaigns = adMaterials.filter(m => m.status === "완료").length;
  const totalInquiries = adMaterials.length;
  const conversionRate = totalInquiries > 0 ? (completedCampaigns / totalInquiries) * 100 : 0;

  return (
    <div className="space-y-6" data-testid="page-advertiser-detail">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/advertisers")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{advertiser.name}</h1>
            <p className="text-muted-foreground mt-1">광고주 상세 정보</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit} data-testid="button-edit">
              정보 수정
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button onClick={handleSave} data-testid="button-save">
                저장
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 집행 금액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-spent">
              ₩{totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              전체 캠페인
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">집행 캠페인</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-campaigns-count">
              {adMaterials.length}건
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              완료: {completedCampaigns}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">문의 대비 집행율</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate">
              {conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedCampaigns}/{totalInquiries} 건 완료
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>광고주명</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  data-testid="input-edit-name"
                />
              </div>
              <div className="space-y-2">
                <Label>대표이사</Label>
                <Input
                  value={editForm.ceoName}
                  onChange={(e) => setEditForm({ ...editForm, ceoName: e.target.value })}
                  data-testid="input-edit-ceo"
                />
              </div>
              <div className="space-y-2">
                <Label>연락처</Label>
                <Input
                  value={editForm.contact}
                  onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                  data-testid="input-edit-contact"
                />
              </div>
              <div className="space-y-2">
                <Label>이메일</Label>
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  data-testid="input-edit-email"
                />
              </div>
              <div className="space-y-2">
                <Label>사업자등록번호</Label>
                <Input
                  value={editForm.businessNumber}
                  onChange={(e) => setEditForm({ ...editForm, businessNumber: e.target.value })}
                  data-testid="input-edit-business"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">광고주명</p>
                  <p className="font-medium" data-testid="text-name">{advertiser.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">대표이사</p>
                  <p className="font-medium" data-testid="text-ceo">{advertiser.ceoName || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">연락처</p>
                  <p className="font-medium" data-testid="text-contact">{advertiser.contact}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">이메일</p>
                  <p className="font-medium" data-testid="text-email">{advertiser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">사업자등록번호</p>
                  <p className="font-medium" data-testid="text-business">{advertiser.businessNumber || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">문의일</p>
                  <p className="font-medium" data-testid="text-inquiry-date">{advertiser.inquiryDate}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>광고 집행 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {materialsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : adMaterials.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">광고 집행 이력이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {adMaterials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`material-${material.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{material.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {material.startDate} ~ {material.endDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">₩{parseInt(material.amount).toLocaleString()}</p>
                    <Badge variant={material.status === "완료" ? "default" : "secondary"}>
                      {material.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>커뮤니케이션 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {memosLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : memos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">메모가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {memos.map((memo) => (
                <div
                  key={memo.id}
                  className="p-4 border rounded-lg"
                  data-testid={`memo-${memo.id}`}
                >
                  <p className="text-sm text-muted-foreground mb-2">
                    {memo.createdAt ? format(new Date(memo.createdAt), "yyyy-MM-dd HH:mm") : ""}
                  </p>
                  <p className="whitespace-pre-wrap">{memo.content}</p>
                  {memo.files && memo.files.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {memo.files.map((file, idx) => (
                        <Badge key={idx} variant="outline">
                          📎 {file}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
