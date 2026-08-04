import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { C, FontFamily, Magenta } from "../../../theme";
import { useNeverShowAppEventPopup } from "../hooks";

const attendanceStamp = require("../../../../assets/event/attendance/attendance-stamp-image.png");
const attendanceWriting = require("../../../../assets/event/attendance/attendance-writing.png");

type AttendanceEventPopupProps = {
  visible: boolean;
  popupId: number;
  title?: string | null;
  imageUrl?: string | null;
  content?: string | null;
  ctaText?: string | null;
  onClose: () => void;
  onAttendanceCheck: () => void;
};

const FALLBACK_CTA = "출석 체크하기";

export function AttendanceEventPopup({
  visible,
  popupId,
  imageUrl,
  ctaText,
  onClose,
  onAttendanceCheck,
}: AttendanceEventPopupProps) {
  const neverShowMutation = useNeverShowAppEventPopup();
  const [neverShowError, setNeverShowError] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // The attendance template keeps its promotional copy fixed. Only the
  // server-provided CTA and image override their local fallbacks.
  const ctaLabel = ctaText?.trim() ? ctaText : FALLBACK_CTA;
  const remoteImage =
    imageUrl?.trim() && !imageFailed ? { uri: imageUrl } : null;

  const handleNeverShow = async () => {
    if (neverShowMutation.isPending) return;

    setNeverShowError(false);

    try {
      await neverShowMutation.mutateAsync(popupId);
      onClose();
    } catch {
      setNeverShowError(true);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.stampArea} pointerEvents="none">
              <Image
                source={remoteImage ?? attendanceStamp}
                style={styles.stamp}
                contentFit="contain"
                onError={() => setImageFailed(true)}
              />
            </View>

            <LinearGradient
              colors={["rgba(255, 3, 122, 0)", "#FF037A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.bottomGradient}
              pointerEvents="none"
            />

            <View style={styles.copy} pointerEvents="none">
              <Image
                source={attendanceWriting}
                style={styles.eventLabel}
                contentFit="contain"
              />
              <Text style={styles.title} numberOfLines={1}>
                출석하고 2만원 캐시받자!
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="출석 이벤트 팝업 닫기"
              >
                <Text style={styles.closeButtonText}>닫기</Text>
              </Pressable>
              <Pressable
                onPress={onAttendanceCheck}
                style={({ pressed }) => [
                  styles.attendanceButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="출석 체크하기"
              >
                <Text style={styles.attendanceButtonText} numberOfLines={1}>
                  {ctaLabel}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleNeverShow}
            disabled={neverShowMutation.isPending}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="다시 보지 않기"
          >
            {neverShowMutation.isPending ? (
              <ActivityIndicator size="small" color={C.card} />
            ) : (
              <Text style={styles.neverShowText}>
                {neverShowError ? "다시 시도하기" : "다시보지않기"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(19, 17, 18, 0.60)",
  },
  content: {
    alignItems: "center",
    gap: 20,
  },
  card: {
    width: 324,
    height: 400,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: Magenta[300],
  },
  stampArea: {
    position: "absolute",
    top: -91,
    right: -26,
    width: 280,
    height: 420,
    opacity: 0.8,
  },
  stamp: {
    width: "100%",
    height: "100%",
  },
  bottomGradient: {
    position: "absolute",
    top: 119,
    right: 0,
    bottom: 0,
    left: 0,
  },
  copy: {
    position: "absolute",
    top: 200,
    left: 19,
  },
  eventLabel: {
    width: 211,
    height: 87,
  },
  title: {
    marginTop: 11,
    color: "#FFF8FB",
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 19.6,
  },
  actions: {
    position: "absolute",
    right: 19,
    bottom: 18,
    left: 19,
    flexDirection: "row",
    gap: 8,
  },
  closeButton: {
    flex: 1,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: Magenta[300],
  },
  closeButtonText: {
    color: Magenta[50],
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22.4,
  },
  attendanceButton: {
    flex: 1,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: C.card,
  },
  attendanceButtonText: {
    color: Magenta[300],
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22.4,
  },
  neverShowText: {
    color: C.card,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 19.6,
    textDecorationLine: "underline",
  },
  pressed: {
    opacity: 0.9,
  },
});
