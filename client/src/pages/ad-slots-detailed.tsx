import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Upload, Calendar, FileImage, Edit, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdSlotCard } from "@/components/ad-slot-card";
import { EditAdvertiserDialog } from "@/components/edit-advertiser-dialog";
import { SelectAdvertiserDialog, type AdvertiserInfo } from "@/components/select-advertiser-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import type { Advertiser, Pricing, Ad } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { AdStatus } from "@/components/status-badge";
import { getStatusColor } from "@/components/status-badge";

interface AdMaterial {
  id: string;
  adId: string;
  advertiserId: string;
  slot: string;
  fileName: string;
  startDate: string;
  endDate: string;
  amount: string;
  status: AdStatus | "예정" | "진행중" | "종료";
}

type SlotStatus = "available" | "partial" | "full";

const ALL_STATUSES: AdStatus[] = [
  "문의중",
  "견적제시",
  "일정조율중",
  "부킹확정",
  "집행중",
  "결과보고",
  "세금계산서 발행 및 대금 청구",
  "매출 입금",
];

export default function AdSlotsDetailed() {
  const [location, setLocation] = useLocation();
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<AdMaterial | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<number | null>(null);
  const [isAdvertiserDialogOpen, setIsAdvertiserDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AdStatus | null>(null);
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isSelectAdvertiserForUpload, setIsSelectAdvertiserForUpload] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    advertiserId: "",
    advertiserName: "",
    slot: "",
    fileName: "",
    startDate: "",
    endDate: "",
    amount: "",
  });

  const [isAddSlotDialogOpen, setIsAddSlotDialogOpen] = useState(false);
  const [newSlotData, setNewSlotData] = useState({
    name: "",
    pricingId: "",
    maxSlots: 1,
  });
  
  const { toast } = useToast();

  // URL 쿼리 파라미터에서 status 읽기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    if (statusParam && ALL_STATUSES.includes(statusParam as AdStatus)) {
      setSelectedStatus(statusParam as AdStatus);
    } else {
      setSelectedStatus(null);
    }
  }, [location]);

  const { data: advertisers = [] } = useQuery<Advertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const { data: pricings = [] } = useQuery<Pricing[]>({
    queryKey: ["/api/pricings"],
  });

  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ["/api/ads"],
  });

  const getAdvertiserName = (advertiserId: string): string => {
    const advertiser = advertisers.find(a => a.id.toString() === advertiserId);
    return advertiser?.name || "알 수 없음";
  };

  const mockSlots: Array<{
    id: string;
    name: string;
    maxSlots: number;
    currentSlots: number;
    price: string;
    status: SlotStatus;
    materials: string[];
  }> = [
    {
      id: "1",
      name: "메인배너",
      maxSlots: 8,
      currentSlots: 5,
      price: "₩1,000,000",
      status: "partial",
      materials: ["banner_tech.jpg", "banner_ecom.jpg"],
    },
    {
      id: "2",
      name: "사이드배너 1",
      maxSlots: 4,
      currentSlots: 0,
      price: "₩500,000",
      status: "available",
      materials: [],
    },
    {
      id: "3",
      name: "사이드배너 2",
      maxSlots: 4,
      currentSlots: 2,
      price: "₩500,000",
      status: "partial",
      materials: ["side_ad.png"],
    },
  ];

  // ads 데이터를 AdMaterial 형식으로 변환
  // 실제 데이터가 없으면 mock 데이터 사용
  const mockMaterials: AdMaterial[] = ads.length > 0 
    ? ads.map((ad) => ({
        id: ad.id.toString(),
        adId: ad.adId,
        advertiserId: ad.advertiserId.toString(),
        slot: ad.description || "-",
        fileName: "광고 소재 파일",
        startDate: ad.startDate || "-",
        endDate: ad.endDate || "-",
        amount: ad.amount ? `₩${parseInt(ad.amount).toLocaleString()}` : "-",
        status: ad.status as AdStatus | "예정" | "진행중" | "종료",
      }))
    : (advertisers.length > 0 ? [
        {
          id: "1",
          adId: "VSAD-0001",
          advertiserId: advertisers[0]?.id.toString() || "1",
          slot: "메인배너",
          fileName: "banner_tech_2024.jpg",
          startDate: "2024-01-15",
          endDate: "2024-01-31",
          amount: "₩1,000,000",
          status: "진행중",
        },
        {
          id: "2",
          adId: "VSAD-0002",
          advertiserId: advertisers[1]?.id.toString() || "2",
          slot: "메인배너",
          fileName: "ecom_banner.png",
          startDate: "2024-02-01",
          endDate: "2024-02-28",
          amount: "₩1,000,000",
          status: "예정",
        },
        {
          id: "3",
          adId: "VSAD-0003",
          advertiserId: advertisers[2]?.id.toString() || "3",
          slot: "사이드배너 2",
          fileName: "fintech_side.jpg",
          startDate: "2024-01-01",
          endDate: "2024-01-15",
          amount: "₩500,000",
          status: "종료",
        },
      ] : []);

  // Advertiser의 상태로 필터링하고 광고 ID 최신순으로 정렬
  const filteredMaterials = useMemo(() => {
    let filtered = mockMaterials;
    
    if (selectedStatus) {
      filtered = mockMaterials.filter(material => {
        const advertiser = advertisers.find(a => a.id.toString() === material.advertiserId);
        return advertiser && advertiser.status === selectedStatus;
      });
    }
    
    // 광고 ID 기준 최신순 정렬 (VSAD-0003, VSAD-0002, VSAD-0001)
    return [...filtered].sort((a, b) => b.adId.localeCompare(a.adId));
  }, [mockMaterials, selectedStatus, advertisers]);

  // 배지 토글 핸들러
  const handleStatusToggle = (status: AdStatus) => {
    if (selectedStatus === status) {
      // 이미 선택된 상태면 off (필터 제거)
      setSelectedStatus(null);
      setLocation("/ad-slots");
    } else {
      // 새로운 상태 선택 (on)
      setSelectedStatus(status);
      setLocation(`/ad-slots?status=${encodeURIComponent(status)}`);
    }
  };

  const handleEditMaterial = (materialId: string) => {
    setEditingMaterialId(materialId);
    toast({
      title: "소재 편집",
      description: "소재 편집 기능이 활성화되었습니다.",
    });
  };

  const handleAdvertiserClick = (advertiserId: string) => {
    setSelectedAdvertiserId(parseInt(advertiserId));
    setIsAdvertiserDialogOpen(true);
  };

  const handleOpenUploadDialog = () => {
    setUploadFormData({
      advertiserId: "",
      advertiserName: "",
      slot: "",
      fileName: "",
      startDate: "",
      endDate: "",
      amount: "",
    });
    setIsUploadDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFormData({ ...uploadFormData, fileName: file.name });
    }
  };

  const handleAdvertiserSelectForUpload = (advertiser: AdvertiserInfo) => {
    setUploadFormData({
      ...uploadFormData,
      advertiserId: advertiser.id.toString(),
      advertiserName: advertiser.name,
    });
  };

  const handleUploadSubmit = () => {
    if (!uploadFormData.advertiserId || !uploadFormData.slot || !uploadFormData.fileName) {
      toast({
        title: "필수 항목 누락",
        description: "광고주, 구좌, 파일을 모두 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "소재 업로드 완료",
      description: `${uploadFormData.advertiserName}의 ${uploadFormData.slot} 소재가 업로드되었습니다.`,
    });
    setIsUploadDialogOpen(false);
  };

  const handleOpenAddSlotDialog = () => {
    setNewSlotData({
      name: "",
      pricingId: "",
      maxSlots: 1,
    });
    setIsAddSlotDialogOpen(true);
  };

  const handleAddSlotSubmit = () => {
    if (!newSlotData.name || !newSlotData.pricingId) {
      toast({
        title: "필수 항목 누락",
        description: "구좌명과 상품을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    const selectedPricing = pricings.find(p => p.id.toString() === newSlotData.pricingId);
    
    toast({
      title: "구좌 추가 완료",
      description: `${newSlotData.name} 구좌가 추가되었습니다.`,
    });
    setIsAddSlotDialogOpen(false);
  };

  return (
    <div className="space-y-6" data-testid="page-ad-slots-detailed">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">광고 집행 관리</h1>
          <p className="text-muted-foreground mt-1">광고 구좌별 현황을 확인하고 관리하세요</p>
        </div>
        <Button 
          onClick={handleOpenAddSlotDialog}
          data-testid="button-add-slot"
        >
          <Plus className="h-4 w-4 mr-2" />
          구좌 추가
        </Button>
      </div>

      {/* 상태 필터 배지 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">상태 필터:</span>
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusToggle(status)}
            className="bg-transparent border-0 p-0 cursor-pointer"
            data-testid={`filter-status-${status}`}
            type="button"
            aria-pressed={selectedStatus === status}
            aria-label={`${status} 필터${selectedStatus === status ? ' 활성화됨' : ''}`}
          >
            <Badge
              variant={selectedStatus === status ? "default" : "outline"}
              className={`hover-elevate ${selectedStatus === status ? getStatusColor(status) : ""}`}
            >
              {status}
              {selectedStatus === status && <X className="h-3 w-3 ml-1" />}
            </Badge>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockSlots.map((slot) => (
          <Card key={slot.id} data-testid={`card-slot-${slot.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{slot.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {slot.currentSlots} / {slot.maxSlots} 슬롯 사용중
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    slot.status === "available"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : slot.status === "full"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                  }
                >
                  {slot.status === "available"
                    ? "이용 가능"
                    : slot.status === "full"
                    ? "사용 중"
                    : "부분 사용"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-2xl font-bold font-mono">{slot.price}</p>
                <p className="text-xs text-muted-foreground">슬롯당 가격</p>
              </div>

              {slot.materials.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">등록된 소재</Label>
                  <div className="mt-2 space-y-1">
                    {slot.materials.map((material, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm p-2 bg-muted rounded-md"
                      >
                        <FileImage className="h-3 w-3 text-muted-foreground" />
                        <span className="flex-1 truncate text-xs">{material}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditMaterial(`${slot.id}-${idx}`)}
                          data-testid={`button-edit-material-${slot.id}-${idx}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full" 
                size="sm"
                onClick={handleOpenUploadDialog}
                data-testid="button-upload-material"
              >
                <Upload className="h-4 w-4 mr-2" />
                소재 업로드
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>광고 소재 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>광고 ID</TableHead>
                <TableHead>광고주</TableHead>
                <TableHead>구좌</TableHead>
                <TableHead>파일명</TableHead>
                <TableHead>노출 기간</TableHead>
                <TableHead className="text-right">집행 금액</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">확인하기</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {selectedStatus ? `"${selectedStatus}" 상태의 광고 소재가 없습니다` : "광고 소재가 없습니다"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => (
                  <TableRow key={material.id} data-testid={`row-material-${material.id}`}>
                  <TableCell className="font-mono font-medium" data-testid={`cell-ad-id-${material.id}`}>
                    {material.adId}
                  </TableCell>
                  <TableCell 
                    className="font-medium cursor-pointer hover:text-primary hover:underline"
                    onClick={() => handleAdvertiserClick(material.advertiserId)}
                    data-testid={`cell-advertiser-${material.id}`}
                  >
                    {getAdvertiserName(material.advertiserId)}
                  </TableCell>
                  <TableCell>{material.slot}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{material.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingSchedule === material.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          defaultValue={material.startDate}
                          className="w-32 text-xs"
                          data-testid={`input-start-${material.id}`}
                        />
                        <Input
                          type="date"
                          defaultValue={material.endDate}
                          className="w-32 text-xs"
                          data-testid={`input-end-${material.id}`}
                        />
                        <Button
                          size="sm"
                          onClick={() => setEditingSchedule(null)}
                          data-testid={`button-save-${material.id}`}
                        >
                          저장
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {material.startDate} ~ {material.endDate}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSchedule(material.id)}
                          data-testid={`button-edit-schedule-${material.id}`}
                        >
                          <Calendar className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">{material.amount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(material.status)} border`}>
                      {material.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPreviewMaterial(material)}
                      data-testid={`button-view-${material.id}`}
                    >
                      미리보기
                    </Button>
                  </TableCell>
                </TableRow>
              )))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!previewMaterial} onOpenChange={() => setPreviewMaterial(null)}>
        <DialogContent className="max-w-3xl" data-testid="dialog-material-preview">
          <DialogHeader>
            <DialogTitle>광고 소재 미리보기</DialogTitle>
            <DialogDescription>
              {previewMaterial && (
                <>
                  {getAdvertiserName(previewMaterial.advertiserId)} - {previewMaterial.slot}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {previewMaterial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">파일명</Label>
                  <p className="font-medium">{previewMaterial.fileName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">상태</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={`${getStatusColor(previewMaterial.status)} border`}>
                      {previewMaterial.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">노출 기간</Label>
                  <p className="font-medium">
                    {previewMaterial.startDate} ~ {previewMaterial.endDate}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">집행 금액</Label>
                  <p className="font-medium font-mono">{previewMaterial.amount}</p>
                </div>
              </div>

              <div className="border rounded-md p-4 bg-muted/50">
                <Label className="text-muted-foreground mb-2 block">소재 이미지</Label>
                <div className="flex items-center justify-center min-h-[300px] bg-background rounded-md border-2 border-dashed">
                  <div className="text-center space-y-2">
                    <FileImage className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {previewMaterial.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      이미지 미리보기는 실제 소재 업로드 후 표시됩니다
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewMaterial(null)} data-testid="button-close-preview">
                  닫기
                </Button>
                <Button data-testid="button-download">
                  <Upload className="h-4 w-4 mr-2" />
                  다운로드
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditAdvertiserDialog
        open={isAdvertiserDialogOpen}
        onOpenChange={setIsAdvertiserDialogOpen}
        advertiserId={selectedAdvertiserId}
      />

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-upload-material">
          <DialogHeader>
            <DialogTitle>광고 소재 업로드</DialogTitle>
            <DialogDescription>
              광고 소재를 업로드하고 노출 일정을 설정하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>광고주</Label>
              <div className="flex gap-2">
                <Input
                  value={uploadFormData.advertiserName}
                  placeholder="광고주를 선택하세요"
                  readOnly
                  data-testid="input-upload-advertiser"
                />
                <Button
                  variant="outline"
                  onClick={() => setIsSelectAdvertiserForUpload(true)}
                  data-testid="button-select-upload-advertiser"
                >
                  선택
                </Button>
              </div>
            </div>

            <div>
              <Label>광고 구좌</Label>
              <Select
                value={uploadFormData.slot}
                onValueChange={(value) => setUploadFormData({ ...uploadFormData, slot: value })}
              >
                <SelectTrigger data-testid="select-upload-slot">
                  <SelectValue placeholder="구좌를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {mockSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.name}>
                      {slot.name} - {slot.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>소재 파일</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                data-testid="input-upload-file"
              />
              {uploadFormData.fileName && (
                <p className="text-sm text-muted-foreground mt-1">
                  선택된 파일: {uploadFormData.fileName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>노출 시작일</Label>
                <Input
                  type="date"
                  value={uploadFormData.startDate}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, startDate: e.target.value })}
                  data-testid="input-upload-start-date"
                />
              </div>
              <div>
                <Label>노출 종료일</Label>
                <Input
                  type="date"
                  value={uploadFormData.endDate}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, endDate: e.target.value })}
                  data-testid="input-upload-end-date"
                />
              </div>
            </div>

            <div>
              <Label>집행 금액</Label>
              <Input
                type="number"
                value={uploadFormData.amount}
                onChange={(e) => setUploadFormData({ ...uploadFormData, amount: e.target.value })}
                placeholder="금액을 입력하세요"
                className="font-mono"
                data-testid="input-upload-amount"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              data-testid="button-cancel-upload"
            >
              취소
            </Button>
            <Button
              onClick={handleUploadSubmit}
              data-testid="button-submit-upload"
            >
              <Upload className="h-4 w-4 mr-2" />
              업로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SelectAdvertiserDialog
        open={isSelectAdvertiserForUpload}
        onOpenChange={setIsSelectAdvertiserForUpload}
        onSelect={handleAdvertiserSelectForUpload}
      />

      <Dialog open={isAddSlotDialogOpen} onOpenChange={setIsAddSlotDialogOpen}>
        <DialogContent data-testid="dialog-add-slot">
          <DialogHeader>
            <DialogTitle>새 광고 구좌 추가</DialogTitle>
            <DialogDescription>
              새로운 광고 구좌를 추가하고 단가를 설정하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>구좌명</Label>
              <Input
                value={newSlotData.name}
                onChange={(e) => setNewSlotData({ ...newSlotData, name: e.target.value })}
                placeholder="예: 메인배너, 사이드배너"
                data-testid="input-slot-name"
              />
            </div>

            <div>
              <Label>상품 선택 (단가표 연동)</Label>
              <Select
                value={newSlotData.pricingId}
                onValueChange={(value) => setNewSlotData({ ...newSlotData, pricingId: value })}
              >
                <SelectTrigger data-testid="select-slot-pricing">
                  <SelectValue placeholder="단가표에서 상품을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {pricings.map((pricing) => (
                    <SelectItem key={pricing.id} value={pricing.id.toString()}>
                      {pricing.productName} - ₩{parseInt(pricing.price).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                설정 &gt; 단가 관리에서 단가를 추가/수정할 수 있습니다
              </p>
            </div>

            <div>
              <Label>최대 슬롯 수</Label>
              <Input
                type="number"
                value={newSlotData.maxSlots}
                onChange={(e) => setNewSlotData({ ...newSlotData, maxSlots: parseInt(e.target.value) || 1 })}
                min="1"
                data-testid="input-slot-max"
              />
            </div>

            {newSlotData.pricingId && (
              <div className="p-4 bg-muted rounded-md">
                <Label className="text-sm text-muted-foreground">선택된 상품 정보</Label>
                {(() => {
                  const selectedPricing = pricings.find(p => p.id.toString() === newSlotData.pricingId);
                  return selectedPricing ? (
                    <div className="mt-2 space-y-1 text-sm">
                      <p><strong>상품명:</strong> {selectedPricing.productName}</p>
                      <p><strong>단가:</strong> ₩{parseInt(selectedPricing.price).toLocaleString()}</p>
                      {selectedPricing.specs && <p><strong>규격:</strong> {selectedPricing.specs}</p>}
                      {selectedPricing.description && <p><strong>설명:</strong> {selectedPricing.description}</p>}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddSlotDialogOpen(false)}
              data-testid="button-cancel-add-slot"
            >
              취소
            </Button>
            <Button
              onClick={handleAddSlotSubmit}
              data-testid="button-submit-add-slot"
            >
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
