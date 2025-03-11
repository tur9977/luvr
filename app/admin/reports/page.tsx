"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Report {
  id: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  admin_note: string | null
  created_at: string
  reporter: {
    email: string
    username: string
  }
  reported_content: {
    id: string
    title: string
    content: string
    type: string
  }
  reported_user: {
    id: string
    email: string
    username: string
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [adminNote, setAdminNote] = useState("")
  const supabase = createClient()

  // Fetch reports list
  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id (
            email,
            username
          ),
          reported_content:reported_content_id (
            id,
            title,
            content,
            type
          ),
          reported_user:reported_user_id (
            id,
            email,
            username
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('載入檢舉清單失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  // Filter reports based on search term and status
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_content.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_user.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Handle report resolution
  const handleResolveReport = async (report: Report, action: 'resolve' | 'dismiss') => {
    try {
      const { error: reportError } = await supabase
        .from('reports')
        .update({ 
          status: action === 'resolve' ? 'resolved' : 'dismissed',
          admin_note: adminNote,
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', report.id)

      if (reportError) throw reportError

      if (action === 'resolve') {
        // Delete the reported content
        const { error: contentError } = await supabase
          .from('contents')
          .delete()
          .eq('id', report.reported_content.id)

        if (contentError) throw contentError
      }
      
      setShowActionDialog(false)
      setAdminNote("")
      toast.success(action === 'resolve' ? '已移除違規內容' : '已駁回檢舉')
      fetchReports()
    } catch (error) {
      console.error('Error handling report:', error)
      toast.error('處理檢舉失敗')
    }
  }

  // Handle user ban
  const handleBanUser = async (report: Report) => {
    try {
      const { error: banError } = await supabase
        .from('profiles')
        .update({ is_banned: true })
        .eq('id', report.reported_user.id)

      if (banError) throw banError

      setShowBanDialog(false)
      toast.success('已封鎖用戶')
    } catch (error) {
      console.error('Error banning user:', error)
      toast.error('封鎖用戶失敗')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">檢舉管理</h1>
        <div className="flex gap-4">
          <Input
            placeholder="搜尋檢舉..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="pending">待處理</SelectItem>
              <SelectItem value="resolved">已處理</SelectItem>
              <SelectItem value="dismissed">已駁回</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>檢舉者</TableHead>
              <TableHead>被檢舉用戶</TableHead>
              <TableHead>內容</TableHead>
              <TableHead>原因</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>檢舉時間</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  載入中...
                </TableCell>
              </TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  沒有找到檢舉
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.reporter.username}</TableCell>
                  <TableCell>{report.reported_user.username}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {report.reported_content.content}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      report.status === 'resolved' 
                        ? 'bg-green-100 text-green-800'
                        : report.status === 'dismissed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status === 'resolved' ? '已處理' : 
                       report.status === 'dismissed' ? '已駁回' : '待處理'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(report.created_at).toLocaleDateString('zh-TW')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {report.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report)
                              setShowActionDialog(true)
                            }}
                          >
                            審核
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report)
                              setShowBanDialog(true)
                            }}
                          >
                            封鎖用戶
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>審核檢舉</DialogTitle>
            <DialogDescription>
              請審核被檢舉的內容並採取適當的行動。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <h3 className="font-medium">被檢舉內容：</h3>
              <p className="text-sm text-gray-500">
                {selectedReport?.reported_content.content}
              </p>
            </div>
            <div className="grid gap-2">
              <h3 className="font-medium">檢舉原因：</h3>
              <p className="text-sm text-gray-500">
                {selectedReport?.reason}
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="note" className="font-medium">管理員備註：</label>
              <Textarea
                id="note"
                placeholder="在此添加備註..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => selectedReport && handleResolveReport(selectedReport, 'dismiss')}
            >
              駁回檢舉
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedReport && handleResolveReport(selectedReport, 'resolve')}
            >
              移除內容
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>封鎖用戶</AlertDialogTitle>
            <AlertDialogDescription>
              確定要封鎖這個用戶嗎？封鎖後該用戶將無法使用平台功能。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReport && handleBanUser(selectedReport)}
              className="bg-red-600 hover:bg-red-700"
            >
              確認封鎖
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 