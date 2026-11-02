import { StyleSheet, Text, View } from "react-native";
import { Gray } from "../../../theme/colors";
import { Typography } from "../../../theme/typography";

const WEEKDAYS_KO = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
] as const;

const parseChatDate = (createdAt?: string | null): Date | null => {
  if (!createdAt) return null;

  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Device-local calendar key used to find boundaries in the chat timeline. */
export const getChatDateKey = (createdAt?: string | null): string | null => {
  const date = parseChatDate(createdAt);
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatChatDateLabel = (
  createdAt?: string | null,
): string | null => {
  const date = parseChatDate(createdAt);
  if (!date) return null;

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS_KO[date.getDay()]}`;
};

type Props = {
  createdAt?: string | null;
};

export function ChatDateSeparator({ createdAt }: Props) {
  const label = formatChatDateLabel(createdAt);
  if (!label) return null;

  return (
    <View style={styles.row}>
      <View style={styles.chip}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  chip: {
    minWidth: 164,
    height: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Gray[50],
  },
  label: {
    ...Typography.caption1Medium,
    color: Gray[500],
    textAlign: "center",
  },
});
