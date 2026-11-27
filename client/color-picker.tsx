import { TextInput } from "@getpaseo/plugin/client/ui";
import { useState } from "react";
import { View, type GestureResponderEvent } from "react-native";

export function hsvToHex(h: number, s: number, v: number): string {
  const channel = (offset: number) => {
    const k = (offset + h / 60) % 6;
    return Math.round(255 * v * (1 - s * Math.max(0, Math.min(k, 4 - k, 1))))
      .toString(16).padStart(2, "0");
  };
  return `#${channel(5)}${channel(3)}${channel(1)}`.toUpperCase();
}

function hexToHsv(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const v = Math.max(r!, g!, b!), min = Math.min(r!, g!, b!), d = v - min;
  const h = !d ? 0 : v === r ? 60 * (((g! - b!) / d + 6) % 6)
    : v === g ? 60 * ((b! - r!) / d + 2) : 60 * ((r! - g!) / d + 4);
  return { h, s: v ? d / v : 0, v };
}

/** A native responder surface supports mouse and touch without a DOM-only color input. */
export function ColorPicker({ color, onChange, foreground, border }: {
  color: string | null;
  onChange(color: string): void;
  foreground: string;
  border: string;
}) {
  const [hue, setHue] = useState(() => hexToHsv(color ?? "#0090FF").h);
  const [field, setField] = useState(color ?? "");
  const [previous, setPrevious] = useState(color);
  const [width, setWidth] = useState(1);
  const hsv = hexToHsv(color ?? "#0090FF");
  if (previous !== color) {
    setPrevious(color);
    setField(color ?? "");
    if (hsv.s && hsv.v) setHue(hsv.h);
  }
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const plane = (event: GestureResponderEvent) => {
    onChange(hsvToHex(hue, clamp(event.nativeEvent.locationX / width),
      1 - clamp(event.nativeEvent.locationY / 120)));
  };
  const spectrum = (event: GestureResponderEvent) => {
    const h = clamp(event.nativeEvent.locationX / width) * 359.99;
    setHue(h);
    onChange(hsvToHex(h, hsv.s, hsv.v));
  };
  return (
    <View style={{ gap: 8 }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View accessibilityLabel="Saturation / brightness" onStartShouldSetResponder={() => true}
        onResponderGrant={plane} onResponderMove={plane} onResponderTerminationRequest={() => false}
        style={{ height: 120, overflow: "hidden", borderRadius: 6 }}>
        <View pointerEvents="none" style={{ flex: 1 }}>
          {Array.from({ length: 16 }, (_, y) => (
            <View key={y} style={{ flex: 1, flexDirection: "row" }}>
              {Array.from({ length: 32 }, (_, x) => (
                <View key={x} style={{ flex: 1, backgroundColor: hsvToHex(hue, x / 31, 1 - y / 15) }} />
              ))}
            </View>
          ))}
        </View>
        <View pointerEvents="none" style={{ position: "absolute", left: `${hsv.s * 100}%`,
          top: `${(1 - hsv.v) * 100}%`, width: 12, height: 12, marginLeft: -6, marginTop: -6,
          borderRadius: 6, borderWidth: 2, borderColor: "white", backgroundColor: color ?? "#0090FF" }} />
      </View>
      <View accessibilityLabel="Hue" onStartShouldSetResponder={() => true}
        onResponderGrant={spectrum} onResponderMove={spectrum} onResponderTerminationRequest={() => false}
        style={{ height: 22, borderRadius: 6, overflow: "hidden" }}>
        <View pointerEvents="none" style={{ flex: 1, flexDirection: "row" }}>
          {Array.from({ length: 72 }, (_, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: hsvToHex(i * 5, 1, 1) }} />
          ))}
        </View>
        <View pointerEvents="none" style={{ position: "absolute", left: `${hue / 360 * 100}%`,
          top: 0, bottom: 0, width: 6, marginLeft: -3, borderWidth: 2, borderColor: "white" }} />
      </View>
      <TextInput accessibilityLabel="HEX" placeholder="#RRGGBB" value={field}
        autoCapitalize="characters" autoCorrect={false} maxLength={7}
        onChangeText={(text) => {
          setField(text);
          const hex = text.startsWith("#") ? text : `#${text}`;
          if (/^#[0-9a-f]{6}$/i.test(hex)) onChange(hex.toUpperCase());
        }}
        onBlur={() => setField(color ?? "")}
        style={{ color: foreground, borderColor: border, borderWidth: 1,
          borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 }} />
    </View>
  );
}
