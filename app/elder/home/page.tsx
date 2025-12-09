"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Plus, Send, Trash2, Edit2, CheckCircle, MessageSquare, Heart, Home, User, Calendar, BookOpen, Menu, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"

interface Comment {
  id: string
  creator: string
  creatorName: string
  content: string
  likes: number
  likedBy: string[]
  replies: Comment[]
  createdAt: string
}

interface Post {
  id: string
  title: string
  description: string
  type: "need" | "donation"
  creator: string
  creatorName: string
  likes: number
  likedBy: string[]
  comments: Comment[]
  solved: boolean
  createdAt: string
}

interface Message {
  id: string
  read: boolean
}

// Color theme
const PRIMARY_COLOR = "#10b981" // Emerald green
const SECONDARY_COLOR = "#059669" // Darker emerald
const DARK_GREEN = "#047857"

export default function ElderHomePage() {
  const { user, userProfile, loading } = useAuth()
  const { toast } = useToast()
  const [newPost, setNewPost] = useState("")
  const [postTitle, setPostTitle] = useState("")
  const [postType, setPostType] = useState<"need" | "donation">("need")
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({})
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [greeting, setGreeting] = useState("Good Morning")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get Philippines timezone greeting
    const getGreeting = () => {
      const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
      const hour = new Date(now).getHours()
      
      if (hour < 12) return "Good Morning"
      if (hour < 18) return "Good Afternoon"
      return "Good Evening"
    }
    
    setGreeting(getGreeting())
  }, [])

  useEffect(() => {
    if (user) {
      fetchPosts()
    }
  }, [user])

  useEffect(() => {
    const checkUnreadMessages = async () => {
      if (!user) return

      try {
        const messagesQuery = query(collection(db, "messages"))
        const snapshot = await getDocs(messagesQuery)
        const hasUnread = snapshot.docs.some((doc) => {
          const message = doc.data() as Message
          return !message.read && message.recipientId === user.email
        })
        setHasUnreadMessages(hasUnread)
      } catch (error) {
        console.error("Error checking messages:", error)
      }
    }

    checkUnreadMessages()
  }, [user])

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true)
      const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(postsQuery)
      const postsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          comments: doc.data().comments || [],
        }))
        .filter((post) => !post.solved || post.creator === user?.email) as Post[]
      setPosts(postsData)
    } catch (error) {
      console.error("[v0] Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Could not load posts",
        variant: "destructive",
      })
    } finally {
      setLoadingPosts(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.trim() || !postTitle.trim() || !user) return

    try {
      await addDoc(collection(db, "posts"), {
        title: postTitle,
        description: newPost,
        type: postType,
        creator: user.email,
        creatorName: userProfile?.name || "Anonymous",
        likes: 0,
        likedBy: [],
        comments: [],
        solved: false,
        createdAt: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: "Post created successfully",
        className: "bg-emerald-50 border-emerald-200 text-emerald-800"
      })

      setNewPost("")
      setPostTitle("")
      setShowPostDialog(false)
      fetchPosts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not create post",
        variant: "destructive",
      })
    }
  }

  const handleEditPost = async (postId: string, newTitle: string, newDescription: string) => {
    try {
      await updateDoc(doc(db, "posts", postId), {
        title: newTitle,
        description: newDescription,
      })

      toast({
        title: "Success",
        description: "Post updated successfully",
        className: "bg-emerald-50 border-emerald-200 text-emerald-800"
      })

      setEditingPostId(null)
      fetchPosts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not update post",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsSolved = async (postId: string) => {
    try {
      await updateDoc(doc(db, "posts", postId), { solved: true })

      toast({
        title: "Success",
        description: "Post marked as solved",
        className: "bg-emerald-50 border-emerald-200 text-emerald-800"
      })

      fetchPosts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not mark as solved",
        variant: "destructive",
      })
    }
  }

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    if (!user) return
    try {
      const postRef = doc(db, "posts", postId)
      const post = posts.find((p) => p.id === postId)
      if (isLiked) {
        await updateDoc(postRef, { likedBy: arrayRemove(user.email), likes: (post?.likes || 1) - 1 })
      } else {
        await updateDoc(postRef, { likedBy: arrayUnion(user.email), likes: (post?.likes || 0) + 1 })
      }
      fetchPosts()
    } catch (error) {
      console.error("[v0] Error updating like:", error)
    }
  }

  const handleAddComment = async (postId: string, commentText: string) => {
    if (!commentText.trim() || !user) return

    try {
      const newComment: Comment = {
        id: Date.now().toString(),
        creator: user.email || "",
        creatorName: userProfile?.name || "Anonymous",
        content: commentText,
        likes: 0,
        likedBy: [],
        replies: [],
        createdAt: new Date().toISOString(),
      }

      await updateDoc(doc(db, "posts", postId), { comments: arrayUnion(newComment) })
      setNewComments({ ...newComments, [postId]: "" })
      fetchPosts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not add comment",
        variant: "destructive",
      })
    }
  }

  const handleLikeComment = async (postId: string, commentId: string, isLiked: boolean) => {
    if (!user) return
    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const updatedComments = post.comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likedBy: isLiked ? comment.likedBy.filter((e) => e !== user.email) : [...comment.likedBy, user.email],
            likes: isLiked ? comment.likes - 1 : comment.likes + 1,
          }
        }
        return comment
      })

      await updateDoc(doc(db, "posts", postId), { comments: updatedComments })
      fetchPosts()
    } catch (error) {
      console.error("[v0] Error liking comment:", error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return
    try {
      await deleteDoc(doc(db, "posts", postId))
      toast({ 
        title: "Success", 
        description: "Post deleted successfully",
        className: "bg-emerald-50 border-emerald-200 text-emerald-800"
      })
      fetchPosts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not delete post",
        variant: "destructive",
      })
    }
  }

  if (loading || loadingPosts) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { icon: Home, label: "Home", href: "/elder/home", active: true },
    { icon: BookOpen, label: "Tutorial", href: "/elder/tutorial", active: false },
    { icon: Calendar, label: "Event", href: "/elder/event", active: false },
    { icon: User, label: "Profile", href: "/elder/profile", active: false },
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50">
      {/* Mobile Header */}
      <div className="md:hidden text-white p-4 sticky top-0 z-20"
        style={{ 
          backgroundColor: PRIMARY_COLOR,
          background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-8 h-8 rounded-lg object-cover" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ElderEase</h2>
              <p className="text-xs text-emerald-100">
                {greeting}, {userProfile?.name?.split(" ")[0] || "User"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:bg-white/20 rounded-full"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar - Hidden on mobile unless menu is open */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:sticky md:top-0 inset-y-0 left-0 z-30
        w-64 md:w-72 text-white flex flex-col transition-transform duration-300 ease-in-out
        md:flex shadow-2xl h-screen
      `}
      style={{ 
        backgroundColor: DARK_GREEN,
        background: `linear-gradient(180deg, ${DARK_GREEN}, ${SECONDARY_COLOR})`
      }}
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-700 md:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-8 h-8 rounded-lg object-cover" />
            </div>
            <h2 className="text-lg font-bold">ElderEase</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Desktop Logo Section */}
        <div className="hidden md:block p-6 border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm ring-2 ring-white/20">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-10 h-10 rounded-lg object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-bold">ElderEase</h2>
              <p className="text-sm text-emerald-200 mt-1">
                {greeting}, {userProfile?.name?.split(" ")[0] || "User"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    item.active
                      ? "bg-white text-emerald-800 shadow-lg"
                      : "text-emerald-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.active && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-emerald-700">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl backdrop-blur-sm border border-emerald-600/30">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center ring-2 ring-white/30">
              <span className="font-medium text-sm text-white">
                {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userProfile?.name || "User"}
              </p>
              <p className="text-xs text-emerald-300 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
            {/* Header with Create Post Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">👋 Community Feed</h1>
                <p className="text-sm text-gray-600 mt-1">Share and connect with others in the community</p>
              </div>
              <Button
                onClick={() => setShowPostDialog(!showPostDialog)}
                className="w-full sm:w-auto gap-2 px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                size="lg"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Create Post</span>
              </Button>
            </div>

            {/* Create Post Dialog */}
            {showPostDialog && (
              <Card className="border-2 border-emerald-300 shadow-xl animate-in slide-in-from-top duration-300 bg-gradient-to-b from-white to-emerald-50">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant={postType === "need" ? "default" : "outline"}
                      onClick={() => setPostType("need")}
                      className={`flex-1 h-12 ${postType === "need" ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}`}
                    >
                      I Need Help
                    </Button>
                    <Button
                      variant={postType === "donation" ? "default" : "outline"}
                      onClick={() => setPostType("donation")}
                      className={`flex-1 h-12 ${postType === "donation" ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}`}
                    >
                      I Can Help
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      placeholder="What's this about?"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <Textarea
                    placeholder="Share more details..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-32 resize-none border-2 border-emerald-300 focus:border-emerald-500"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={handleCreatePost} 
                      className="flex-1 gap-2 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                    >
                      <Send className="w-4 h-4" />
                      Share Post
                    </Button>
                    <Button
                      onClick={() => setShowPostDialog(false)}
                      variant="outline"
                      className="flex-1 h-12 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <Card className="border-2 border-emerald-200 bg-gradient-to-b from-white to-emerald-50">
                  <CardContent className="py-16 text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-emerald-400 opacity-30" />
                    <p className="text-lg font-medium text-gray-600">No posts yet</p>
                    <p className="text-sm text-gray-500 mt-2">Be the first to share something!</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => {
                  const isLiked = post.likedBy.includes(user?.email || "")
                  const isCreator = post.creator === user?.email
                  const isExpanded = expandedComments.has(post.id)

                  return (
                    <Card key={post.id} className="border-2 border-emerald-200 hover:shadow-lg transition-all duration-300 hover:border-emerald-300 bg-gradient-to-b from-white to-emerald-50">
                      <CardContent className="p-4 sm:p-6 space-y-4">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-800 break-words">{post.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                by {post.creatorName} • {new Date(post.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  post.type === "need" 
                                    ? "bg-red-100 text-red-800 border border-red-200" 
                                    : "bg-green-100 text-green-800 border border-green-200"
                                }`}
                              >
                                {post.type === "need" ? "Need Help" : "Can Help"}
                              </span>
                              {post.solved && (
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  Solved
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                            {post.description}
                          </p>
                        </div>

                        {/* Post Actions */}
                        <div className="flex items-center gap-4 pt-3 border-t border-emerald-200 flex-wrap">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleLikePost(post.id, isLiked)}
                            className="gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
                          >
                            <span className={isLiked ? "text-red-600" : ""}>
                              {isLiked ? "❤️" : "🤍"}
                            </span>
                            <span>{post.likes}</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newSet = new Set(expandedComments)
                              if (newSet.has(post.id)) {
                                newSet.delete(post.id)
                              } else {
                                newSet.add(post.id)
                              }
                              setExpandedComments(newSet)
                            }}
                            className="gap-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.comments.length}</span>
                          </Button>

                          {isCreator && post.type === "need" && !post.solved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsSolved(post.id)}
                              className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span className="hidden sm:inline">Mark Solved</span>
                              <span className="sm:hidden">Solved</span>
                            </Button>
                          )}

                          {isCreator && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingPostId(editingPostId === post.id ? null : post.id)}
                                className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePost(post.id)}
                                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            </>
                          )}
                        </div>

                        {/* Edit Post */}
                        {editingPostId === post.id && isCreator && (
                          <div className="space-y-3 pt-4 border-t border-emerald-200">
                            <input
                              type="text"
                              defaultValue={post.title}
                              id={`edit-title-${post.id}`}
                              className="w-full px-4 py-2 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="Edit title..."
                            />
                            <Textarea
                              defaultValue={post.description}
                              id={`edit-desc-${post.id}`}
                              className="min-h-24 resize-none border-2 border-emerald-300 focus:border-emerald-500"
                              placeholder="Edit description..."
                            />
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                onClick={() => {
                                  const newTitle = (document.getElementById(`edit-title-${post.id}`) as HTMLInputElement).value
                                  const newDesc = (document.getElementById(`edit-desc-${post.id}`) as HTMLTextAreaElement).value
                                  handleEditPost(post.id, newTitle, newDesc)
                                }}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => setEditingPostId(null)}
                                variant="outline"
                                className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Comments Section */}
                        {isExpanded && (
                          <div className="space-y-4 pt-4 border-t border-emerald-200">
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {post.comments.map((comment) => (
                                <div key={comment.id} className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-medium text-sm text-gray-700">{comment.creatorName}</p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-sm mb-2 break-words text-gray-700">{comment.content}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleLikeComment(post.id, comment.id, comment.likedBy.includes(user?.email || ""))
                                    }
                                    className="gap-2 h-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Heart
                                      className={`w-4 h-4 ${
                                        comment.likedBy.includes(user?.email || "") ? "fill-current text-red-500" : ""
                                      }`}
                                    />
                                    {comment.likes}
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Add a comment..."
                                value={newComments[post.id] || ""}
                                onChange={(e) => setNewComments({ ...newComments, [post.id]: e.target.value })}
                                className="flex-1 border-2 border-emerald-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                              <Button 
                                onClick={() => handleAddComment(post.id, newComments[post.id] || "")}
                                className="px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                              >
                                Send
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Message Button */}
      <div
        onClick={() => router.push('/elder/messages')}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:opacity-90 transition-opacity z-40 hover:shadow-xl"
        style={{ boxShadow: `0 4px 20px ${PRIMARY_COLOR}40` }}
      >
        <MessageCircle className="w-6 h-6" />
        {hasUnreadMessages && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
            •
          </span>
        )}
      </div>
    </div>
  )
}