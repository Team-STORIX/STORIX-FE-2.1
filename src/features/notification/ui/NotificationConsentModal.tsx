import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { C, Gray, Radius, Typography } from "../../../theme";
import type { NotificationConsentModalState } from "../hooks/useNotificationConsentModal";

// Fallback copy used when the consent API response is unavailable. The result
// receipt is otherwise driven by the server response (sender / processedAt /
// description), matching the Figma "이벤트/혜택 알림 동의/거부 안내" frames.
const SENDER_FALLBACK = "팀 스토릭스";

type Props = NotificationConsentModalState;

export function NotificationConsentModal({
  step,
  submitting,
  result,
  onAgree,
  onReject,
  onConfirm,
}: Props) {
  if (step === "hidden") return null;

  const isResult = step === "agreeResult" || step === "rejectResult";
  const agreed = step === "agreeResult";

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onConfirm}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {step === "initial" ? (
            <InitialContent
              submitting={submitting}
              onAgree={onAgree}
              onReject={onReject}
            />
          ) : isResult ? (
            <ResultContent
              agreed={agreed}
              result={result}
              onConfirm={onConfirm}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function InitialContent({
  submitting,
  onAgree,
  onReject,
}: {
  submitting: boolean;
  onAgree: () => void;
  onReject: () => void;
}) {
  return (
    <>
      <Text style={styles.title}>
        스토릭스 내 이벤트 소식을{"\n"}받아보시겠어요?
      </Text>
      <Text style={styles.body}>
        알림 수신 동의 시{"\n"}스토릭스 내 혜택, 이벤트 정보를{"\n"}받을 수
        있어요!
      </Text>
      <Text style={styles.note}>* 알림 &gt; 알림 설정에서 변경이 가능해요</Text>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.pressed,
          ]}
          onPress={onReject}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>동의 안함</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.pressed,
            submitting && styles.btnDisabled,
          ]}
          onPress={onAgree}
          disabled={submitting}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={C.card} />
          ) : (
            <Text style={styles.primaryText}>동의 후 알림 받기</Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

function ResultContent({
  agreed,
  result,
  onConfirm,
}: {
  agreed: boolean;
  result: Props["result"];
  onConfirm: () => void;
}) {
  const title =
    result?.title ??
    (agreed ? "이벤트/혜택 알림 동의 안내" : "이벤트/혜택 알림 거부 안내");
  const sender = result?.sender ?? SENDER_FALLBACK;
  const processedAt = result?.processedAt ?? "";
  const description =
    result?.description ??
    (agreed ? "알림 동의 처리 완료" : "알림 거부 처리 완료");

  return (
    <>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.receipt}>
        <Text style={styles.receiptLine}>1. 전송자 : {sender}</Text>
        {processedAt ? (
          <Text style={styles.receiptLine}>2. 수신 일시 : {processedAt}</Text>
        ) : null}
        <Text style={styles.receiptLine}>
          {processedAt ? "3" : "2"}. 처리 내용 : {description}
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.primaryBtn,
          styles.fullBtn,
          pressed && styles.pressed,
        ]}
        onPress={onConfirm}
        accessibilityRole="button"
        accessibilityLabel={agreed ? "알림 동의 결과 확인" : "알림 거부 결과 확인"}
      >
        <Text style={styles.primaryText}>확인</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: 306,
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: {
    ...Typography.heading3,
    color: C.text,
    textAlign: "center",
  },
  body: {
    marginTop: 14,
    ...Typography.body2Medium,
    color: C.textSecondary,
    textAlign: "center",
  },
  note: {
    marginTop: 14,
    ...Typography.caption1Medium,
    color: C.textMuted,
    textAlign: "center",
  },
  receipt: {
    marginTop: 12,
    marginBottom: 4,
    alignItems: "center",
    gap: 4,
  },
  receiptLine: {
    ...Typography.body2Medium,
    color: C.textSecondary,
    textAlign: "center",
  },
  actions: {
    marginTop: 20,
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: Gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    ...Typography.body1Medium,
    color: C.textSecondary,
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: C.text,
    alignItems: "center",
    justifyContent: "center",
  },
  fullBtn: {
    flex: 0,
    marginTop: 20,
    width: "100%",
  },
  primaryText: {
    ...Typography.body1Medium,
    color: C.card,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});
