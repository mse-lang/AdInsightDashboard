import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdSlotDialog } from "./ad-slot-dialog";

interface CalendarEvent {
  id: string;
  advertiser: string;
  slot: string;
  startDate: string;
  endDate: string;
  status: "부킹확정" | "집행중";
}

interface CalendarViewProps {
  events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const getMonthData = (monthOffset: number) => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() + monthOffset);
    return {
      month: date.getMonth(),
      year: date.getFullYear(),
      date: date,
    };
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => {
      return dateStr >= event.startDate && dateStr <= event.endDate;
    });
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const renderMonthCalendar = (monthOffset: number) => {
    const { month, year } = getMonthData(monthOffset);
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const monthName = new Date(year, month).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
    });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square p-1" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isToday =
        date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`aspect-square p-1 border rounded-md cursor-pointer ${
            isToday ? "bg-blue-50 dark:bg-blue-950 border-blue-300" : "hover-elevate"
          }`}
          data-testid={`calendar-day-${year}-${month}-${day}`}
          onClick={() => handleDateClick(date)}
        >
          <div className="text-xs font-medium mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={`text-[10px] px-1 py-0.5 rounded truncate ${
                  event.status === "집행중"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-green-100 text-green-700"
                }`}
                title={`${event.advertiser} - ${event.slot}`}
              >
                {event.slot}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-[10px] text-muted-foreground">
                +{dayEvents.length - 2}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm mb-3 text-center">{monthName}</h3>
        <div className="grid grid-cols-7 gap-1 mb-2 text-xs text-muted-foreground">
          <div className="text-center">일</div>
          <div className="text-center">월</div>
          <div className="text-center">화</div>
          <div className="text-center">수</div>
          <div className="text-center">목</div>
          <div className="text-center">금</div>
          <div className="text-center">토</div>
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  return (
    <>
      <Card data-testid="card-calendar-view">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>광고 캘린더</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              부킹확정
            </Badge>
            <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200">
              집행중
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto">
            {renderMonthCalendar(-1)}
            {renderMonthCalendar(0)}
            {renderMonthCalendar(1)}
          </div>
        </CardContent>
      </Card>
      <AdSlotDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        date={selectedDate}
        events={events}
      />
    </>
  );
}
