import { Image } from 'expo-image'

const warningSource = require('../../../../assets/icons/search/warning.png')

type Props = {
  size?: number
}

export function SearchWarningIcon({ size = 120 }: Props) {
  return (
    <Image
      source={warningSource}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  )
}
