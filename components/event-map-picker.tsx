"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MapComponentProps {
  onLocationSelect: (latitude: number, longitude: number, address: string) => void
}

export default function MapComponent({ onLocationSelect }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const marker = useRef<any>(null)
  const [searchAddress, setSearchAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map with default location (center of US)
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true

    script.onload = () => {
      const google = (window as any).google
      if (!google) return

      map.current = new google.maps.Map(mapContainer.current, {
        zoom: 12,
        center: { lat: 40.7128, lng: -74.006 }, // New York City
        mapTypeControl: true,
        fullscreenControl: true,
      })

      // Add click listener to map
      map.current.addListener("click", (event: any) => {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()
        updateMarker(lat, lng)
        reverseGeocode(lat, lng)
      })
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  const updateMarker = (lat: number, lng: number) => {
    const google = (window as any).google
    if (!google || !map.current) return

    if (marker.current) {
      marker.current.setMap(null)
    }

    marker.current = new google.maps.Marker({
      position: { lat, lng },
      map: map.current,
      title: "Event Location",
    })

    map.current.setCenter({ lat, lng })
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address
        onLocationSelect(lat, lng, address)
      }
    } catch (error) {
      console.error("[v0] Error reverse geocoding:", error)
    }
  }

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        const address = data.results[0].formatted_address
        updateMarker(location.lat, location.lng)
        onLocationSelect(location.lat, location.lng, address)
      }
    } catch (error) {
      console.error("[v0] Error geocoding address:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search for an address..."
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearchAddress()}
          className="h-12 text-base"
        />
        <Button onClick={handleSearchAddress} disabled={isLoading} className="h-12 px-6">
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
      <div ref={mapContainer} className="w-full h-96 rounded-lg border-2 border-muted" />
      <p className="text-sm text-muted-foreground">Click on the map to select a location or search for an address</p>
    </div>
  )
}
