import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, AdStatus } from "./status-badge";
import { MemoDialog } from "./memo-dialog";
import { Search, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Advertiser {
  id: string;
  name: string;
  contact: string;
  email: string;
  status: AdStatus;
  amount: string;
  date: string;
}

interface AdvertiserTableProps {
  advertisers: Advertiser[];
  onViewDetails?: (id: string) => void;
  onStatusChange?: (id: string, status: AdStatus) => void;
  onEditAdvertiser?: (id: string) => void;
}

const allStatuses: AdStatus[] = [
  "문의중",
  "견적제시",
  "일정조율중",
  "부킹확정",
  "집행중",
  "결과보고",
  "세금계산서 발행 및 대금 청구",
  "매출 입금",
];

export function AdvertiserTable({ advertisers, onViewDetails, onStatusChange, onEditAdvertiser }: AdvertiserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAdvertisers = advertisers.filter(
    (adv) =>
      adv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adv.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card data-testid="card-advertiser-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>광고주 목록</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-advertiser"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>광고주명</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdvertisers.map((advertiser) => {
              const isInquiry = advertiser.status === "문의중";
              return (
                <TableRow 
                  key={advertiser.id} 
                  className={`hover-elevate ${isInquiry ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                  data-testid={`row-advertiser-${advertiser.id}`}
                >
                  <TableCell 
                    className="font-medium cursor-pointer hover:text-primary hover:underline"
                    onClick={() => onEditAdvertiser?.(advertiser.id)}
                    data-testid={`cell-name-${advertiser.id}`}
                  >
                    {advertiser.name}
                  </TableCell>
                  <TableCell 
                    className="cursor-pointer hover:text-primary hover:underline"
                    onClick={() => onEditAdvertiser?.(advertiser.id)}
                    data-testid={`cell-contact-${advertiser.id}`}
                  >
                    {advertiser.contact}
                  </TableCell>
                  <TableCell 
                    className="cursor-pointer hover:text-primary hover:underline"
                    onClick={() => onEditAdvertiser?.(advertiser.id)}
                    data-testid={`cell-email-${advertiser.id}`}
                  >
                    {advertiser.email}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={advertiser.status}
                      onValueChange={(value) => onStatusChange?.(advertiser.id, value as AdStatus)}
                    >
                      <SelectTrigger className="w-[200px]" data-testid={`select-status-${advertiser.id}`}>
                        <SelectValue>
                          <StatusBadge status={advertiser.status} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {allStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            <StatusBadge status={status} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-mono">{advertiser.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{advertiser.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <MemoDialog advertiserName={advertiser.name} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails?.(advertiser.id)}
                        data-testid={`button-view-${advertiser.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
