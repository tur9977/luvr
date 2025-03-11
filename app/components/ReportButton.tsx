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
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ReportButtonProps {
  contentId: string
  userId: string
  className?: string
}

export function ReportButton({ contentId, userId, className }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("請填寫檢舉原因")
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
          content_id: contentId,
          reported_user_id: userId,
          reporter_id: user.id,
          reason: reason.trim(),
          status: 'pending'
        })

      if (error) throw error

      toast.success("檢舉已提交")
      setIsOpen(false)
      setReason("")
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
            請描述檢舉原因，我們會盡快審核
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="請輸入檢舉原因..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
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