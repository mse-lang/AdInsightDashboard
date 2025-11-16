import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

export default function AdCalendar() {
  const calendarId = "mj@venturesquare.net";
  const calendarSrc = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&mode=MONTH&showTitle=1&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&wkst=1&bgcolor=%23ffffff&ctz=Asia/Seoul`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">광고 캘린더</h1>
          <p className="text-muted-foreground mt-2">
            광고 집행 일정을 월별로 확인합니다
          </p>
        </div>
        <CalendarIcon className="h-8 w-8 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>월별 광고 일정</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full" style={{ height: "800px" }}>
            <iframe
              src={calendarSrc}
              style={{ border: 0 }}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              title="광고 캘린더"
              className="rounded-b-lg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>캘린더 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">캘린더 ID:</span>{" "}
              <code className="bg-muted px-2 py-1 rounded text-xs">{calendarId}</code>
            </p>
            <p className="text-muted-foreground">
              Google Calendar에서 광고 집행 일정을 관리하고 팀원들과 공유할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
