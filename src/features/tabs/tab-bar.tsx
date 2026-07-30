import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useAnimatedTheme } from 'react-native-unistyles/reanimated';

type TabBarIconRenderer = (props: { focused: boolean; color: ColorValue; size: number }) => React.ReactNode;

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.root}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label = typeof options.title === 'string' ? options.title : route.name;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            Haptics.selectionAsync();
            navigation.navigate(route.name);
          }
        };

        return (
          <TabButton
            key={route.key}
            focused={focused}
            label={label}
            renderIcon={options.tabBarIcon as TabBarIconRenderer | undefined}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

function TabButton({
  focused,
  label,
  renderIcon,
  onPress,
}: {
  focused: boolean;
  label: string;
  renderIcon?: TabBarIconRenderer;
  onPress: () => void;
}) {
  const { theme } = useUnistyles();
  const animatedTheme = useAnimatedTheme();
  const color = focused ? theme.colors.accent : theme.colors.textMuted;

  const pillStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: animatedTheme.value.spacing.one,
    right: animatedTheme.value.spacing.one,
    borderRadius: animatedTheme.value.radius.lg,
    backgroundColor: `${animatedTheme.value.colors.accent}26`,
    opacity: withTiming(focused ? 1 : 0, { duration: 160 }),
    transform: [{ scale: withTiming(focused ? 1 : 0.85, { duration: 160 }) }],
  }));

  return (
    <Pressable style={styles.button} onPress={onPress} hitSlop={8}>
      <Animated.View style={pillStyle} />
      <View style={styles.content}>
        {renderIcon?.({ focused, color, size: 22 })}
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingTop: theme.spacing.two,
    paddingBottom: theme.spacing.two + rt.insets.bottom,
    paddingHorizontal: theme.spacing.two,
    ...theme.shadow.card,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.two,
  },
  content: {
    alignItems: 'center',
    gap: theme.spacing.half,
  },
  label: {
    ...theme.typography.caption,
  },
}));
