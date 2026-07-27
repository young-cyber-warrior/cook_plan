import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface MacroBadgeProps {
  value: string;
  /** Trailing unit, rendered muted. */
  unit?: string;
}

export function MacroBadge({ value, unit }: MacroBadgeProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.value} numberOfLines={1}>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    paddingHorizontal: theme.spacing.two,
    paddingVertical: theme.spacing.half,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.success,
  },
  value: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: '#FFFFFF',
  },
  unit: {
    ...theme.typography.caption,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
}));
