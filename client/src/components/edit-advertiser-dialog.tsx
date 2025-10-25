import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Advertiser, Contact } from "@shared/schema";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface EditAdvertiserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertiserId: number | null;
}

export function EditAdvertiserDialog({ open, onOpenChange, advertiserId }: EditAdvertiserDialogProps) {
  const { toast } = useToast();
  const [advertiserData, setAdvertiserData] = useState({
    name: "",
    businessNumber: "",
    ceoName: "",
  });
  const [contacts, setContacts] = useState<Array<{
    id?: number;
    name: string;
    email: string;
    phone: string;
    position: string;
    isPrimary: boolean;
  }>>([]);

  const { data: advertiser, isLoading: isLoadingAdvertiser } = useQuery<Advertiser>({
    queryKey: ["/api/advertisers", advertiserId],
    queryFn: async () => {
      const res = await fetch(`/api/advertisers/${advertiserId}`);
      if (!res.ok) throw new Error("Failed to fetch advertiser");
      return res.json();
    },
    enabled: open && !!advertiserId,
  });

  const { data: fetchedContacts = [], isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ["/api/advertisers", advertiserId, "contacts"],
    queryFn: async () => {
      const res = await fetch(`/api/advertisers/${advertiserId}/contacts`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
    enabled: open && !!advertiserId,
  });

  useEffect(() => {
    if (advertiser) {
      setAdvertiserData({
        name: advertiser.name,
        businessNumber: advertiser.businessNumber || "",
        ceoName: advertiser.ceoName || "",
      });
    }
  }, [advertiser]);

  useEffect(() => {
    if (fetchedContacts.length > 0) {
      setContacts(fetchedContacts.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || "",
        position: c.position || "",
        isPrimary: c.isPrimary,
      })));
    }
  }, [fetchedContacts]);

  const updateAdvertiserMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/advertisers/${advertiserId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/all"] });
      toast({
        title: "광고주 정보 수정 완료",
        description: "광고주 정보가 성공적으로 수정되었습니다.",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, data }: { contactId: number; data: any }) => {
      return await apiRequest("PATCH", `/api/contacts/${contactId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers", advertiserId, "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/all"] });
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/contacts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers", advertiserId, "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/all"] });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return await apiRequest("DELETE", `/api/contacts/${contactId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers", advertiserId, "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/all"] });
    },
  });

  const handleAddContact = () => {
    setContacts([...contacts, {
      name: "",
      email: "",
      phone: "",
      position: "",
      isPrimary: contacts.length === 0,
    }]);
  };

  const handleRemoveContact = async (index: number) => {
    const contact = contacts[index];
    if (contact.id) {
      await deleteContactMutation.mutateAsync(contact.id);
    }
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleUpdateContact = (index: number, field: string, value: any) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === "isPrimary" && value === true) {
      updated.forEach((c, i) => {
        if (i !== index) c.isPrimary = false;
      });
    }
    
    setContacts(updated);
  };

  const handleSave = async () => {
    try {
      await updateAdvertiserMutation.mutateAsync(advertiserData);
      
      for (const contact of contacts) {
        if (contact.id) {
          await updateContactMutation.mutateAsync({
            contactId: contact.id,
            data: {
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              position: contact.position,
              isPrimary: contact.isPrimary,
            },
          });
        } else if (contact.name && contact.email) {
          await createContactMutation.mutateAsync({
            advertiserId,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            position: contact.position,
            isPrimary: contact.isPrimary,
          });
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "광고주 정보 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const isLoading = isLoadingAdvertiser || isLoadingContacts;
  const isSaving = updateAdvertiserMutation.isPending || 
                   updateContactMutation.isPending || 
                   createContactMutation.isPending ||
                   deleteContactMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-edit-advertiser">
        <DialogHeader>
          <DialogTitle>광고주 정보 수정</DialogTitle>
          <DialogDescription>
            광고주 정보와 담당자 연락처를 수정할 수 있습니다
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">기본 정보</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">광고주명 *</Label>
                  <Input
                    id="name"
                    value={advertiserData.name}
                    onChange={(e) => setAdvertiserData({ ...advertiserData, name: e.target.value })}
                    data-testid="input-advertiser-name"
                  />
                </div>
                <div>
                  <Label htmlFor="businessNumber">사업자번호</Label>
                  <Input
                    id="businessNumber"
                    value={advertiserData.businessNumber}
                    onChange={(e) => setAdvertiserData({ ...advertiserData, businessNumber: e.target.value })}
                    placeholder="123-45-67890"
                    data-testid="input-business-number"
                  />
                </div>
                <div>
                  <Label htmlFor="ceoName">대표자명</Label>
                  <Input
                    id="ceoName"
                    value={advertiserData.ceoName}
                    onChange={(e) => setAdvertiserData({ ...advertiserData, ceoName: e.target.value })}
                    data-testid="input-ceo-name"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">담당자 정보</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddContact}
                  data-testid="button-add-contact"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  담당자 추가
                </Button>
              </div>
              
              {contacts.map((contact, index) => (
                <div key={index} className="p-4 border rounded-md space-y-3" data-testid={`contact-${index}`}>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">담당자 {index + 1}</Label>
                    {contacts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveContact(index)}
                        data-testid={`button-remove-contact-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`contact-name-${index}`}>이름 *</Label>
                      <Input
                        id={`contact-name-${index}`}
                        value={contact.name}
                        onChange={(e) => handleUpdateContact(index, "name", e.target.value)}
                        data-testid={`input-contact-name-${index}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-position-${index}`}>직책</Label>
                      <Input
                        id={`contact-position-${index}`}
                        value={contact.position}
                        onChange={(e) => handleUpdateContact(index, "position", e.target.value)}
                        data-testid={`input-contact-position-${index}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-email-${index}`}>이메일 *</Label>
                      <Input
                        id={`contact-email-${index}`}
                        type="email"
                        value={contact.email}
                        onChange={(e) => handleUpdateContact(index, "email", e.target.value)}
                        data-testid={`input-contact-email-${index}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-phone-${index}`}>전화번호</Label>
                      <Input
                        id={`contact-phone-${index}`}
                        value={contact.phone}
                        onChange={(e) => handleUpdateContact(index, "phone", e.target.value)}
                        placeholder="010-1234-5678"
                        data-testid={`input-contact-phone-${index}`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`contact-primary-${index}`}
                      checked={contact.isPrimary}
                      onChange={(e) => handleUpdateContact(index, "isPrimary", e.target.checked)}
                      className="h-4 w-4"
                      data-testid={`checkbox-primary-${index}`}
                    />
                    <Label htmlFor={`contact-primary-${index}`} className="text-sm cursor-pointer">
                      주 담당자로 설정
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            data-testid="button-cancel"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            data-testid="button-save"
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
