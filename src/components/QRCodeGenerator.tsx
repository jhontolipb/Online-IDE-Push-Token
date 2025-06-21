import type React from "react"
import { View, StyleSheet } from "react-native"
import QRCode from "react-native-qrcode-svg"

interface QRCodeGeneratorProps {
  value: string
  size?: number
  backgroundColor?: string
  color?: string
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  size = 200,
  backgroundColor = "white",
  color = "black",
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <QRCode value={value} size={size} color={color} backgroundColor={backgroundColor} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
})
