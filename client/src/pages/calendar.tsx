import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  ExternalLink,
  RefreshCw,
  Clock,
  MapPin,
  UserRound,
  Users,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/empty-state";

const KOREA_TZ = "Asia/Seoul";

type RangePreset = "default" | "thisMonth" | "next90";

interface RangeOption {
  value: RangePreset;
  label: string;
  helper: string;
}

const RANGE_OPTIONS: RangeOption[] = [
  {
    value: "default",
    label: "추천 범위 (지난 30일 ~ 향후 60일)",
    helper: "진행 중인 캠페인과 가까운 일정을 함께 확인합니다.",
  },
  {
    value: "thisMonth",
    label: "이번 달 일정",
    helper: "월간 집행 현황을 집중적으로 살펴봅니다.",
  },
  {
    value: "next90",
    label: "향후 90일 일정",
    helper: "다가오는 캠페인 계획을 미리 준비하세요.",
  },
];

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  status?: string;
  location?: string;
  organizer?: {
    displayName?: string;
    email?: string;
  };
  attendees?: Array<{
    displayName?: string;
    email?: string;
    responseStatus?: string;
  }>;
  hangoutLink?: string;
  created?: string;
  updated?: string;
}

interface CalendarEventsResponse {
  events: CalendarEvent[];
  meta?: {
    timeMin: string;
    timeMax: string;
    count: number;
  };
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getRangeForPreset(preset: RangePreset): { timeMin: string; timeMax: string } {
  const today = startOfDay(new Date());

  switch (preset) {
    case "thisMonth": {
      const start = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
      const end = startOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 1));
      return { timeMin: start.toISOString(), timeMax: end.toISOString() };
    }
    case "next90": {
      const start = today;
      const end = addDays(today, 90);
      return { timeMin: start.toISOString(), timeMax: end.toISOString() };
    }
    case "default":
    default: {
      const start = addDays(today, -30);
      const end = addDays(today, 60);
      return { timeMin: start.toISOString(), timeMax: end.toISOString() };
    }
  }
}

function dateStringToDate(value: string): Date {
  return new Date(`${value}T00:00:00+09:00`);
}

function getEventStartDate(event: CalendarEvent): Date | null {
  if (event.start?.date) {
    return dateStringToDate(event.start.date);
  }
  if (event.start?.dateTime) {
    return new Date(event.start.dateTime);
  }
  return null;
}

function getEventEndDate(event: CalendarEvent): Date | null {
  if (event.end?.date) {
    const exclusive = dateStringToDate(event.end.date);
    exclusive.setDate(exclusive.getDate() - 1);
    return exclusive;
  }
  if (event.end?.dateTime) {
    return new Date(event.end.dateTime);
  }
  return getEventStartDate(event);
}

function isAllDayEvent(event: CalendarEvent): boolean {
  return Boolean(event.start?.date && event.end?.date);
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: KOREA_TZ,
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: KOREA_TZ,
  }).format(date);
}

function formatEventDateRange(event: CalendarEvent): string {
  const startDate = getEventStartDate(event);
  const endDate = getEventEndDate(event);

  if (!startDate) {
    return "일정 미정";
  }

  if (!endDate) {
    return formatDay(startDate);
  }

  if (isAllDayEvent(event)) {
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${formatDay(startDate)} · 종일`;
    }
    return `${formatDay(startDate)} ~ ${formatDay(endDate)} · 종일`;
  }

  if (startDate.toDateString() === endDate.toDateString()) {
    return `${formatDay(startDate)} · ${formatTime(startDate)} ~ ${formatTime(endDate)}`;
  }

  return `${formatDay(startDate)} ${formatTime(startDate)} ~ ${formatDay(endDate)} ${formatTime(endDate)}`;
}

function formatDisplayRange(timeMin?: string, timeMax?: string): string {
  if (!timeMin || !timeMax) {
    return "-";
  }
  const start = new Date(timeMin);
  const endExclusive = new Date(timeMax);
  endExclusive.setMilliseconds(endExclusive.getMilliseconds() - 1);
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: KOREA_TZ,
  });
  return `${formatter.format(start)} ~ ${formatter.format(endExclusive)}`;
}

function formatTimestamp(iso?: string): string | null {
  if (!iso) {
    return null;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: KOREA_TZ,
  }).format(new Date(iso));
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function AdCalendar() {
  const calendarId = "mj@venturesquare.net";
  const calendarUrl = `https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(calendarId)}`;

  const [rangePreset, setRangePreset] = useState<RangePreset>("default");
  const range = useMemo(() => getRangeForPreset(rangePreset), [rangePreset]);
  const selectedOption = RANGE_OPTIONS.find((option) => option.value === rangePreset) ?? RANGE_OPTIONS[0];

  const querySuffix = useMemo(() => {
    const params = new URLSearchParams();
    params.set("maxResults", "200");
    params.set("timeMin", range.timeMin);
    params.set("timeMax", range.timeMax);
    return `?${params.toString()}`;
  }, [range]);

  const queryKey = `/api/calendar/events${querySuffix}`;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<CalendarEventsResponse>({
    queryKey: [queryKey],
  });

  const events = useMemo(() => {
    if (!data?.events) {
      return [] as CalendarEvent[];
    }
    return [...data.events].sort((a, b) => {
      const aStart = getEventStartDate(a)?.getTime() ?? Number.POSITIVE_INFINITY;
      const bStart = getEventStartDate(b)?.getTime() ?? Number.POSITIVE_INFINITY;
      return aStart - bStart;
    });
  }, [data]);

  const groupedEvents = useMemo(() => {
    if (!events.length) {
      return [] as Array<{ label: string; events: CalendarEvent[] }>;
    }

    const groups = new Map<string, { label: string; events: CalendarEvent[] }>();

    for (const event of events) {
      const start = getEventStartDate(event);
      const key = start ? start.toISOString().split("T")[0] : "unscheduled";
      const label = start ? formatDay(start) : "날짜 미정";

      if (!groups.has(key)) {
        groups.set(key, { label, events: [] });
      }
      groups.get(key)!.events.push(event);
    }

    return Array.from(groups.entries())
      .sort((a, b) => {
        if (a[0] === "unscheduled") return 1;
        if (b[0] === "unscheduled") return -1;
        return a[0].localeCompare(b[0]);
      })
      .map(([, group]) => ({
        label: group.label,
        events: group.events.sort((a, b) => {
          const aStart = getEventStartDate(a)?.getTime() ?? Number.POSITIVE_INFINITY;
          const bStart = getEventStartDate(b)?.getTime() ?? Number.POSITIVE_INFINITY;
          return aStart - bStart;
        }),
      }));
  }, [events]);

  const stats = useMemo(() => {
    const result = { upcoming: 0, active: 0, past: 0 };
    const today = startOfDay(new Date());

    events.forEach((event) => {
      const start = getEventStartDate(event);
      const end = getEventEndDate(event);
      if (!start || !end) {
        return;
      }
      if (end < today) {
        result.past += 1;
      } else if (start > today) {
        result.upcoming += 1;
      } else {
        result.active += 1;
      }
    });

    return result;
  }, [events]);

  const meta = data?.meta;
  const metaRangeLabel = formatDisplayRange(meta?.timeMin ?? range.timeMin, meta?.timeMax ?? range.timeMax);
  const totalCount = events.length;

  const handleOpenCalendar = () => openInNewTab(calendarUrl);
  const handleRangeChange = (value: string) => setRangePreset(value as RangePreset);

  const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">광고 캘린더</h1>
          <p className="mt-2 text-muted-foreground">
            Google Calendar와 실시간 동기화된 광고 일정을 VS-AMS에서 바로 확인하세요.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={rangePreset} onValueChange={handleRangeChange}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="조회 범위 선택" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            새로고침
          </Button>
          <Button onClick={handleOpenCalendar} variant="secondary">
            <ExternalLink className="h-4 w-4 mr-2" />
            Google Calendar 열기
          </Button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Google Calendar와 연동되었습니다</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span>
            VS-AMS에서 생성한 캠페인은 자동으로 Google Calendar에 동기화됩니다. 상세 편집이 필요하면
            Google Calendar에서 열어주세요.
          </span>
          <Button variant="outline" size="sm" onClick={handleOpenCalendar}>
            <ExternalLink className="h-4 w-4 mr-2" /> 전체 캘린더 열기
          </Button>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>일정 요약</CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedOption.helper}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">표시 범위</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{selectedOption.label}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{metaRangeLabel}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs uppercase text-muted-foreground">예정</p>
              <p className="mt-1 text-2xl font-semibold">{stats.upcoming}</p>
              <p className="text-xs text-muted-foreground">시작 예정인 캠페인</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs uppercase text-muted-foreground">진행중</p>
              <p className="mt-1 text-2xl font-semibold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">현재 집행 중인 캠페인</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs uppercase text-muted-foreground">완료</p>
              <p className="mt-1 text-2xl font-semibold">{stats.past}</p>
              <p className="text-xs text-muted-foreground">조회 범위 내 종료된 캠페인</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            총 <span className="font-semibold text-foreground">{totalCount}</span>건의 일정을 표시합니다.
          </div>
        </CardContent>
      </Card>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>일정을 불러오지 못했습니다</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{errorMessage}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-0 py-0 text-primary"
              onClick={() => refetch()}
            >
              다시 시도하기
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <EmptyState
          title="표시할 일정이 없습니다"
          description="선택한 기간에 등록된 광고 일정이 없습니다. 다른 기간을 선택하거나 Google Calendar에서 직접 확인해주세요."
          actionLabel="Google Calendar 열기"
          onAction={handleOpenCalendar}
        />
      ) : (
        <div className="space-y-6">
          {groupedEvents.map((group) => (
            <div key={group.label} className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">{group.label}</h2>
                <Badge variant="outline" className="ml-1">
                  {group.events.length}건
                </Badge>
              </div>
              <div className="space-y-4">
                {group.events.map((event) => {
                  const statusLabel = (() => {
                    switch (event.status) {
                      case "confirmed":
                        return { label: "확정", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
                      case "tentative":
                        return { label: "검토중", className: "bg-amber-100 text-amber-700 border-amber-200" };
                      case "cancelled":
                        return { label: "취소", className: "bg-rose-100 text-rose-700 border-rose-200" };
                      default:
                        return null;
                    }
                  })();

                  const attendeeSummary = event.attendees
                    ?.map((attendee) => attendee.displayName || attendee.email)
                    .filter(Boolean)
                    .slice(0, 3);

                  const updatedAt = formatTimestamp(event.updated);
                  const htmlLink = event.htmlLink ?? null;

                  return (
                    <div key={event.id} className="rounded-lg border p-4 transition hover:shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-foreground">{event.summary || "제목 없음"}</h3>
                            {statusLabel && (
                              <Badge variant="outline" className={statusLabel.className}>
                                {statusLabel.label}
                              </Badge>
                            )}
                            {isAllDayEvent(event) && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                종일
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <div className="flex items-start gap-2">
                              <Clock className="mt-0.5 h-4 w-4" />
                              <span>{formatEventDateRange(event)}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.organizer && (event.organizer.displayName || event.organizer.email) && (
                              <div className="flex items-start gap-2">
                                <UserRound className="mt-0.5 h-4 w-4" />
                                <span>
                                  {event.organizer.displayName || event.organizer.email}
                                  {event.organizer.email && event.organizer.displayName && ` · ${event.organizer.email}`}
                                </span>
                              </div>
                            )}
                            {attendeeSummary && attendeeSummary.length > 0 && (
                              <div className="flex items-start gap-2">
                                <Users className="mt-0.5 h-4 w-4" />
                                <span>
                                  {attendeeSummary.join(", ")}
                                  {event.attendees && event.attendees.length > attendeeSummary.length && " 외"}
                                </span>
                              </div>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {htmlLink && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openInNewTab(htmlLink)}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              이벤트 열기
                            </Button>
                          )}
                          {updatedAt && (
                            <span className="text-xs text-muted-foreground">마지막 업데이트: {updatedAt}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
