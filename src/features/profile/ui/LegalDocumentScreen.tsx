import { Fragment, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Typography } from '../../../theme'

const backIcon = require('../../../../assets/icons/common/back.svg')
const arrowDownIcon = require('../../../../assets/icons/common/arrow-down.svg')
const arrowUpIcon = require('../../../../assets/icons/common/arrow-up.svg')

type LegalBlock =
  | { type: 'heading'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; rows: string[][] }

type Props = {
  title: string
  markdown: string
  versionLabel?: string
}

export function LegalDocumentScreen({ title, markdown, versionLabel = '버전 1 (26.07.07)' }: Props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownTop, setDropdownTop] = useState(0)
  const blocks = parseLegalMarkdown(markdown)

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.topBarOuter, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarInner}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
          >
            <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
          </Pressable>
          <Text style={styles.topBarTitle}>{title}</Text>
        </View>
      </View>

      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <Pressable
        style={styles.versionRow}
        onPress={() => setDropdownOpen((value) => !value)}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout
          setDropdownTop(y + height)
        }}
        accessibilityRole="button"
        accessibilityLabel="약관 버전 선택"
      >
        <Text style={styles.versionLabel}>{versionLabel}</Text>
        <Image
          source={dropdownOpen ? arrowUpIcon : arrowDownIcon}
          style={styles.arrowIcon}
          contentFit="contain"
        />
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {blocks.map((block, index) => (
          <Fragment key={`${block.type}-${index}`}>
            {block.type === 'heading' ? (
              <Text style={[styles.sectionTitle, index > 0 && styles.sectionGap]}>
                {block.text}
              </Text>
            ) : null}
            {block.type === 'subheading' ? (
              <Text style={[styles.subsectionTitle, index > 0 && styles.elementGap]}>
                {block.text}
              </Text>
            ) : null}
            {block.type === 'paragraph' ? (
              <Text style={[styles.bodyText, index > 0 && styles.elementGap]}>
                {block.text}
              </Text>
            ) : null}
            {block.type === 'table' ? (
              <LegalTable rows={block.rows} style={index > 0 ? styles.elementGap : undefined} />
            ) : null}
          </Fragment>
        ))}
      </ScrollView>

      {dropdownOpen ? (
        <>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setDropdownOpen(false)}
          />
          <View style={[styles.dropdown, { top: dropdownTop + 8 }]}>
            <Pressable
              onPress={() => setDropdownOpen(false)}
              style={({ pressed }) => pressed && styles.pressed}
              accessibilityRole="button"
            >
              <Text style={[styles.dropdownItem, styles.dropdownItemSelected]}>
                {versionLabel}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  )
}

function LegalTable({ rows, style }: { rows: string[][]; style?: object }) {
  const columnCount = rows[0]?.length ?? 0
  const weights = getColumnWeights(columnCount)
  const isFiveColumnTable = columnCount === 5

  return (
    <View style={[styles.tableWrap, style]}>
      {rows.map((row, rowIndex) => (
        <View style={styles.tableRow} key={`${rowIndex}-${row.join('-')}`}>
          {row.map((cell, cellIndex) => (
            <View
              style={[
                styles.tableCell,
                isFiveColumnTable ? styles.tableCellCompact : styles.tableCellRegular,
                rowIndex === 0 && styles.tableHeaderCell,
                {
                  flex: weights[cellIndex] ?? 1,
                  alignItems: isFiveColumnTable ? 'center' : 'flex-start',
                },
              ]}
              key={`${cellIndex}-${cell}`}
            >
              <Text
                style={[
                  styles.tableCellText,
                  rowIndex === 0 && styles.tableHeaderText,
                  isFiveColumnTable && styles.tableCellTextCenter,
                ]}
              >
                {cell}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

function parseLegalMarkdown(markdown: string): LegalBlock[] {
  const blocks: LegalBlock[] = []
  const lines = markdown.trim().split('\n')
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    blocks.push({ type: 'paragraph', text: paragraph.join('\n') })
    paragraph = []
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()

    if (!line) {
      flushParagraph()
      continue
    }

    if (line.startsWith('|')) {
      flushParagraph()
      const rows: string[][] = []
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        const tableLine = lines[index].trim()
        const cells = tableLine
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim())
        const isDivider = cells.every((cell) => /^:?-{3,}:?$/.test(cell))
        if (!isDivider) rows.push(cells)
        index += 1
      }
      index -= 1
      if (rows.length > 0) {
        blocks.push({ type: 'table', rows })
      }
      continue
    }

    if (line.startsWith('# ')) {
      flushParagraph()
      continue
    }

    if (line.startsWith('### ')) {
      flushParagraph()
      blocks.push({ type: 'subheading', text: line.replace(/^###\s*/, '') })
      continue
    }

    if (line.startsWith('## ')) {
      flushParagraph()
      blocks.push({ type: 'heading', text: line.replace(/^##\s*/, '') })
      continue
    }

    paragraph.push(line)
  }

  flushParagraph()
  return blocks
}

function getColumnWeights(columnCount: number) {
  if (columnCount === 2) return [110, 243]
  if (columnCount === 3) return [81, 136, 136]
  if (columnCount === 5) return [1, 1, 1, 1, 1]
  return Array.from({ length: columnCount }, () => 1)
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  topBarOuter: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: C.card,
  },
  topBarInner: {
    position: 'relative',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: C.text,
  },
  headerBox: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...Typography.heading3,
    color: Gray[900],
    textAlign: 'left',
  },
  versionRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  versionLabel: {
    ...Typography.body1Medium,
    color: C.textSecondary,
  },
  arrowIcon: {
    width: 24,
    height: 24,
  },
  dropdown: {
    position: 'absolute',
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: C.card,
    shadowColor: C.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownItem: {
    ...Typography.body2Medium,
    color: Gray[400],
  },
  dropdownItemSelected: {
    ...Typography.body2Bold,
    color: C.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  sectionGap: {
    marginTop: 36,
  },
  elementGap: {
    marginTop: 10,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    ...Typography.heading2,
    color: Gray[900],
  },
  subsectionTitle: {
    paddingHorizontal: 20,
    ...Typography.body2Bold,
    color: Gray[900],
  },
  bodyText: {
    paddingHorizontal: 20,
    ...Typography.body2Medium,
    color: Gray[600],
  },
  tableWrap: {
    marginHorizontal: 16,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Gray[300],
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    justifyContent: 'center',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: Gray[300],
    backgroundColor: C.card,
  },
  tableCellRegular: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableCellCompact: {
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  tableHeaderCell: {
    backgroundColor: Gray[50],
  },
  tableCellText: {
    ...Typography.caption1Medium,
    color: Gray[900],
  },
  tableHeaderText: {
    ...Typography.caption1Semibold,
    color: Gray[900],
  },
  tableCellTextCenter: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
})
