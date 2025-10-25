import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Upload, Trash2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Memo {
  id: string;
  content: string;
  date: string;
  files?: string[];
}

interface MemoDialogProps {
  advertiserName: string;
}

export function MemoDialog({ advertiserName }: MemoDialogProps) {
  const [memos, setMemos] = useState<Memo[]>([
    {
      id: "1",
      content: "견적서 발송 완료. 검토 후 회신 예정",
      date: "2024-01-20 14:30",
      files: ["quote_v1.pdf"],
    },
    {
      id: "2",
      content: "전화 통화 - 예산 조정 필요",
      date: "2024-01-18 10:15",
    },
  ]);
  const [newMemo, setNewMemo] = useState("");

  const addMemo = () => {
    if (!newMemo.trim()) return;

    const memo: Memo = {
      id: Date.now().toString(),
      content: newMemo,
      date: new Date().toLocaleString("ko-KR"),
    };

    setMemos([memo, ...memos]);
    setNewMemo("");
  };

  const deleteMemo = (id: string) => {
    setMemos(memos.filter((memo) => memo.id !== id));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid="button-memo">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{advertiserName} - 메모</DialogTitle>
          <DialogDescription>커뮤니케이션 내역과 메모를 관리하세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>새 메모 추가</Label>
            <Textarea
              placeholder="메모 내용을 입력하세요..."
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              rows={3}
              data-testid="textarea-new-memo"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-upload-file">
                <Upload className="h-4 w-4 mr-2" />
                파일 첨부
              </Button>
              <Button onClick={addMemo} size="sm" data-testid="button-add-memo">
                메모 추가
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-sm">메모 내역</h3>
            {memos.map((memo) => (
              <div
                key={memo.id}
                className="p-3 border rounded-md space-y-2"
                data-testid={`memo-${memo.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm">{memo.content}</p>
                    {memo.files && memo.files.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {memo.files.map((file, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {file}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMemo(memo.id)}
                    data-testid={`button-delete-memo-${memo.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{memo.date}</p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
