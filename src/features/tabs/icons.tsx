import Svg, { Path, Rect } from 'react-native-svg';

import type { IconProps } from '@/features/day-card/components/icons';

const STROKE = 1.8;

export function CalendarIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="2.5"
        stroke={color}
        strokeWidth={STROKE}
      />
      <Path d="M3.5 9.5h17" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M8 3v3M16 3v3" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function BasketIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 10h15l-1.4 8.4a2 2 0 0 1-2 1.6H7.9a2 2 0 0 1-2-1.6L4.5 10Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 10 9.5 3.5M16 10 14.5 3.5M9 13.5v4M15 13.5v4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function GearIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke={color}
        strokeWidth={STROKE}
      />
      <Path
        d="M19.4 13.5a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47V19.4a2 2 0 1 1-4 0v-.09a1.6 1.6 0 0 0-1.05-1.47 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H4.6a2 2 0 1 1 0-4h.09A1.6 1.6 0 0 0 6.16 8.5a1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H10.5a1.6 1.6 0 0 0 .97-1.47V2.6a2 2 0 1 1 4 0v.09c0 .64.38 1.2.97 1.47.61.25 1.31.13 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77v.09c.27.6.83.97 1.47.97h.09a2 2 0 1 1 0 4h-.09a1.6 1.6 0 0 0-1.47.97Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export { BookIcon } from '@/features/day-card/components/icons';
