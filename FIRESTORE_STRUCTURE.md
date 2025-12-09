# Firestore Database Structure

This document outlines the complete Firestore database structure for the ElderEase system.

## Collections Overview

### 1. **users** Collection
Stores all user profiles (Clinic, Elder, Rider)

\`\`\`typescript
{
  id: string (auto-generated document ID)
  email: string
  role: "clinic" | "elder" | "rider"
  createdAt: Timestamp
  
  // Clinic-specific fields
  clinicName?: string
  address?: string
  phone?: string
  
  // Elder-specific fields
  name?: string
  birthdate?: string
  age?: number
  qrCode?: string // Base64 encoded QR code
  
  // Rider-specific fields
  vehicleType?: string
  licenseNumber?: string
}
\`\`\`

### 2. **medicines** Collection
Stores medicine inventory for clinics

\`\`\`typescript
{
  id: string (auto-generated)
  name: string
  description: string
  stock: number
  price: number
  clinicId: string (reference to users collection)
  clinicName: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}
\`\`\`

### 3. **orders** Collection
Stores medicine orders and deliveries

\`\`\`typescript
{
  id: string (auto-generated)
  customerId: string (elder user ID)
  customerName: string
  customerEmail: string
  customerAddress: string
  clinicId: string
  clinicName: string
  medicineId: string
  medicineName: string
  quantity: number
  price: number
  total: number
  status: "pending" | "accepted" | "rejected" | "delivered"
  riderId?: string
  riderName?: string
  createdAt: Timestamp
  acceptedAt?: Timestamp
  deliveredAt?: Timestamp
  rejectedAt?: Timestamp
}
\`\`\`

### 4. **deliveries** Collection
Tracks delivery status and history (linked to orders)

\`\`\`typescript
{
  id: string (auto-generated)
  orderId: string (reference to orders collection)
  riderId: string
  riderName: string
  customerId: string
  customerName: string
  customerAddress: string
  status: "assigned" | "in_transit" | "delivered"
  assignedAt: Timestamp
  deliveredAt?: Timestamp
  notes?: string
}
\`\`\`

### 5. **messages** Collection
Stores all messages between users

\`\`\`typescript
{
  id: string (auto-generated)
  senderId: string
  senderName: string
  senderRole: "clinic" | "elder" | "rider"
  receiverId: string
  receiverName: string
  receiverRole: "clinic" | "elder" | "rider"
  content: string
  read: boolean
  createdAt: Timestamp
}
\`\`\`

### 6. **posts** Collection
Community posts from elders (needs/donations)

\`\`\`typescript
{
  id: string (auto-generated)
  userId: string (elder user ID)
  userName: string
  userAvatar?: string
  type: "need" | "donation"
  title: string
  description: string
  imageUrl?: string
  likes: number
  likedBy: string[] (array of user IDs)
  comments: number
  createdAt: Timestamp
  updatedAt?: Timestamp
}
\`\`\`

### 7. **comments** Collection
Comments on posts

\`\`\`typescript
{
  id: string (auto-generated)
  postId: string (reference to posts collection)
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: Timestamp
}
\`\`\`

### 8. **events** Collection
Community events for elders

\`\`\`typescript
{
  id: string (auto-generated)
  title: string
  description: string
  date: string (ISO date string)
  time: string
  location: string
  imageUrl?: string
  attendees: string[] (array of user IDs)
  maxAttendees?: number
  createdBy: string (user ID)
  createdByName: string
  dateCreated: Timestamp
  updatedAt?: Timestamp
}
\`\`\`

### 9. **tutorials** Collection
Tutorial videos for elders

\`\`\`typescript
{
  id: string (auto-generated)
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: string
  category: string
  views: number
  createdAt: Timestamp
}
\`\`\`

### 10. **notifications** Collection
System notifications for users

\`\`\`typescript
{
  id: string (auto-generated)
  userId: string
  type: "new_order" | "new_delivery" | "new_message" | "event_reminder"
  title: string
  message: string
  read: boolean
  relatedId?: string (order ID, message ID, etc.)
  createdAt: Timestamp
}
\`\`\`

## Firestore Security Rules

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Medicines collection
    match /medicines/{medicineId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'clinic';
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.senderId || 
         request.auth.uid == resource.data.receiverId);
      allow create: if request.auth != null;
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }
    
    // All other collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
\`\`\`

## Indexes Required

Create these composite indexes in Firebase Console:

1. **messages** collection:
   - Fields: `senderId` (Ascending), `receiverId` (Ascending), `createdAt` (Ascending)
   - Fields: `receiverId` (Ascending), `senderId` (Ascending), `createdAt` (Ascending)

2. **orders** collection:
   - Fields: `clinicId` (Ascending), `createdAt` (Descending)
   - Fields: `riderId` (Ascending), `createdAt` (Descending)
   - Fields: `customerId` (Ascending), `createdAt` (Descending)

3. **posts** collection:
   - Fields: `createdAt` (Descending)

4. **events** collection:
   - Fields: `date` (Ascending), `createdAt` (Descending)
\`\`\`

```css file="" isHidden
