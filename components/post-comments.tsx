"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, Trash2 } from "lucide-react"

interface Comment {
  id: string
  creator: string
  creatorName: string
  content: string
  likes: number
  likedBy: string[]
  replies: {
    id: string
    creator: string
    creatorName: string
    content: string
    likes: number
    likedBy: string[]
    createdAt: string
  }[]
  createdAt: string
}

interface PostCommentsProps {
  comments: Comment[]
  currentUserEmail: string | undefined
  currentUserName: string
  onAddComment: (commentText: string) => void
  onLikeComment: (commentId: string, isLiked: boolean) => void
  onDeleteComment: (commentId: string) => void
  onAddReply: (commentId: string, replyText: string) => void
  onLikeReply: (commentId: string, replyId: string, isLiked: boolean) => void
  onDeleteReply: (commentId: string, replyId: string) => void
}

export function PostComments({
  comments,
  currentUserEmail,
  currentUserName,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  onAddReply,
  onLikeReply,
  onDeleteReply,
}: PostCommentsProps) {
  const [newComment, setNewComment] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [newReplies, setNewReplies] = useState<{ [key: string]: string }>({})

  const handleAddComment = () => {
    if (!newComment.trim()) return
    onAddComment(newComment)
    setNewComment("")
  }

  const toggleReplies = (commentId: string) => {
    const newSet = new Set(expandedReplies)
    if (newSet.has(commentId)) {
      newSet.delete(commentId)
    } else {
      newSet.add(commentId)
    }
    setExpandedReplies(newSet)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{comment.creatorName}</p>
                <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</p>
              </div>
              {comment.creator === currentUserEmail && (
                <Button variant="ghost" size="sm" onClick={() => onDeleteComment(comment.id)} className="h-8 w-8 p-0">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>

            <p className="text-sm">{comment.content}</p>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLikeComment(comment.id, comment.likedBy.includes(currentUserEmail || ""))}
                className="gap-1 text-xs"
              >
                <Heart
                  className={`w-3 h-3 ${
                    comment.likedBy.includes(currentUserEmail || "") ? "fill-current text-red-500" : ""
                  }`}
                />
                {comment.likes}
              </Button>

              <Button variant="ghost" size="sm" onClick={() => toggleReplies(comment.id)} className="gap-1 text-xs">
                <Trash2 className="w-3 h-3" />
                {comment.replies.length}
              </Button>
            </div>

            {expandedReplies.has(comment.id) && (
              <div className="space-y-2 pt-2 border-t">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="bg-background p-2 rounded text-xs space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{reply.creatorName}</p>
                        <p className="text-muted-foreground">{new Date(reply.createdAt).toLocaleDateString()}</p>
                      </div>
                      {reply.creator === currentUserEmail && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteReply(comment.id, reply.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <p>{reply.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLikeReply(comment.id, reply.id, reply.likedBy.includes(currentUserEmail || ""))}
                      className="gap-1 text-xs h-6"
                    >
                      <Trash2
                        className={`w-2 h-2 ${
                          reply.likedBy.includes(currentUserEmail || "") ? "fill-current text-red-500" : ""
                        }`}
                      />
                      {reply.likes}
                    </Button>
                  </div>
                ))}

                <div className="flex gap-1 pt-2">
                  <Input
                    placeholder="Add a reply..."
                    value={newReplies[comment.id] || ""}
                    onChange={(e) => setNewReplies({ ...newReplies, [comment.id]: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Button
                    onClick={() => {
                      onAddReply(comment.id, newReplies[comment.id] || "")
                      setNewReplies({ ...newReplies, [comment.id]: "" })
                    }}
                    size="sm"
                    className="h-8 px-2"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
          className="text-sm h-10"
        />
        <Button onClick={handleAddComment} size="sm" className="h-10">
          Post
        </Button>
      </div>
    </div>
  )
}
