import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface IconProps {
  color: ColorValue;
  size: number;
}

const STROKE = 1.8;

export function TrashIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M10 4h4M9 7l.7 12.1a1 1 0 0 0 1 .9h2.6a1 1 0 0 0 1-.9L15 7"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.5 10.5v6M13.5 10.5v6"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PencilIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.9 3.6a2.1 2.1 0 0 1 3 3L8.4 18.1 4 19.5l1.4-4.4L16.9 3.6Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M15 5.5l3.5 3.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5.5v13M5.5 12h13"
        stroke={color}
        strokeWidth={STROKE + 0.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BookIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 6.5C9.5 5 5.5 5 3.5 6v12c2-1 6-1 8.5.5C14.5 17 18.5 17 20.5 18V6c-2-1-6-1-8.5.5Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 6.5V19" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 5.5l6.5 6.5-6.5 6.5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5l4.5 4.5L19 7"
        stroke={color}
        strokeWidth={STROKE + 0.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
