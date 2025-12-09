"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, type DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Plus, Pencil, Trash2, LayoutDashboard, Pill, Package, Users, User, Menu, X as XClose } from "lucide-react"

interface Medicine {
    id: string
    name: string
    description: string
    stock: number
    price: number
    clinicId: string
    clinicEmail: string
}

const isMedicine = (data: DocumentData): data is Medicine => {
    return (
        typeof data.name === 'string' &&
        typeof data.description === 'string' &&
        typeof data.clinicId === 'string' &&
        typeof data.clinicEmail === 'string' &&
        (typeof data.stock === 'number' || typeof data.stock === 'string') &&
        (typeof data.price === 'number' || typeof data.price === 'string')
    )
}

// --- Utility: Format Currency to PHP ---
const formatPeso = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount)
}

// --- Sidebar Component (Minimal Update for consistent orange theme) ---
const ClinicSidebar = ({ clinicName }: { clinicName: string | undefined }) => {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const navItems = [
        { name: "Dashboard", href: "/clinic/home", icon: LayoutDashboard },
        { name: "Medicine List", href: "/elder/medicines", icon: Pill },
        { name: "Orders", href: "/clinic/orders", icon: Package },
        { name: "Profile", href: "/clinic/profile", icon: User },
    ]

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden fixed top-4 left-4 z-50 bg-card shadow-lg text-orange-600 hover:bg-orange-50" // Orange-themed
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <XClose className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>

            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r p-4 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Orange-Themed Header */}
                    <div className="text-2xl font-bold text-orange-600 mb-8 mt-2">
                        {clinicName || "Clinic Portal"}
                    </div>
                    {/* End Orange-Themed Header */}

                    <nav className="space-y-1 flex-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link key={item.name} href={item.href} passHref onClick={() => setIsOpen(false)}>
                                    <div
                                        className={`flex items-center p-3 rounded-lg transition-colors ${
                                            // Orange-Themed Active State
                                            isActive 
                                                ? "bg-orange-600 text-white font-semibold shadow-md" 
                                                : "text-foreground hover:bg-orange-50"
                                            // End Orange-Themed Active State
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5 mr-3" />
                                        <span>{item.name}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </aside>

            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    )
}

export default function MedicinesPage() {
    const { user, userProfile, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [medicines, setMedicines] = useState<Medicine[]>([])
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        stock: "",
        price: "",
    })

    const fetchMedicines = useCallback(async () => {
        if (!user?.uid) return
        setIsDataLoading(true)
        try {
            // Query medicines with clinicId matching the current user's UID
            const medicinesQuery = query(
                collection(db, "medicines"), 
                where("clinicId", "==", user.uid)
            )
            const snapshot = await getDocs(medicinesQuery)
            const medicinesData = snapshot.docs.map((doc) => {
                const data = doc.data()
                if (isMedicine(data)) {
                    return {
                        id: doc.id,
                        ...data,
                        stock: Number(data.stock),
                        price: Number(data.price),
                    } as Medicine
                }
                console.error("Invalid medicine data format:", data)
                return null
            }).filter((m): m is Medicine => m !== null)

            console.log("Fetched medicines:", medicinesData)
            setMedicines(medicinesData)
        } catch (error) {
            console.error("Error fetching medicines:", error)
            toast({
                title: "Error fetching data",
                description: "Could not load medicine inventory.",
                variant: "destructive",
            })
        } finally {
            setIsDataLoading(false)
        }
    }, [user?.uid, toast])

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login")
            } else {
                fetchMedicines()
            }
        }
    }, [user, loading, router, fetchMedicines])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user || !user.email) {
            toast({
                title: "Authentication Error",
                description: "User or user email not available. Please log in again.",
                variant: "destructive",
            })
            return
        }

        const stockNum = Number.parseInt(formData.stock)
        const priceNum = Number.parseFloat(formData.price)

        if (isNaN(stockNum) || isNaN(priceNum) || stockNum < 0 || priceNum < 0) {
            toast({
                title: "Validation Error",
                description: "Stock must be a non-negative integer and Price must be a non-negative number.",
                variant: "destructive",
            })
            return
        }

        try {
            if (editingMedicine) {
                await updateDoc(doc(db, "medicines", editingMedicine.id), {
                    name: formData.name,
                    description: formData.description,
                    stock: stockNum,
                    price: priceNum,
                    updatedAt: new Date().toISOString(),
                })
                toast({ title: "Medicine updated successfully" })
            } else {
                // Store medicine with consistent clinicId (user UID) and clinic email
                await addDoc(collection(db, "medicines"), {
                    name: formData.name,
                    description: formData.description,
                    stock: stockNum,
                    price: priceNum,
                    clinicId: user.uid,
                    clinicEmail: user.email,
                    createdAt: new Date().toISOString(),
                })
                toast({ title: "Medicine added successfully" })
            }

            setFormData({ name: "", description: "", stock: "", price: "" })
            setIsAddDialogOpen(false)
            setEditingMedicine(null)
            fetchMedicines()
        } catch (error: any) {
            console.error("Error during submit:", error)
            toast({
                title: "Error submitting medicine",
                description: error.message || "An unknown error occurred.",
                variant: "destructive",
            })
        }
    }

    const handleEdit = (medicine: Medicine) => {
        setEditingMedicine(medicine)
        setFormData({
            name: medicine.name,
            description: medicine.description,
            stock: medicine.stock.toString(),
            // Ensure price input is formatted correctly for editing
            price: medicine.price.toFixed(2), 
        })
        setIsAddDialogOpen(true)
    }

    const handleDelete = async (medicineId: string) => {
        if (!confirm("Are you sure you want to delete this medicine? This action cannot be undone.")) return

        try {
            await deleteDoc(doc(db, "medicines", medicineId))
            toast({ title: "Medicine deleted successfully" })
            fetchMedicines()
        } catch (error: any) {
            console.error("Error deleting medicine:", error)
            toast({
                title: "Error",
                description: error.message || "Could not delete medicine.",
                variant: "destructive",
            })
        }
    }

    if (loading || (user && isDataLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                {/* Orange spinner */}
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-background flex">
            <ClinicSidebar clinicName={userProfile?.clinicName} />

            <div className="flex-1 lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8">
                <main className="container max-w-7xl mx-auto p-0">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold">Medicine Management</h1>
                                <p className="text-muted-foreground mt-2">Manage your clinic's medicine inventory</p>
                            </div>

                            <Dialog
                                open={isAddDialogOpen}
                                onOpenChange={(open) => {
                                    setIsAddDialogOpen(open)
                                    if (!open) {
                                        setEditingMedicine(null)
                                        setFormData({ name: "", description: "", stock: "", price: "" })
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    {/* Orange Button */}
                                    <Button className="gap-2 animate-fade-in delay-300 bg-orange-600 hover:bg-orange-700">
                                        <Plus className="w-4 h-4" />
                                        Add Medicine
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{editingMedicine ? "Edit Medicine" : "Add New Medicine"}</DialogTitle>
                                        <DialogDescription>
                                            {editingMedicine ? "Update medicine information" : "Add a new medicine to your inventory"}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Medicine Name</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Input
                                                id="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="stock">Stock</Label>
                                                <Input
                                                    id="stock"
                                                    type="number"
                                                    value={formData.stock}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                {/* UPDATED: Label for PHP */}
                                                <Label htmlFor="price">Price (PHP)</Label>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.price}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {/* Orange Button */}
                                        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                                            {editingMedicine ? "Update Medicine" : "Add Medicine"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Card className="animate-fade-in">
                            <CardHeader>
                                <CardTitle>Medicine Inventory</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {medicines.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>No medicines added yet</p>
                                        <p className="text-sm mt-2">Click "Add Medicine" to get started</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[700px]">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-4 font-medium">Medicine Name</th>
                                                    <th className="text-left p-4 font-medium">Description</th>
                                                    <th className="text-left p-4 font-medium">Stock</th>
                                                    {/* UPDATED: Table Header for PHP */}
                                                    <th className="text-left p-4 font-medium">Price (PHP)</th>
                                                    <th className="text-left p-4 font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {medicines.map((medicine) => (
                                                    <tr key={medicine.id} className="border-b hover:bg-muted/50">
                                                        <td className="p-4 font-medium">{medicine.name}</td>
                                                        <td className="p-4 text-muted-foreground truncate max-w-xs">{medicine.description}</td>
                                                        <td className="p-4">{medicine.stock}</td>
                                                        {/* UPDATED: Display price in PHP */}
                                                        <td className="p-4 font-semibold text-orange-600">{formatPeso(medicine.price)}</td>
                                                        <td className="p-4">
                                                            <div className="flex gap-2">
                                                                {/* Orange hover for edit button */}
                                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(medicine)} title="Edit" className="hover:text-orange-600">
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                {/* Red for delete (standard destructive action color) */}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDelete(medicine.id)}
                                                                    className="text-destructive hover:text-red-600"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}