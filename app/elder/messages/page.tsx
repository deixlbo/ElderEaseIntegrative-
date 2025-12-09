"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot,
  or,
  and,
  Timestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Search, Send, Plus, Users, X, ChevronLeft, Edit, UserPlus, LogOut, Heart } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Message {
  id: string
  senderId: string
  senderName: string
  receiverId?: string
  groupChatId?: string
  content: string
  createdAt: any
  reactions?: Record<string, string[]>
  replyTo?: { messageId: string; content: string; senderName?: string }
}

interface Contact {
  id: string
  name: string
  clinicName?: string
  email: string
  role: string
}

interface GroupChat {
  id: string
  name: string
  members: string[]
  createdBy: string
  createdAt: any
}

// helper to create a stable conversation id for two-party chats
const getConversationId = (a?: string, b?: string) => {
  if (!a || !b) return ""
  return [a, b].sort().join("__")
}

export default function ElderMessagesPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [groupChats, setGroupChats] = useState<GroupChat[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedGroupChat, setSelectedGroupChat] = useState<GroupChat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // edit group dialog
  const [showEditGroupDialog, setShowEditGroupDialog] = useState(false)
  const [editGroupName, setEditGroupName] = useState("")
  const [editSelectedMembers, setEditSelectedMembers] = useState<string[]>([])

  // reply state
  const [replyTo, setReplyTo] = useState<{ messageId: string; content: string; senderName?: string } | null>(null)

  useEffect(() => {
    if (user) {
      fetchContacts()
      fetchGroupChats()
    }
  }, [user])

  useEffect(() => {
    if (selectedContact && user?.email) {
      // Use a stable conversationId so only messages for this exact pair are returned
      const convId = getConversationId(user.email, selectedContact.email)
      const messagesQuery = query(
        collection(db, "messages"),
        where("conversationId", "==", convId),
        orderBy("createdAt", "asc")
      )
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Message)
        // already ordered by createdAt but sort to be safe
        messagesData.sort((a, b) => {
          const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0
          const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0
          return ta - tb
        })
        setMessages(messagesData)
      })
      return () => unsubscribe()
    }
  }, [selectedContact, user])

  useEffect(() => {
    if (selectedGroupChat && user) {
      const messagesQuery = query(
        collection(db, "messages"),
        where("groupChatId", "==", selectedGroupChat.id),
        orderBy("createdAt", "asc"),
      )
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Message)
        setMessages(messagesData)
      })
      return () => unsubscribe()
    }
  }, [selectedGroupChat, user])

  const fetchContacts = async () => {
    try {
      const usersQuery = query(collection(db, "users"), where("role", "in", ["clinic", "elder"]))
      const snapshot = await getDocs(usersQuery)
      const contactsData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Contact)
        .filter((contact) => contact.email !== user?.email)
      setContacts(contactsData)
    } catch (error) {
      console.error("Error fetching contacts:", error)
    }
  }

  const fetchGroupChats = async () => {
    try {
      const groupChatsQuery = query(collection(db, "groupChats"), where("members", "array-contains", user?.email))
      const snapshot = await getDocs(groupChatsQuery)
      const groupChatsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as GroupChat)
      setGroupChats(groupChatsData)
    } catch (error) {
      console.error("Error fetching group chats:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || (!selectedContact && !selectedGroupChat)) return
    try {
      const createdAt = Timestamp.now()
      const messageData: any = {
        senderId: user?.email,
        senderName: userProfile?.name || "Elder",
        content: newMessage.trim(),
        createdAt,
      }
      if (selectedContact) {
        messageData.receiverId = selectedContact.email
        // add stable conversation id so only these two see the chat
        messageData.conversationId = getConversationId(user?.email, selectedContact.email)
      } else if (selectedGroupChat) {
        messageData.groupChatId = selectedGroupChat.id
      }
      if (replyTo) {
        messageData.replyTo = replyTo
      }

      // persist to Firestore
      const docRef = await addDoc(collection(db, "messages"), messageData)

      // optimistic UI: append message immediately with returned id
      setMessages((prev) => [
        ...prev,
        {
          id: docRef.id,
          ...messageData,
        } as Message,
      ])

      setNewMessage("")
      setReplyTo(null)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please enter a group name and select at least one member",
        variant: "destructive",
      })
      return
    }
    try {
      // only allow adding elders to groups (per requirement)
      const allowedMembers = selectedMembers.filter((email) => {
        const c = contacts.find((x) => x.email === email)
        return c?.role === "elder"
      })
      const members = [user?.email, ...allowedMembers]
      await addDoc(collection(db, "groupChats"), {
        name: groupName,
        members,
        createdBy: user?.email,
        createdAt: Timestamp.now(),
      })
      toast({ title: "Success", description: "Group chat created successfully" })
      setGroupName("")
      setSelectedMembers([])
      setShowCreateGroupDialog(false)
      fetchGroupChats()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const openEditGroupDialog = () => {
    if (!selectedGroupChat) return
    setEditGroupName(selectedGroupChat.name)
    setEditSelectedMembers(selectedGroupChat.members.filter((m) => m !== user?.email))
    setShowEditGroupDialog(true)
  }

  const handleEditGroup = async () => {
    if (!selectedGroupChat) return
    if (!editGroupName.trim()) {
      toast({ title: "Error", description: "Group name cannot be empty", variant: "destructive" })
      return
    }
    try {
      // only allow adding elders (per requirement)
      const allowedMembers = editSelectedMembers.filter((email) => {
        const c = contacts.find((x) => x.email === email)
        return c?.role === "elder"
      })
      const members = Array.from(new Set([selectedGroupChat.createdBy, ...allowedMembers, user?.email]))
      await updateDoc(doc(db, "groupChats", selectedGroupChat.id), { name: editGroupName, members })
      toast({ title: "Success", description: "Group updated" })
      setShowEditGroupDialog(false)
      fetchGroupChats()
      // refresh selectedGroupChat locally
      setSelectedGroupChat({ ...selectedGroupChat, name: editGroupName, members })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleLeaveGroup = async () => {
    if (!selectedGroupChat || !user?.email) return
    try {
      await updateDoc(doc(db, "groupChats", selectedGroupChat.id), {
        members: arrayRemove(user.email),
      })
      // check if group has any members left; if none, delete
      const groupRef = doc(db, "groupChats", selectedGroupChat.id)
      const snapshot = await getDoc(groupRef)
      const data = snapshot.data() as GroupChat | undefined
      const remaining = data?.members || []
      if (!remaining || remaining.length === 0) {
        await deleteDoc(groupRef)
      }
      toast({ title: "Left Group", description: "You have left the group chat" })
      setSelectedGroupChat(null)
      fetchGroupChats()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!user?.email) return
    const docRef = doc(db, "messages", messageId)
    const message = messages.find((m) => m.id === messageId)
    const userEmail = user.email
    const already = message?.reactions?.[emoji]?.includes(userEmail)
    try {
      if (already) {
        await updateDoc(docRef, { [`reactions.${emoji}`]: arrayRemove(userEmail) })
      } else {
        await updateDoc(docRef, { [`reactions.${emoji}`]: arrayUnion(userEmail) })
      }
    } catch (error: any) {
      console.error("Reaction error", error)
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    const displayName = contact.clinicName || contact.name || contact.email
    return displayName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-background overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h1 className="text-xl font-semibold">Messages</h1>
        <div className="flex items-center gap-2">
          {selectedContact || selectedGroupChat ? (
            <Button
              onClick={() => {
                // close the open conversation (keep user on messages screen)
                setSelectedContact(null)
                setSelectedGroupChat(null)
                setMessages([])
              }}
              className="gap-2 h-10 text-base"
              aria-label="Close conversation"
            >
              <X className="w-5 h-5" />
            </Button>
          ) : (
            <Button onClick={() => router.push("/elder/home")} className="gap-2 h-10 text-base" aria-label="Back to home">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Card className="w-80 flex flex-col rounded-none border-r">
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            <Button onClick={() => setShowCreateGroupDialog(true)} className="w-full mb-4 gap-2 text-base h-12">
              <Plus className="w-5 h-5" />
              New Group Chat
            </Button>

            {groupChats.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Group Chats</p>
                <div className="space-y-2 mb-4 pb-4 border-b">
                  {groupChats.map((groupChat) => (
                    <div
                      key={groupChat.id}
                      onClick={() => {
                        setSelectedGroupChat(groupChat)
                        setSelectedContact(null)
                      }}
                      className={`p-4 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                        selectedGroupChat?.id === groupChat.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-base">{groupChat.name}</p>
                          <p className="text-xs text-muted-foreground">{groupChat.members.length} members</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm font-semibold text-muted-foreground mb-2">Direct Messages</p>
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => {
                    setSelectedContact(contact)
                    setSelectedGroupChat(null)
                  }}
                  className={`p-4 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                    selectedContact?.email === contact.email ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {(contact.clinicName || contact.name || contact.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-base">
                        {contact.clinicName || contact.name || contact.email}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">{contact.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col rounded-none">
          <CardContent className="p-0 flex-1 flex flex-col">
            {selectedContact || selectedGroupChat ? (
              <>
                <div className="p-4 border-b flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    {selectedGroupChat ? (
                      <>
                        <Users className="w-12 h-12 text-primary" />
                        <div>
                          <p className="font-medium text-lg">{selectedGroupChat.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedGroupChat.members.length} members</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                            {(selectedContact!.clinicName || selectedContact!.name || selectedContact!.email)
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-lg">
                            {selectedContact!.clinicName || selectedContact!.name || selectedContact!.email}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">{selectedContact!.role}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedGroupChat && (
                    <div className="flex items-center gap-2">
                      <Button onClick={openEditGroupDialog} size="sm" className="gap-2">
                        <Edit className="w-4 h-4" /> Edit
                      </Button>
                      <Button onClick={() => setShowCreateGroupDialog(true)} size="sm" className="gap-2">
                        <UserPlus className="w-4 h-4" /> Add
                      </Button>
                      <Button onClick={handleLeaveGroup} variant="destructive" size="sm" className="gap-2">
                        <LogOut className="w-4 h-4" /> Leave
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.email ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          message.senderId === user?.email
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {selectedGroupChat && message.senderId !== user?.email && (
                          <p className="text-xs font-semibold mb-1 opacity-80">{message.senderName}</p>
                        )}

                        {message.replyTo && (
                          <div className="mb-2 p-2 rounded bg-black/5">
                            <p className="text-xs opacity-80">
                              Reply to {message.replyTo.senderName || "message"}: {message.replyTo.content}
                            </p>
                          </div>
                        )}

                        <p className="text-base leading-relaxed">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs opacity-70">
                            {message.createdAt?.toDate?.()?.toLocaleTimeString() || ""}
                          </p>

                          <div className="flex items-center gap-2">
                            {/* reactions display */}
                            {Object.entries(message.reactions || {}).map(([emoji, users]) => (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(message.id, emoji)}
                                className={`text-sm px-2 py-1 rounded ${users.includes(user?.email || "") ? "bg-black/10" : ""}`}
                                title={`${users.length} reaction(s)`}
                              >
                                {emoji} {users.length}
                              </button>
                            ))}

                            {/* quick reaction buttons */}
                            <div className="flex gap-1">
                              {["❤️", "😮", "😢", "😡"].map((e) => (
                                <button
                                  key={e}
                                  onClick={() => handleToggleReaction(message.id, e)}
                                  className="text-sm px-2 py-1 rounded hover:bg-black/5"
                                  title={`React ${e}`}
                                >
                                  {e}
                                </button>
                              ))}
                              <button
                                onClick={() =>
                                  setReplyTo({ messageId: message.id, content: message.content, senderName: message.senderName })
                                }
                                className="text-sm px-2 py-1 rounded hover:bg-black/5"
                                title="Reply"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t">
                  {replyTo && (
                    <div className="mb-2 p-2 rounded bg-black/5 flex justify-between items-center">
                      <div>
                        <p className="text-sm opacity-80">Replying to {replyTo.senderName || "message"}: {replyTo.content}</p>
                      </div>
                      <div>
                        <Button variant="ghost" onClick={() => setReplyTo(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="h-12 text-base"
                    />
                    <Button onClick={handleSendMessage} size="icon" className="h-12 w-12">
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-lg">Select a contact or group chat to start messaging</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Group Dialog (also used for adding members) */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedGroupChat ? "Add Members" : "Create Group Chat"}</DialogTitle>
            <DialogDescription>{selectedGroupChat ? "Add elders to this group" : "Create a new group chat with multiple members"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedGroupChat && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  placeholder="Enter group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Members (only elders can be added)</label>
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
                {contacts
                  .filter((c) => c.email !== user?.email && c.role === "elder")
                  .map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={contact.id}
                        checked={(selectedGroupChat ? editSelectedMembers : selectedMembers).includes(contact.email)}
                        onChange={(e) => {
                          if (selectedGroupChat) {
                            if (e.target.checked) setEditSelectedMembers([...editSelectedMembers, contact.email])
                            else setEditSelectedMembers(editSelectedMembers.filter((m) => m !== contact.email))
                          } else {
                            if (e.target.checked) setSelectedMembers([...selectedMembers, contact.email])
                            else setSelectedMembers(selectedMembers.filter((m) => m !== contact.email))
                          }
                        }}
                        className="w-5 h-5 rounded"
                      />
                      <label htmlFor={contact.id} className="flex-1 cursor-pointer text-base">
                        {contact.clinicName || contact.name || contact.email}
                      </label>
                    </div>
                  ))}
                {contacts.filter((c) => c.role === "elder").length === 0 && (
                  <p className="text-sm text-muted-foreground">No elder contacts available to add</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              {!selectedGroupChat ? (
                <>
                  <Button onClick={handleCreateGroupChat} className="flex-1 text-base h-12">
                    Create Group
                  </Button>
                  <Button onClick={() => setShowCreateGroupDialog(false)} variant="outline" className="flex-1 text-base h-12">
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={async () => {
                      // apply adding members to existing group
                      try {
                        const allowed = editSelectedMembers.filter((email) => {
                          const c = contacts.find((x) => x.email === email)
                          return c?.role === "elder"
                        })
                        const groupRef = doc(db, "groupChats", selectedGroupChat.id)
                        for (const m of allowed) {
                          await updateDoc(groupRef, { members: arrayUnion(m) })
                        }
                        toast({ title: "Success", description: "Members added" })
                        setShowCreateGroupDialog(false)
                        fetchGroupChats()
                      } catch (error: any) {
                        toast({ title: "Error", description: error.message, variant: "destructive" })
                      }
                    }}
                    className="flex-1 text-base h-12"
                  >
                    Add Members
                  </Button>
                  <Button onClick={() => setShowCreateGroupDialog(false)} variant="outline" className="flex-1 text-base h-12">
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditGroupDialog} onOpenChange={setShowEditGroupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Group Chat</DialogTitle>
            <DialogDescription>Edit name and members (only elders can be added)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input
                placeholder="Enter group name..."
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Members</label>
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
                {contacts
                  .filter((c) => c.email !== user?.email && c.role === "elder")
                  .map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`edit-${contact.id}`}
                        checked={editSelectedMembers.includes(contact.email)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditSelectedMembers([...editSelectedMembers, contact.email])
                          } else {
                            setEditSelectedMembers(editSelectedMembers.filter((m) => m !== contact.email))
                          }
                        }}
                        className="w-5 h-5 rounded"
                      />
                      <label htmlFor={`edit-${contact.id}`} className="flex-1 cursor-pointer text-base">
                        {contact.clinicName || contact.name || contact.email}
                      </label>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditGroup} className="flex-1 text-base h-12">
                Save
              </Button>
              <Button onClick={() => setShowEditGroupDialog(false)} variant="outline" className="flex-1 text-base h-12">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
