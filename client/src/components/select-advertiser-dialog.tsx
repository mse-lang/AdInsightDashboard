import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import type { Advertiser, Contact } from "@shared/schema";
import { Search, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdvertiserInfo {
  id: number;
  name: string;
  ceoName: string;
  businessNumber: string;
  contactName: string;
  contactEmail: string;
}

interface SelectAdvertiserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (advertiser: AdvertiserInfo) => void;
}

export function SelectAdvertiserDialog({ open, onOpenChange, onSelect }: SelectAdvertiserDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: advertisers = [], isLoading } = useQuery<Advertiser[]>({
    queryKey: ["/api/advertisers"],
    enabled: open,
  });

  const { data: allContacts = [] } = useQuery<Record<number, Contact[]>>({
    queryKey: ["/api/contacts/all"],
    queryFn: async () => {
      const contactsByAdvertiser: Record<number, Contact[]> = {};
      
      for (const advertiser of advertisers) {
        const res = await fetch(`/api/advertisers/${advertiser.id}/contacts`);
        const contacts = await res.json();
        contactsByAdvertiser[advertiser.id] = contacts;
      }
      
      return contactsByAdvertiser;
    },
    enabled: open && advertisers.length > 0,
  });

  const filteredAdvertisers = advertisers.filter(
    (adv) =>
      adv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (adv.businessNumber && adv.businessNumber.includes(searchTerm))
  );

  const handleSelect = (advertiserId: number) => {
    const advertiser = advertisers.find(a => a.id === advertiserId);
    if (!advertiser) return;

    const contacts = allContacts[advertiserId] || [];
    const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];

    onSelect({
      id: advertiser.id,
      name: advertiser.name,
      ceoName: advertiser.ceoName || "",
      businessNumber: advertiser.businessNumber || "",
      contactName: primaryContact?.name || "",
      contactEmail: primaryContact?.email || "",
    });

    onOpenChange(false);
    setSearchTerm("");
    setSelectedId(null);
  };

  const handleRowClick = (advertiserId: number) => {
    setSelectedId(advertiserId);
  };

  const handleConfirm = () => {
    if (selectedId) {
      handleSelect(selectedId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="dialog-select-advertiser">
        <DialogHeader>
          <DialogTitle>광고주 선택</DialogTitle>
          <DialogDescription>
            견적서에 포함할 광고주를 선택하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="광고주명 또는 사업자번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-advertiser"
            />
          </div>

          <div className="border rounded-md max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>광고주명</TableHead>
                    <TableHead>대표자명</TableHead>
                    <TableHead>사업자번호</TableHead>
                    <TableHead>담당자</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdvertisers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        검색 결과가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdvertisers.map((advertiser) => {
                      const contacts = allContacts[advertiser.id] || [];
                      const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];
                      const isSelected = selectedId === advertiser.id;

                      return (
                        <TableRow
                          key={advertiser.id}
                          className={`cursor-pointer hover-elevate ${isSelected ? "bg-primary/10" : ""}`}
                          onClick={() => handleRowClick(advertiser.id)}
                          onDoubleClick={() => handleSelect(advertiser.id)}
                          data-testid={`row-advertiser-${advertiser.id}`}
                        >
                          <TableCell>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </TableCell>
                          <TableCell className="font-medium">{advertiser.name}</TableCell>
                          <TableCell>{advertiser.ceoName || "-"}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {advertiser.businessNumber || "-"}
                          </TableCell>
                          <TableCell>{primaryContact?.name || "-"}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            광고주를 선택한 후 확인 버튼을 클릭하거나, 행을 더블클릭하세요
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSearchTerm("");
              setSelectedId(null);
            }}
            data-testid="button-cancel-select"
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedId}
            data-testid="button-confirm-select"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
