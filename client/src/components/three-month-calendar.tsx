import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ThreeMonthCalendar() {
  // Calculate current month and next two months
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();

  // Generate URLs for 3 consecutive months using dates parameter
  const generateCalendarUrl = (monthOffset: number) => {
    const targetDate = new Date(currentYear, currentMonth + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1; // Calendar API uses 1-12
    
    // Calculate first and last day of the target month
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0); // Day 0 = last day of previous month
    
    // Format dates as YYYYMMDD
    const startDate = `${year}${String(month).padStart(2, '0')}01`;
    const endDate = `${year}${String(month).padStart(2, '0')}${String(lastDay.getDate()).padStart(2, '0')}`;
    
    return `https://calendar.google.com/calendar/embed?src=mj%40venturesquare.net&ctz=Asia%2FSeoul&mode=MONTH&dates=${startDate}%2F${endDate}&showTitle=0&showNav=0&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&wkst=1`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>광고 캘린더 (3개월)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((offset) => (
            <div key={offset} className="w-full">
              <iframe
                src={generateCalendarUrl(offset)}
                style={{ border: 0 }}
                width="100%"
                height="400"
                frameBorder="0"
                scrolling="no"
                title={`Google Calendar Month ${offset + 1}`}
                data-testid={`calendar-iframe-${offset + 1}`}
              ></iframe>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
