import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, type AdStatus } from "./status-badge";

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

interface StatusDropdownProps {
  currentStatus: AdStatus;
  onStatusChange: (newStatus: AdStatus) => void;
  disabled?: boolean;
}

export function StatusDropdown({ currentStatus, onStatusChange, disabled }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleStatusSelect = (status: AdStatus) => {
    onStatusChange(status);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger 
        asChild 
        disabled={disabled}
        data-testid="trigger-status-dropdown"
      >
        <div className="cursor-pointer inline-block">
          <StatusBadge status={currentStatus} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" data-testid="content-status-dropdown">
        {ALL_STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusSelect(status)}
            data-testid={`item-status-${status}`}
            className="cursor-pointer"
          >
            <StatusBadge status={status} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
