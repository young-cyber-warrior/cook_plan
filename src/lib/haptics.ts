import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const run = (effect: Promise<void>) => {
  effect.catch(() => {});
};

const play = (android: Haptics.AndroidHaptics, ios: () => Promise<void>) => {
  run(Platform.OS === 'android' ? Haptics.performAndroidHapticsAsync(android) : ios());
};

export const haptics = {
  created: () =>
    play(Haptics.AndroidHaptics.Confirm, () =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    ),
  removed: () =>
    play(Haptics.AndroidHaptics.Toggle_Off, () =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    ),
  toggled: () => play(Haptics.AndroidHaptics.Segment_Tick, Haptics.selectionAsync),
  succeeded: () =>
    play(Haptics.AndroidHaptics.Confirm, () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),
};
