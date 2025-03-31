"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useProfile } from "@/hooks/useProfile"
import { toast } from "sonner"
import { Flag } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface ReportButtonProps {
  contentId: string
  userId: string
  className?: string
}

export function ReportButton({ contentId, userId, className }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { profile } = useProfile()
  const router = useRouter()

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the report")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("reports").insert({
        reported_content_id: contentId,
        reported_user_id: userId,
        reason: reason.trim(),
      })

      if (error) throw error

      toast.success("Report submitted successfully")
      setOpen(false)
      setReason("")
    } catch (error) {
      console.error("Error submitting report:", error)
      toast.error("Failed to submit report")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Flag className="h-4 w-4 mr-2" />
        Report
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting this content. Your report will be reviewed by our moderators.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="reason" className="font-medium">
                Reason for report
              </label>
              <Textarea
                id="reason"
                placeholder="Please explain why you are reporting this content..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 