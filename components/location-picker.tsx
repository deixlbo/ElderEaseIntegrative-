"use client"

import { useEffect, useState, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Navigation } from "lucide-react"

interface LocationPickerProps {
  onLocationSelect: (address: string, lat?: number, lng?: number) => void
  initialAddress?: string
  initialLat?: number
  initialLng?: number
}

export function LocationPicker({ onLocationSelect, initialAddress = "", initialLat, initialLng }: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [selectedLat, setSelectedLat] = useState(initialLat || 14.5995)
  const [selectedLng, setSelectedLng] = useState(initialLng || 120.9842)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return

    const map = L.map("location-map").setView([selectedLat, selectedLng], 13)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([selectedLat, selectedLng], { draggable: true }).addTo(map)
    markerRef.current = marker

    // Update location when marker is dragged
    marker.on("dragend", () => {
      const latlng = marker.getLatLng()
      setSelectedLat(latlng.lat)
      setSelectedLng(latlng.lng)
      reverseGeocodeCoordinates(latlng.lat, latlng.lng)
    })

    map.on("click", (e) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      setSelectedLat(lat)
      setSelectedLng(lng)
      reverseGeocodeCoordinates(lat, lng)
    })

    mapRef.current = map

    // Cleanup
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const reverseGeocodeCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      )
      const data = await response.json()
      const foundAddress = data.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      setAddress(foundAddress)
      onLocationSelect(foundAddress, lat, lng)
    } catch (error) {
      console.error("Error getting address:", error)
      const fallbackAddress = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      setAddress(fallbackAddress)
      onLocationSelect(fallbackAddress, lat, lng)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        setSelectedLat(lat)
        setSelectedLng(lng)

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 13)
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          }
        }

        reverseGeocodeCoordinates(lat, lng)
        setIsGettingLocation(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        setIsGettingLocation(false)
        let errorMessage = "Unable to get your location"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
        }

        alert(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const handleAddressSubmit = () => {
    if (address.trim()) {
      onLocationSelect(address.trim(), selectedLat, selectedLng)
    }
  }

  return (
    <div className="space-y-4">
      {/* Address input and buttons */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter event location or use current location"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddressSubmit()}
          className="flex-1"
        />
        <Button onClick={handleAddressSubmit} type="button" disabled={!address.trim()}>
          <MapPin className="w-4 h-4" />
        </Button>
        <Button onClick={getCurrentLocation} type="button" variant="outline" disabled={isGettingLocation}>
          {isGettingLocation ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div id="location-map" className="w-full h-64 rounded-lg border border-gray-300 z-10" />

      {/* Selected coordinates display */}
      {selectedLat && selectedLng && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Coordinates:</strong> {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Click on the map to place a pin, drag the pin to adjust the location, or use the
          location button to auto-detect your current location.
        </p>
      </div>
    </div>
  )
}
