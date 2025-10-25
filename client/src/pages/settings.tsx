import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin: string;
}

export default function Settings() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      email: "ad@venturesquare.net",
      name: "관리자",
      role: "admin",
      isActive: true,
      lastLogin: "2024-01-25 14:30",
    },
    {
      id: "2",
      email: "manager@venturesquare.net",
      name: "광고팀장",
      role: "manager",
      isActive: true,
      lastLogin: "2024-01-25 10:15",
    },
    {
      id: "3",
      email: "staff@venturesquare.net",
      name: "담당자",
      role: "staff",
      isActive: false,
      lastLogin: "2024-01-20 16:45",
    },
  ]);

  const toggleUserStatus = (id: string) => {
    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, isActive: !user.isActive } : user
      )
    );
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700 border-red-200";
      case "manager":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "관리자";
      case "manager":
        return "매니저";
      default:
        return "스태프";
    }
  };

  return (
    <div className="space-y-6" data-testid="page-settings">
      <div>
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground mt-1">시스템 설정을 관리하세요</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">사용자 관리</TabsTrigger>
          <TabsTrigger value="general" data-testid="tab-general">일반 설정</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">알림 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>사용자 관리</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    시스템 접근 권한을 관리하세요
                  </p>
                </div>
                <Button data-testid="button-add-user">
                  <UserPlus className="h-4 w-4 mr-2" />
                  사용자 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이메일</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>마지막 로그인</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getRoleColor(user.role)} border`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                      <TableCell>
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => toggleUserStatus(user.id)}
                          data-testid={`switch-active-${user.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          disabled={user.role === "admin"}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>회사명</Label>
                <Input defaultValue="벤처스퀘어" data-testid="input-company-name" />
              </div>
              <div className="space-y-2">
                <Label>대표 이메일</Label>
                <Input defaultValue="ad@venturesquare.net" data-testid="input-company-email" />
              </div>
              <div className="space-y-2">
                <Label>대표 전화번호</Label>
                <Input defaultValue="02-1234-5678" data-testid="input-company-phone" />
              </div>
              <div className="space-y-2">
                <Label>사업자등록번호</Label>
                <Input defaultValue="123-45-67890" data-testid="input-business-number" />
              </div>
              <Button data-testid="button-save-settings">설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">신규 문의 알림</p>
                  <p className="text-sm text-muted-foreground">새로운 광고 문의가 접수되면 알림</p>
                </div>
                <Switch defaultChecked data-testid="switch-inquiry-notification" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">견적서 발송 알림</p>
                  <p className="text-sm text-muted-foreground">견적서가 발송되면 알림</p>
                </div>
                <Switch defaultChecked data-testid="switch-quote-notification" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">광고 집행 시작 알림</p>
                  <p className="text-sm text-muted-foreground">광고 집행이 시작되면 알림</p>
                </div>
                <Switch defaultChecked data-testid="switch-campaign-notification" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">결제 완료 알림</p>
                  <p className="text-sm text-muted-foreground">결제가 완료되면 알림</p>
                </div>
                <Switch defaultChecked data-testid="switch-payment-notification" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
