'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"

interface Content {
  id: string
  user_id: string
  type: string
  title: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user: {
    email: string
    username: string
  }
}

export default function ContentReviewPage() {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  // Fetch content list
  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select(`
          *,
          user:user_id (
            email,
            username
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContents(data || [])
    } catch (error) {
      console.error('Error fetching contents:', error)
      toast.error('Failed to load content list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContents()
  }, [])

  // Filter contents based on search term and status
  const filteredContents = contents.filter(content => {
    const matchesSearch = 
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.user.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Handle content approval
  const handleApprove = async (content: Content) => {
    try {
      const { error } = await supabase
        .from('contents')
        .update({ status: 'approved' })
        .eq('id', content.id)

      if (error) throw error
      
      toast.success('Content approved successfully')
      fetchContents()
    } catch (error) {
      console.error('Error approving content:', error)
      toast.error('Failed to approve content')
    }
  }

  // Handle content rejection
  const handleReject = async (content: Content) => {
    try {
      const { error } = await supabase
        .from('contents')
        .update({ status: 'rejected' })
        .eq('id', content.id)

      if (error) throw error
      
      setShowRejectDialog(false)
      toast.success('Content rejected successfully')
      fetchContents()
    } catch (error) {
      console.error('Error rejecting content:', error)
      toast.error('Failed to reject content')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Content Review</h1>
        <div className="flex gap-4">
          <Input
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredContents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No content found
                </TableCell>
              </TableRow>
            ) : (
              filteredContents.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-medium">{content.title}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {content.content}
                  </TableCell>
                  <TableCell>{content.user.username}</TableCell>
                  <TableCell>{content.type}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      content.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : content.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {content.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(content.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {content.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(content)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedContent(content)
                              setShowRejectDialog(true)
                            }}
                          >
                            Reject
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

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this content? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedContent && handleReject(selectedContent)}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 