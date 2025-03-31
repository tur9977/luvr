"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Flag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from "sonner"

interface ReportButtonProps {
  contentId: string
  userId: string
  className?: string
}

const REPORT_TYPES = {
  'inappropriate': '不當內容',
  'spam': '垃圾訊息',
  'harassment': '騷擾行為',
  'violence': '暴力內容',
  'copyright': '侵權內容',
  'other': '其他'
} as const

export function ReportButton({ contentId, userId, className }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reportType, setReportType] = useState<keyof typeof REPORT_TYPES>('inappropriate')
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientComponentClient()

  const handleSubmit = async () => {
    if (!details.trim()) {
      toast.error("請填寫檢舉詳細原因")
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("請先登入")
        return
      }

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_content_id: contentId,
          reported_user_id: userId,
          report_type: reportType,
          details: details.trim(),
          status: 'pending'
        })

      if (error) throw error

      toast.success("檢舉已提交")
      setIsOpen(false)
      setDetails("")
      setReportType('inappropriate')
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error("檢舉提交失敗")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={className}
          title="檢舉"
        >
          <Flag className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>檢舉內容</DialogTitle>
          <DialogDescription>
            請選擇檢舉類型並描述詳細原因，我們會盡快審核
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">檢舉類型</Label>
            <Select
              value={reportType}
              onValueChange={(value: keyof typeof REPORT_TYPES) => setReportType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇檢舉類型" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REPORT_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-details">詳細說明</Label>
            <Textarea
              id="report-details"
              placeholder="請詳細描述檢舉原因..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={isSubmitting}
            >
              取消
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            提交
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 