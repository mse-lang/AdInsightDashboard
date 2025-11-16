import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface CalendarEvent {
  id: string;
  advertiser: string;
  slot: string;
  startDate: string;
  endDate: string;
  status: "부킹확정" | "집행중";
}

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"
];

const statusColors = {
  "부킹확정": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  "집행중": "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
};

export function NavigableCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11

  const { data: calendarEvents = [], isLoading, isError } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/ad-materials"],
  });

  const generateCalendarUrl = (year: number, month: number) => {
    const targetMonth = month + 1; // Calendar API uses 1-12
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    const startDate = `${year}${String(targetMonth).padStart(2, '0')}01`;
    const endDate = `${year}${String(targetMonth).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;
    
    return `https://calendar.google.com/calendar/embed?src=mj%40venturesquare.net&ctz=Asia%2FSeoul&mode=MONTH&dates=${startDate}%2F${endDate}&showTitle=0&showNav=0&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&wkst=1`;
  };

  const filterEventsByMonth = (year: number, month: number): CalendarEvent[] => {
    return calendarEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      return (
        (eventStart >= monthStart && eventStart <= monthEnd) ||
        (eventEnd >= monthStart && eventEnd <= monthEnd) ||
        (eventStart < monthStart && eventEnd > monthEnd)
      );
    });
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getPreviousMonth = () => {
    if (currentMonth === 0) {
      return { year: currentYear - 1, month: 11 };
    }
    return { year: currentYear, month: currentMonth - 1 };
  };

  const getNextMonth = () => {
    if (currentMonth === 11) {
      return { year: currentYear + 1, month: 0 };
    }
    return { year: currentYear, month: currentMonth + 1 };
  };

  const previousMonth = getPreviousMonth();
  const nextMonth = getNextMonth();
  const previousMonthEvents = filterEventsByMonth(previousMonth.year, previousMonth.month);
  const currentMonthEvents = filterEventsByMonth(currentYear, currentMonth);
  const nextMonthEvents = filterEventsByMonth(nextMonth.year, nextMonth.month);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const EventListView = ({ 
    title, 
    events, 
    emptyMessage 
  }: { 
    title: string; 
    events: CalendarEvent[]; 
    emptyMessage: string;
  }) => (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
        <CalendarIcon className="h-4 w-4" />
        {title}
      </h3>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {events.map(event => (
            <div 
              key={event.id} 
              className="p-3 rounded-md border bg-card hover-elevate"
              data-testid={`event-item-${event.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" data-testid={`event-advertiser-${event.id}`}>
                    {event.advertiser}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" data-testid={`event-slot-${event.id}`}>
                    {event.slot}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" data-testid={`event-dates-${event.id}`}>
                    {formatDate(event.startDate)} - {formatDate(event.endDate)}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${statusColors[event.status]} text-xs whitespace-nowrap`}
                  data-testid={`event-status-${event.id}`}
                >
                  {event.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>광고 캘린더</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              data-testid="button-previous-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[120px] text-center font-semibold" data-testid="text-current-month">
              {currentYear}년 {MONTH_NAMES[currentMonth]}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="calendar-error">
            <p>캘린더 데이터를 불러오는 중 오류가 발생했습니다.</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="calendar-loading">
            <p>캘린더 데이터를 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Previous Month List */}
            <div className="lg:col-span-3">
              <EventListView
                title={`${previousMonth.year}년 ${MONTH_NAMES[previousMonth.month]}`}
                events={previousMonthEvents}
                emptyMessage="예약 없음"
              />
            </div>

            {/* Current Month Calendar */}
            <div className="lg:col-span-6">
              <iframe
                src={generateCalendarUrl(currentYear, currentMonth)}
                style={{ border: 0 }}
                width="100%"
                height="500"
                frameBorder="0"
                scrolling="no"
                title={`Google Calendar ${currentYear}년 ${MONTH_NAMES[currentMonth]}`}
                data-testid="calendar-iframe-current"
              />
            </div>

            {/* Next Month List */}
            <div className="lg:col-span-3">
              <EventListView
                title={`${nextMonth.year}년 ${MONTH_NAMES[nextMonth.month]}`}
                events={nextMonthEvents}
                emptyMessage="예약 없음"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
