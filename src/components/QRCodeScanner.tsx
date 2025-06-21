"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { BarCodeScanner } from "expo-barcode-scanner"

interface QRCodeScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === "granted")
    }

    getBarCodeScannerPermissions()
  }, [])

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true)
      onScan(data)
    }
  }

  if (hasPermission === null) {
    return <Text>Requesting camera permission</Text>
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.instructions}>Point your camera at a QR code to scan</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        {scanned && (
          <TouchableOpacity style={styles.scanAgainButton} onPress={() => setScanned(false)}>
            <Text style={styles.scanAgainButtonText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "white",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "transparent",
  },
  instructions: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 5,
    margin: 20,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
  scanAgainButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  scanAgainButtonText: {
    color: "white",
    fontSize: 16,
  },
})
