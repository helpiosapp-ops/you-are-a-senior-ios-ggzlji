
import { Pressable, StyleSheet, Alert } from "react-native";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { IconSymbol } from "@/components/IconSymbol";
import { premiumGreen } from "@/constants/Colors";

const styles = StyleSheet.create({
  button: {
    padding: 8,
    marginHorizontal: 4,
  },
});

export function HeaderRightButton() {
  const { colors } = useTheme();

  return (
    <Pressable
      style={styles.button}
      onPress={() => {
        console.log('HeaderRightButton: Info button pressed');
        Alert.alert(
          "About SilentAudit",
          "Privacy-first device health monitoring. All data is processed locally on your device. No information is sent to any server.",
          [{ text: "OK" }]
        );
      }}
    >
      <IconSymbol
        ios_icon_name="info.circle"
        android_material_icon_name="info"
        size={24}
        color={premiumGreen}
      />
    </Pressable>
  );
}

export function HeaderLeftButton() {
  const { colors } = useTheme();

  return (
    <Pressable
      style={styles.button}
      onPress={() => {
        console.log('HeaderLeftButton: Shield button pressed');
      }}
    >
      <IconSymbol
        ios_icon_name="shield.fill"
        android_material_icon_name="security"
        size={24}
        color={premiumGreen}
      />
    </Pressable>
  );
}
