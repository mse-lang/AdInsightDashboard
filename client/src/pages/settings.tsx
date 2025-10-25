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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, Trash2, Shield, Save, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Pricing, InsertPricing } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPricingSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin: string;
}

export default function Settings() {
  const { toast } = useToast();
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

  const [generalSettings, setGeneralSettings] = useState({
    companyName: "벤처스퀘어",
    ceoName: "",
    companyEmail: "ad@venturesquare.net",
    companyPhone: "02-1234-5678",
    businessNumber: "123-45-67890",
  });

  const { data: pricings = [], isLoading: pricingsLoading } = useQuery<Pricing[]>({
    queryKey: ["/api/pricings"],
  });

  const [editedPricings, setEditedPricings] = useState<Record<number, Partial<Pricing>>>({});
  const [focusedPriceInput, setFocusedPriceInput] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingPricing, setDeletingPricing] = useState<Pricing | null>(null);

  const form = useForm<InsertPricing>({
    resolver: zodResolver(insertPricingSchema),
    defaultValues: {
      productName: "",
      productKey: "",
      price: "",
      specs: "",
      description: "",
    },
  });

  const createPricingMutation = useMutation({
    mutationFn: async (data: InsertPricing) => {
      const res = await apiRequest("POST", "/api/pricings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricings"] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: "상품 추가 완료",
        description: "새로운 상품이 성공적으로 추가되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "추가 실패",
        description: error.message || "상품 추가에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/pricings/${id}`, undefined);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricings"] });
      setDeletingPricing(null);
      toast({
        title: "상품 삭제 완료",
        description: "상품이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "삭제 실패",
        description: error.message || "상품 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Pricing> }) => {
      const res = await apiRequest("PATCH", `/api/pricings/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricings"] });
      setEditedPricings({});
      toast({
        title: "단가 업데이트 완료",
        description: "단가표가 성공적으로 업데이트되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "저장 실패",
        description: error.message || "단가 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handlePricingEdit = (id: number, field: keyof Pricing, value: string) => {
    setEditedPricings(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      }
    }));
  };

  const handleSavePricing = (id: number) => {
    const edits = editedPricings[id];
    if (edits) {
      updatePricingMutation.mutate({ id, data: edits });
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''));
    if (isNaN(num)) return value;
    return `₩${num.toLocaleString()}`;
  };

  const onAddPricing = (data: InsertPricing) => {
    createPricingMutation.mutate(data);
  };

  const handleDeletePricing = () => {
    if (deletingPricing) {
      deletePricingMutation.mutate(deletingPricing.id);
    }
  };

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

  const handleSaveGeneralSettings = () => {
    toast({
      title: "설정 저장 완료",
      description: "일반 설정이 성공적으로 저장되었습니다.",
    });
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
          <TabsTrigger value="pricing" data-testid="tab-pricing">단가 관리</TabsTrigger>
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

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>광고 상품 단가표</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    광고 상품별 기준 단가를 관리하세요
                  </p>
                </div>
                <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-pricing">
                  <Plus className="h-4 w-4 mr-2" />
                  추가 상품
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pricingsLoading ? (
                <div className="text-center py-8 text-muted-foreground">로딩중...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>상품명</TableHead>
                      <TableHead>규격/특징</TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead>단가</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricings.map((pricing) => {
                      const isEdited = !!editedPricings[pricing.id];
                      const currentPrice = editedPricings[pricing.id]?.price || pricing.price;
                      const currentSpecs = editedPricings[pricing.id]?.specs || pricing.specs || "";
                      const currentDescription = editedPricings[pricing.id]?.description || pricing.description || "";

                      return (
                        <TableRow key={pricing.id} data-testid={`row-pricing-${pricing.id}`}>
                          <TableCell className="font-medium">{pricing.productName}</TableCell>
                          <TableCell>
                            <Input
                              value={currentSpecs}
                              onChange={(e) => handlePricingEdit(pricing.id, "specs", e.target.value)}
                              className="text-sm"
                              data-testid={`input-specs-${pricing.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={currentDescription}
                              onChange={(e) => handlePricingEdit(pricing.id, "description", e.target.value)}
                              className="text-sm"
                              data-testid={`input-description-${pricing.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={focusedPriceInput === pricing.id ? currentPrice : formatCurrency(currentPrice)}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                handlePricingEdit(pricing.id, "price", numericValue);
                              }}
                              onFocus={() => setFocusedPriceInput(pricing.id)}
                              onBlur={() => setFocusedPriceInput(null)}
                              className="font-mono"
                              data-testid={`input-price-${pricing.id}`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSavePricing(pricing.id)}
                                disabled={!isEdited || updatePricingMutation.isPending}
                                data-testid={`button-save-pricing-${pricing.id}`}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                저장
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingPricing(pricing)}
                                data-testid={`button-delete-pricing-${pricing.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent data-testid="dialog-add-pricing">
            <DialogHeader>
              <DialogTitle>새로운 상품 추가</DialogTitle>
              <DialogDescription>
                광고 상품의 정보를 입력하여 단가표에 추가하세요
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAddPricing)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상품명</FormLabel>
                      <FormControl>
                        <Input placeholder="예: 메인 배너" {...field} data-testid="input-product-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상품 키 (영문, 숫자, 언더스코어만)</FormLabel>
                      <FormControl>
                        <Input placeholder="예: main_banner" {...field} data-testid="input-product-key" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>단가 (숫자만 입력)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="예: 2400000" 
                          {...field}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^0-9]/g, '');
                            field.onChange(numericValue);
                          }}
                          data-testid="input-product-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>규격/특징 (선택)</FormLabel>
                      <FormControl>
                        <Input placeholder="예: PC: 1900×400px, Mobile: 600×300px" {...field} value={field.value || ""} data-testid="input-product-specs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>설명 (선택)</FormLabel>
                      <FormControl>
                        <Input placeholder="예: 매달 240만원" {...field} value={field.value || ""} data-testid="input-product-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddDialog(false);
                      form.reset();
                    }}
                    data-testid="button-cancel-add"
                  >
                    취소
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPricingMutation.isPending}
                    data-testid="button-submit-add"
                  >
                    추가
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingPricing} onOpenChange={() => setDeletingPricing(null)}>
          <AlertDialogContent data-testid="dialog-delete-pricing">
            <AlertDialogHeader>
              <AlertDialogTitle>상품 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                {deletingPricing && (
                  <>
                    '<strong>{deletingPricing.productName}</strong>' 상품을 삭제하시겠습니까?
                    <br />
                    이 작업은 되돌릴 수 없습니다.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">취소</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeletePricing}
                disabled={deletePricingMutation.isPending}
                data-testid="button-confirm-delete"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>회사명</Label>
                <Input 
                  value={generalSettings.companyName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                  data-testid="input-company-name" 
                />
              </div>
              <div className="space-y-2">
                <Label>대표이사 이름</Label>
                <Input 
                  value={generalSettings.ceoName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, ceoName: e.target.value })}
                  placeholder="대표이사 성함을 입력하세요" 
                  data-testid="input-ceo-name" 
                />
              </div>
              <div className="space-y-2">
                <Label>대표 이메일</Label>
                <Input 
                  value={generalSettings.companyEmail}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, companyEmail: e.target.value })}
                  data-testid="input-company-email" 
                />
              </div>
              <div className="space-y-2">
                <Label>대표 전화번호</Label>
                <Input 
                  value={generalSettings.companyPhone}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, companyPhone: e.target.value })}
                  data-testid="input-company-phone" 
                />
              </div>
              <div className="space-y-2">
                <Label>사업자등록번호</Label>
                <Input 
                  value={generalSettings.businessNumber}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, businessNumber: e.target.value })}
                  data-testid="input-business-number" 
                />
              </div>
              <Button 
                onClick={handleSaveGeneralSettings}
                data-testid="button-save-settings"
              >
                <Save className="h-4 w-4 mr-2" />
                설정 저장
              </Button>
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
