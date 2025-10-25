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
import { Search, Eye } from "lucide-react";

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
}

export function AdvertiserTable({ advertisers, onViewDetails }: AdvertiserTableProps) {
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
            {filteredAdvertisers.map((advertiser) => (
              <TableRow key={advertiser.id} className="hover-elevate" data-testid={`row-advertiser-${advertiser.id}`}>
                <TableCell className="font-medium">{advertiser.name}</TableCell>
                <TableCell>{advertiser.contact}</TableCell>
                <TableCell>{advertiser.email}</TableCell>
                <TableCell>
                  <StatusBadge status={advertiser.status} />
                </TableCell>
                <TableCell className="text-right font-mono">{advertiser.amount}</TableCell>
                <TableCell className="text-muted-foreground">{advertiser.date}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails?.(advertiser.id)}
                    data-testid={`button-view-${advertiser.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
