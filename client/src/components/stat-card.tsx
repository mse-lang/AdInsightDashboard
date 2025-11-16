import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    trend: "up" | "down";
  };
  description?: string;
  tooltip?: string;
  details?: {
    thisYear?: number | string;
    lastYearMonthlyAvg?: number | string;
    thisYearMonthlyAvg?: number | string;
    lastMonth?: number | string;
  };
  onClick?: () => void;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  description, 
  tooltip,
  details, 
  onClick 
}: StatCardProps) {
  return (
    <Card 
      data-testid={`card-stat-${title}`}
      className={onClick ? "cursor-pointer hover-elevate" : ""}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" data-testid={`tooltip-${title}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-${title}-value`}>{value}</div>
        {change && (
          <p className={`text-xs ${change.trend === "up" ? "text-green-600" : "text-red-600"}`}>
            {change.trend === "up" ? "↑" : "↓"} {change.value}
          </p>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {details && (
          <div className="mt-3 space-y-1 text-xs text-muted-foreground border-t pt-2">
            {details.thisYear !== undefined && (
              <div className="flex items-center justify-between">
                <span>올해 전체</span>
                <span className="font-medium" data-testid={`text-${title}-thisYear`}>{details.thisYear}</span>
              </div>
            )}
            {details.lastYearMonthlyAvg !== undefined && (
              <div className="flex items-center justify-between">
                <span>전년 월 평균</span>
                <span className="font-medium" data-testid={`text-${title}-lastYearMonthlyAvg`}>{details.lastYearMonthlyAvg}</span>
              </div>
            )}
            {details.thisYearMonthlyAvg !== undefined && (
              <div className="flex items-center justify-between">
                <span>올해 월 평균</span>
                <span className="font-medium" data-testid={`text-${title}-thisYearMonthlyAvg`}>{details.thisYearMonthlyAvg}</span>
              </div>
            )}
            {details.lastMonth !== undefined && (
              <div className="flex items-center justify-between">
                <span>지난 한 달</span>
                <span className="font-medium" data-testid={`text-${title}-lastMonth`}>{details.lastMonth}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
