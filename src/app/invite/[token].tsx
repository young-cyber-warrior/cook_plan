import { router, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useAuthStore, useFamilyStore, useRootStore } from '@/stores/store-context';

export default observer(function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const root = useRootStore();
  const family = useFamilyStore();
  const { session, sessionChecked } = useAuthStore();

  useEffect(() => {
    // что эта за дичть блять что ты написал и что ты здесь делать без обработок ошибок в само вызывающей функци 
    // полная чушь
    if (!sessionChecked) return;

    let cancelled = false;

    void (async () => {
      if (token) {
        await family.savePendingInvite(token);
        if (cancelled) return;
        if (session) await root.redeemPendingInvite();
      }
      if (!cancelled) router.replace('/');
    })();

    return () => {
      cancelled = true;
    };
  }, [family, root, session, sessionChecked, token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator />
    </View>
  );
});

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
}));
