import { useQuery } from "@tanstack/react-query";
import type { AirtableAdvertiser } from "@/types/airtable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useLocation } from "wouter";

export default function AdvertisersAirtable() {
  const [, setLocation] = useLocation();

  const { data: advertisers = [], isLoading } = useQuery<AirtableAdvertiser[]>({
    queryKey: ["/api/advertisers"],
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Lead':
        return 'default';
      case 'Active':
        return 'default';
      case 'Inactive':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6" data-testid="page-advertisers-airtable">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">광고주 관리 (Airtable)</h1>
          <p className="text-muted-foreground mt-1">Airtable에서 광고주 데이터를 관리하세요</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : advertisers.length === 0 ? (
        <div className="text-center py-12 border rounded-md">
          <p className="text-muted-foreground">아직 광고주가 없습니다</p>
          <p className="text-sm text-muted-foreground mt-2">
            Airtable에서 광고주를 추가하세요
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회사명</TableHead>
                <TableHead>담당자</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>업종</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advertisers.map((advertiser) => (
                <TableRow key={advertiser.id}>
                  <TableCell className="font-medium">
                    {advertiser.companyName}
                  </TableCell>
                  <TableCell>{advertiser.contactPerson}</TableCell>
                  <TableCell>{advertiser.email}</TableCell>
                  <TableCell>{advertiser.phone}</TableCell>
                  <TableCell>{advertiser.industry || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(advertiser.status)}>
                      {advertiser.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/advertisers/${advertiser.id}`)}
                      data-testid={`button-view-${advertiser.id}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      상세보기
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
