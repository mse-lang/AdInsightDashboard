import { useState } from "react";
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
import { Plus, Upload, Calendar, FileImage, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdSlotCard } from "@/components/ad-slot-card";

interface AdMaterial {
  id: string;
  advertiser: string;
  slot: string;
  fileName: string;
  startDate: string;
  endDate: string;
  amount: string;
  status: "예정" | "진행중" | "종료";
}

export default function AdSlotsDetailed() {
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);

  const mockSlots = [
    {
      id: "1",
      name: "메인배너",
      maxSlots: 8,
      currentSlots: 5,
      price: "₩1,000,000",
      status: "partial" as const,
      materials: ["banner_tech.jpg", "banner_ecom.jpg"],
    },
    {
      id: "2",
      name: "사이드배너 1",
      maxSlots: 4,
      currentSlots: 0,
      price: "₩500,000",
      status: "available" as const,
      materials: [],
    },
    {
      id: "3",
      name: "사이드배너 2",
      maxSlots: 4,
      currentSlots: 2,
      price: "₩500,000",
      status: "partial" as const,
      materials: ["side_ad.png"],
    },
  ];

  const mockMaterials: AdMaterial[] = [
    {
      id: "1",
      advertiser: "테크스타트업",
      slot: "메인배너",
      fileName: "banner_tech_2024.jpg",
      startDate: "2024-01-15",
      endDate: "2024-01-31",
      amount: "₩1,000,000",
      status: "진행중",
    },
    {
      id: "2",
      advertiser: "이커머스컴퍼니",
      slot: "메인배너",
      fileName: "ecom_banner.png",
      startDate: "2024-02-01",
      endDate: "2024-02-28",
      amount: "₩1,000,000",
      status: "예정",
    },
    {
      id: "3",
      advertiser: "핀테크솔루션",
      slot: "사이드배너 2",
      fileName: "fintech_side.jpg",
      startDate: "2024-01-01",
      endDate: "2024-01-15",
      amount: "₩500,000",
      status: "종료",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "진행중":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "예정":
        return "bg-green-100 text-green-700 border-green-200";
      case "종료":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6" data-testid="page-ad-slots-detailed">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">광고 구좌 관리</h1>
          <p className="text-muted-foreground mt-1">광고 구좌별 현황을 확인하고 관리하세요</p>
        </div>
        <Button data-testid="button-add-slot">
          <Plus className="h-4 w-4 mr-2" />
          구좌 추가
        </Button>
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
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="outline" className="w-full" size="sm">
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
                <TableHead>광고주</TableHead>
                <TableHead>구좌</TableHead>
                <TableHead>파일명</TableHead>
                <TableHead>노출 기간</TableHead>
                <TableHead className="text-right">집행 금액</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMaterials.map((material) => (
                <TableRow key={material.id} data-testid={`row-material-${material.id}`}>
                  <TableCell className="font-medium">{material.advertiser}</TableCell>
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
                    <Button variant="ghost" size="sm" data-testid={`button-view-${material.id}`}>
                      미리보기
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
