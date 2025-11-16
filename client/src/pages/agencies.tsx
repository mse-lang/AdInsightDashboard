import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AirtableAgency } from "@/types/airtable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Building2, Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const statusLabels = {
  Active: "활성",
  Inactive: "비활성",
};

const agencySchema = z.object({
  name: z.string().min(1, "에이전시명을 입력하세요"),
  businessRegistrationNumber: z.string().optional(),
  contactPerson: z.string().min(1, "담당자명을 입력하세요"),
  email: z.string().email("올바른 이메일을 입력하세요"),
  phone: z.string().min(1, "전화번호를 입력하세요"),
  notes: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

type AgencyFormData = z.infer<typeof agencySchema>;

export default function Agencies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<AirtableAgency | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agencyToDelete, setAgencyToDelete] = useState<AirtableAgency | null>(null);
  const { toast } = useToast();

  const { data: agencies = [], isLoading } = useQuery<AirtableAgency[]>({
    queryKey: ["/api/agencies"],
  });

  const form = useForm<AgencyFormData>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: "",
      businessRegistrationNumber: "",
      contactPerson: "",
      email: "",
      phone: "",
      notes: "",
      status: "Active",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AgencyFormData) =>
      apiRequest("POST", "/api/agencies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      toast({
        title: "에이전시 추가 완료",
        description: "새로운 에이전시가 등록되었습니다.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "에이전시 추가 실패",
        description: error.message || "에이전시 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgencyFormData }) =>
      apiRequest("PATCH", `/api/agencies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      toast({
        title: "에이전시 수정 완료",
        description: "에이전시 정보가 수정되었습니다.",
      });
      setDialogOpen(false);
      setEditingAgency(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "에이전시 수정 실패",
        description: error.message || "에이전시 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/agencies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      toast({
        title: "에이전시 삭제 완료",
        description: "에이전시가 삭제되었습니다.",
      });
      setDeleteDialogOpen(false);
      setAgencyToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "에이전시 삭제 실패",
        description: error.message || "에이전시 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleAddClick = () => {
    setEditingAgency(null);
    form.reset({
      name: "",
      businessRegistrationNumber: "",
      contactPerson: "",
      email: "",
      phone: "",
      notes: "",
      status: "Active",
    });
    setDialogOpen(true);
  };

  const handleEditClick = (agency: AirtableAgency) => {
    setEditingAgency(agency);
    form.reset({
      name: agency.name,
      businessRegistrationNumber: agency.businessRegistrationNumber || "",
      contactPerson: agency.contactPerson,
      email: agency.email,
      phone: agency.phone,
      notes: agency.notes || "",
      status: agency.status,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (agency: AirtableAgency) => {
    setAgencyToDelete(agency);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: AgencyFormData) => {
    if (editingAgency) {
      updateMutation.mutate({ id: editingAgency.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (agencyToDelete) {
      deleteMutation.mutate(agencyToDelete.id);
    }
  };

  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = 
      agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || agency.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">에이전시 관리</CardTitle>
              <p className="text-muted-foreground mt-1">
                광고 에이전시 목록을 관리합니다
              </p>
            </div>
            <Button onClick={handleAddClick} data-testid="button-add-agency">
              <Plus className="h-4 w-4 mr-2" />
              에이전시 추가
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="검색 (에이전시명, 담당자, 이메일)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="Active">활성</SelectItem>
                <SelectItem value="Inactive">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredAgencies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {agencies.length === 0 ? (
                <>
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">아직 에이전시가 없습니다</p>
                  <p className="text-sm mt-2">에이전시 추가 버튼을 클릭하여 새 에이전시를 등록하세요</p>
                </>
              ) : (
                <>
                  <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">검색 결과가 없습니다</p>
                  <p className="text-sm mt-2">다른 검색어나 필터를 시도해보세요</p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>에이전시명</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgencies.map((agency) => (
                    <TableRow key={agency.id} data-testid={`row-agency-${agency.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${agency.id}`}>
                        {agency.name}
                      </TableCell>
                      <TableCell data-testid={`text-contact-person-${agency.id}`}>{agency.contactPerson}</TableCell>
                      <TableCell className="text-sm" data-testid={`text-email-${agency.id}`}>{agency.email}</TableCell>
                      <TableCell data-testid={`text-phone-${agency.id}`}>{agency.phone}</TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[agency.status]}
                          data-testid={`badge-status-${agency.id}`}
                        >
                          {statusLabels[agency.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(agency)}
                            data-testid={`button-edit-${agency.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(agency)}
                            data-testid={`button-delete-${agency.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAgency ? "에이전시 수정" : "새 에이전시 추가"}
            </DialogTitle>
            <DialogDescription>
              {editingAgency
                ? "에이전시 정보를 수정합니다."
                : "새로운 에이전시를 등록합니다."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>에이전시명 *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사업자등록번호</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-business-registration-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>담당자 *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-contact-person" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>전화번호 *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일 *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>메모</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상태 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">활성</SelectItem>
                        <SelectItem value="Inactive">비활성</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {editingAgency ? "수정" : "추가"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>에이전시 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>{agencyToDelete?.name}</strong>을(를) 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
