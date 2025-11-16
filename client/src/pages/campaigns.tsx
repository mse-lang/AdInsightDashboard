import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function Campaigns() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">캠페인 관리</h1>
          <p className="text-muted-foreground mt-2">
            광고 캠페인을 생성하고 관리합니다
          </p>
        </div>
        <Briefcase className="h-8 w-8 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>캠페인 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">캠페인 관리 기능</p>
            <p className="text-sm mt-2">곧 제공될 예정입니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
