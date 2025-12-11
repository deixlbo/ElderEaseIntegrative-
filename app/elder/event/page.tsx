"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Calendar, MapPin, Users, Plus, Trash2, Edit2 } from "lucide-react"
import Link from "next/link"
import { Home, BookOpen, User, Menu, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import dynamic from "next/dynamic"

// Load LocationPicker only on the client
const LocationPicker = dynamic(
  () => import("@/components/location-picker").then((mod) => mod.LocationPicker),
  { ssr: false }
)

interface JoinRequest {
  userId: string
  userName: string
  userEmail: string
  status: "pending" | "approved" | "rejected"
}

interface MyEvent {
  id: string
  eventTitle: string
  description: string
  date: string
  time: string
  location: string
  latitude?: number
  longitude?: number
  attendees: string[]
  joinRequests: JoinRequest[]
  maxAttendees: number
  createdBy: string
  dateCreated: string
}

// Enhanced Location Display Component
function LocationDisplay({
  location,
  latitude,
  longitude,
}: {
  location: string
  latitude?: number
  longitude?: number
}) {
  const handleOpenInMaps = () => {
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank")
    } else {
      window.open(`https://www.google.com/maps?q=${encodeURIComponent(location)}`, "_blank")
    }
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-white p-4 rounded-lg border border-emerald-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <h4 className="font-semibold text-emerald-800">Event Location</h4>
        </div>
        <Button 
          onClick={handleOpenInMaps} 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700"
        >
          <MapPin className="w-3 h-3" />
          Open in Maps
        </Button>
      </div>
      
      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{location}</p>
      
      <div className="w-full h-32 rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-emerald-100 opacity-30" />
        <div className="relative z-10 text-center">
          <MapPin className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-emerald-800">Location Preview</p>
          {latitude && longitude && (
            <p className="text-xs text-emerald-600 mt-1">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ElderEventPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<MyEvent[]>([
    {
      id: "1",
      eventTitle: "Community Gardening Day",
      description: "Join us for a day of gardening and community building",
      date: "2024-12-15",
      time: "10:00",
      location: "Central Park Community Garden",
      latitude: 14.5864,
      longitude: 120.9715,
      attendees: ["user1", "user2", "user3"],
      joinRequests: [],
      maxAttendees: 30,
      createdBy: "current-user",
      dateCreated: "2024-01-09"
    },
    {
      id: "2",
      eventTitle: "Morning Yoga Session",
      description: "Gentle yoga for seniors in the park",
      date: "2024-12-20",
      time: "08:00",
      location: "Riverside Park Pavilion",
      attendees: ["user1", "user2"],
      joinRequests: [],
      maxAttendees: 20,
      createdBy: "current-user",
      dateCreated: "2024-01-08"
    }
  ])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [eventTitle, setEventTitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [maxAttendees, setMaxAttendees] = useState(20)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("elderEvents", JSON.stringify(events))
  }, [events])

  const resetEventForm = () => {
    setEventTitle("")
    setEventDescription("")
    setEventDate("")
    setEventTime("")
    setEventLocation("")
    setLatitude(null)
    setLongitude(null)
    setMaxAttendees(20)
  }

  const startEditEvent = (event: MyEvent) => {
    setEventTitle(event.eventTitle)
    setEventDescription(event.description)
    setEventDate(event.date)
    setEventTime(event.time)
    setEventLocation(event.location)
    setLatitude(event.latitude || null)
    setLongitude(event.longitude || null)
    setMaxAttendees(event.maxAttendees)
    setEditingEventId(event.id)
    setShowEditDialog(true)
  }

  const handleLocationSelect = (address: string, lat?: number, lng?: number) => {
    setEventLocation(address)
    setLatitude(lat || null)
    setLongitude(lng || null)
  }

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventTime || !eventLocation.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const newEvent: MyEvent = {
        id: Date.now().toString(),
        eventTitle,
        description: eventDescription,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        attendees: [],
        joinRequests: [],
        maxAttendees,
        createdBy: "current-user",
        dateCreated: new Date().toISOString(),
      }

      setEvents([newEvent, ...events])

      toast({
        title: "Success",
        description: "Event created successfully",
      })

      resetEventForm()
      setShowCreateDialog(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not create event",
        variant: "destructive",
      })
    }
  }

  const handleEditEvent = async () => {
    if (!editingEventId) return

    try {
      setEvents(
        events.map((e) =>
          e.id === editingEventId
            ? {
                ...e,
                eventTitle,
                description: eventDescription,
                date: eventDate,
                time: eventTime,
                location: eventLocation,
                latitude: latitude || undefined,
                longitude: longitude || undefined,
                maxAttendees,
              }
            : e
        )
      )

      toast({
        title: "Success",
        description: "Event updated successfully",
      })

      resetEventForm()
      setShowEditDialog(false)
      setEditingEventId(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not update event",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      setEvents(events.filter((e) => e.id !== eventId))
      toast({
        title: "Success",
        description: "Event deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not delete event",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-emerald-800 hover:bg-emerald-50 rounded-full"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/ease.jpg" alt="ElderEase Logo" className="w-8 h-8 rounded-lg object-cover" />
            <h2 className="text-lg font-bold text-emerald-800">ElderEase</h2>
          </div>
        </div>
        <h1 className="text-xl font-bold text-emerald-800">Events</h1>
      </div>

      {/* Desktop Sidebar with integrated header */}
      <div className="hidden md:flex fixed inset-y-0 left-0 z-30 w-72 flex-col shadow-2xl bg-gradient-to-b from-emerald-800 to-emerald-900">
        {/* Logo Section */}
        <div className="p-6 border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm ring-2 ring-white/20">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-10 h-10 rounded-lg object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ElderEase</h2>
              <p className="text-xs text-emerald-200">Community Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {[
              { icon: Home, label: "Home", href: "/elder/home", active: false },
              { icon: BookOpen, label: "Tutorial", href: "/elder/tutorial", active: false },
              { icon: Calendar, label: "Event", href: "/elder/event", active: true },
              { icon: User, label: "Profile", href: "/elder/profile", active: false },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    item.active
                      ? "bg-white text-emerald-800 shadow-lg"
                      : "text-emerald-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.active && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div 
          className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-emerald-800 to-emerald-900 shadow-2xl transition-transform duration-300 transform ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Mobile Header in Sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-emerald-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <img src="/ease.jpg" alt="ElderEase Logo" className="w-8 h-8 rounded-lg object-cover" />
              </div>
              <h2 className="text-lg font-bold text-white">ElderEase</h2>
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

          {/* Mobile Navigation */}
          <nav className="p-4">
            <div className="space-y-2">
              {[
                { icon: Home, label: "Home", href: "/elder/home", active: false },
                { icon: BookOpen, label: "Tutorial", href: "/elder/tutorial", active: false },
                { icon: Calendar, label: "Event", href: "/elder/event", active: true },
                { icon: User, label: "Profile", href: "/elder/profile", active: false },
              ].map((item) => {
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
                    {item.active && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-72">
        <div className="p-4 md:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Events</h1>
                <p className="text-emerald-600 mt-1">Manage and create community events</p>
              </div>
              <Button 
                onClick={() => setShowCreateDialog(true)} 
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            </div>
          </div>

          {/* Events Grid */}
          <div className="space-y-6">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="border-2 border-emerald-100 hover:border-emerald-300 transition-all duration-300 hover:shadow-xl shadow-lg shadow-emerald-100/50 overflow-hidden"
              >
                <div className="p-6">
                  {/* Event Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                          <CardTitle className="text-xl md:text-2xl text-emerald-900">
                            {event.eventTitle}
                          </CardTitle>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-sm text-emerald-600">
                              <Calendar className="w-3 h-3" />
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-emerald-600">
                              <Users className="w-3 h-3" />
                              <span>{event.attendees.length}/{event.maxAttendees} attending</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 line-clamp-2 pl-13">{event.description}</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startEditEvent(event)}
                        className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column - Time & Location */}
                    <div className="space-y-6">
                      {/* Time Card */}
                      <div className="bg-gradient-to-r from-emerald-50 to-white p-4 rounded-lg border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                          </div>
                          <h4 className="font-semibold text-emerald-800">Event Time</h4>
                        </div>
                        <div className="space-y-1 pl-10">
                          <p className="text-lg font-semibold text-gray-800">{event.time}</p>
                          <p className="text-sm text-gray-600">{event.date}</p>
                        </div>
                      </div>

                      {/* Location Card */}
                      <LocationDisplay 
                        location={event.location} 
                        latitude={event.latitude} 
                        longitude={event.longitude} 
                      />
                    </div>

                    {/* Right Column - Attendees */}
                    <div className="bg-gradient-to-r from-emerald-50 to-white p-4 rounded-lg border border-emerald-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Users className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-emerald-800">Attendance</h4>
                          <p className="text-sm text-emerald-600">Join the community gathering</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Current Attendees</span>
                          <span className="font-semibold text-emerald-700">
                            {event.attendees.length} / {event.maxAttendees}
                          </span>
                        </div>
                        
                        <div className="relative h-3 bg-emerald-100 rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(event.attendees.length / event.maxAttendees) * 100}%` }}
                          />
                        </div>
                        
                        <div className="text-center pt-2">
                          <p className="text-sm text-gray-600">
                            {event.maxAttendees - event.attendees.length} spots remaining
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Empty State */}
            {events.length === 0 && (
              <Card className="border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
                <CardContent className="py-12 px-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-900 mb-2">No events yet</h3>
                  <p className="text-emerald-600 mb-6 max-w-md mx-auto">
                    Create your first event to bring the community together! Share activities, workshops, or gatherings.
                  </p>
                  <Button 
                    onClick={() => setShowCreateDialog(true)} 
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Event
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                <Plus className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <DialogTitle className="text-2xl text-emerald-900">Create New Event</DialogTitle>
                <DialogDescription className="text-emerald-600">
                  Organize a community event for everyone to join
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Event Title *</label>
              <Input
                placeholder="What's the event about?"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Description *</label>
              <Textarea
                placeholder="Describe the event in detail..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="min-h-32 resize-none border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Date *</label>
                <Input 
                  type="date" 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Time *</label>
                <Input 
                  type="time" 
                  value={eventTime} 
                  onChange={(e) => setEventTime(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Location *</label>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialAddress={eventLocation}
                initialLat={latitude || undefined}
                initialLng={longitude || undefined}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Max Attendees</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(Number.parseInt(e.target.value) || 1)}
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
              />
              <p className="text-xs text-gray-500">Set the maximum number of people who can attend</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleCreateEvent} 
                className="flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-200"
                disabled={!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventTime || !eventLocation.trim()}
              >
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
              <Button 
                onClick={() => setShowCreateDialog(false)} 
                variant="outline" 
                className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <DialogTitle className="text-2xl text-emerald-900">Edit Event</DialogTitle>
                <DialogDescription className="text-emerald-600">
                  Update your event details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Same form fields as create dialog */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Event Title *</label>
              <Input
                placeholder="What's the event about?"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Description *</label>
              <Textarea
                placeholder="Describe the event in detail..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="min-h-32 resize-none border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Date *</label>
                <Input 
                  type="date" 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Time *</label>
                <Input 
                  type="time" 
                  value={eventTime} 
                  onChange={(e) => setEventTime(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Location *</label>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialAddress={eventLocation}
                initialLat={latitude || undefined}
                initialLng={longitude || undefined}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Max Attendees</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(Number.parseInt(e.target.value) || 1)}
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleEditEvent} 
                className="flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-200"
                disabled={!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventTime || !eventLocation.trim()}
              >
                <Edit2 className="w-4 h-4" />
                Save Changes
              </Button>
              <Button 
                onClick={() => setShowEditDialog(false)} 
                variant="outline" 
                className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}