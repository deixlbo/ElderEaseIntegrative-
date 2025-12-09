"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Plus, X } from "lucide-react"

interface Contact {
  id: string
  name: string
  email: string
  role: string
}

interface GroupChatManagerProps {
  contacts: Contact[]
  onCreateGroupChat: (groupName: string, members: string[]) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function GroupChatManager({ contacts, onCreateGroupChat, isOpen, onOpenChange }: GroupChatManagerProps) {
  const [groupName, setGroupName] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const handleCreateGroupChat = () => {
    if (!groupName.trim() || selectedMembers.length === 0) return

    onCreateGroupChat(groupName, selectedMembers)
    setGroupName("")
    setSelectedMembers([])
    onOpenChange(false)
  }

  const toggleMember = (email: string) => {
    setSelectedMembers((prev) => (prev.includes(email) ? prev.filter((m) => m !== email) : [...prev, email]))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="w-6 h-6" />
            Create Group Chat
          </DialogTitle>
          <DialogDescription>Create a new group chat with multiple members</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Group Name</label>
            <Input
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Members ({selectedMembers.length} selected)</label>
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No contacts available</p>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                    onClick={() => toggleMember(contact.email)}
                  >
                    <input
                      type="checkbox"
                      id={contact.id}
                      checked={selectedMembers.includes(contact.email)}
                      onChange={() => toggleMember(contact.email)}
                      className="w-5 h-5 rounded"
                    />
                    <label htmlFor={contact.id} className="flex-1 cursor-pointer text-base">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Members</label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((email) => {
                  const contact = contacts.find((c) => c.email === email)
                  return (
                    <div
                      key={email}
                      className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {contact?.name}
                      <button onClick={() => toggleMember(email)} className="hover:opacity-70 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCreateGroupChat}
              disabled={!groupName.trim() || selectedMembers.length === 0}
              className="flex-1 text-base h-12"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Group
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1 text-base h-12">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
