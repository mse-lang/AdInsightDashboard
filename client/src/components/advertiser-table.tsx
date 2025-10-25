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

  return null;
}
