import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Trash2, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Material {
  id: string;
  name: string;
  uploadDate: string;
  isValid: boolean;
  size: string;
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([
    {
      id: "1",
      name: "벤처스퀘어_광고소개서_2024_v1.pdf",
      uploadDate: "2024-01-20",
      isValid: true,
      size: "2.3 MB",
    },
    {
      id: "2",
      name: "광고_가이드_2024.pdf",
      uploadDate: "2024-01-15",
      isValid: false,
      size: "1.8 MB",
    },
    {
      id: "3",
      name: "미디어킷_Q1_2024.pdf",
      uploadDate: "2024-01-10",
      isValid: false,
      size: "3.1 MB",
    },
  ]);

  const toggleValidity = (id: string) => {
    setMaterials(
      materials.map((material) =>
        material.id === id ? { ...material, isValid: !material.isValid } : material
      )
    );
  };

  const deleteMaterial = (id: string) => {
    setMaterials(materials.filter((material) => material.id !== id));
  };

  const sortedMaterials = [...materials].sort(
    (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  );

  const validMaterial = materials.find((m) => m.isValid);

  return (
    <div className="space-y-6" data-testid="page-materials">
      <div>
        <h1 className="text-3xl font-bold">광고 소개서 관리</h1>
        <p className="text-muted-foreground mt-1">광고 소개서를 업로드하고 유효한 버전을 관리하세요</p>
      </div>

      {validMaterial && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">현재 유효한 광고 소개서</p>
                <p className="text-sm text-muted-foreground">{validMaterial.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>파일 업로드</CardTitle>
            <Button data-testid="button-upload">
              <Upload className="h-4 w-4 mr-2" />
              파일 선택
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              파일을 드래그하거나 클릭하여 업로드하세요
            </p>
            <p className="text-xs text-muted-foreground">PDF, PPTX, DOCX (최대 10MB)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>업로드된 파일</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">유효</TableHead>
                <TableHead>파일명</TableHead>
                <TableHead>업로드 날짜</TableHead>
                <TableHead>크기</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMaterials.map((material) => (
                <TableRow 
                  key={material.id} 
                  className={material.isValid ? "bg-green-50 dark:bg-green-950" : ""}
                  data-testid={`row-material-${material.id}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={material.isValid}
                      onCheckedChange={() => toggleValidity(material.id)}
                      data-testid={`checkbox-valid-${material.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{material.name}</span>
                      {material.isValid && (
                        <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-200">
                          현재 버전
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{material.uploadDate}</TableCell>
                  <TableCell className="text-muted-foreground">{material.size}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMaterial(material.id)}
                      data-testid={`button-delete-${material.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
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
