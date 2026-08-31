import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useFamilyStore } from '@/stores/store-context';

import type { FamilyInvite, FamilyMember } from '../types';

const ROLE_LABELS = { owner: 'владелец', member: 'участник' } as const;

const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '';
// разделить на разные файлы компонеты 
export const FamilySection = observer(function FamilySection() {
  const store = useFamilyStore();
  const family = store.family;

  if (!family) return <CreateFamily onCreate={store.createFamily} />;

  const confirmLeave = () =>
    Alert.alert(
      'Выйти из семьи?',
      'Недели, рецепты и списки семьи исчезнут с этого устройства. Твои собственные записи останутся.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: store.leaveFamily },
      ],
    );

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Семья</Text>
      <Text style={styles.title}>{family.name || 'Без названия'}</Text>

      <View style={styles.list}>
        {store.members.map(member => (
          <MemberRow
            key={member.id}
            member={member}
            canRemove={family.isOwner && !member.isMe}
            onRemove={store.removeMember}
          />
        ))}
      </View>
{/* убарть сложнеы ветвелния тернарки неичтаетсья  */}
      {family.isOwner ? (
        <>
          <Pressable style={({ pressed }) => styles.button(pressed)} onPress={store.shareInvite}>
            <Text style={styles.buttonLabel}>Пригласить</Text>
          </Pressable>

          {store.invites.length > 0 ? (
            <View style={styles.list}>
              {store.invites.map(invite => (
                <InviteRow
                  key={invite.id}
                  invite={invite}
                  onShare={store.shareExistingInvite}
                  onRevoke={store.revokeInvite}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      <Pressable style={({ pressed }) => styles.leaveButton(pressed)} onPress={confirmLeave}>
        <Text style={styles.leaveLabel}>Выйти из семьи</Text>
      </Pressable>
    </View>
  );
});
// зачаем observer если ни на что не подписанан 
const CreateFamily = observer(function CreateFamily({
  onCreate,
}: {
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const trimmed = name.trim();

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Семья</Text>
      <Text style={styles.hint}>
        Участники семьи видят твои недели, рецепты и списки покупок и могут их править.
      </Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Название семьи"
        autoCapitalize="sentences"
      />
      <Pressable
        style={({ pressed }) => styles.button(pressed, trimmed.length === 0)}
        disabled={trimmed.length === 0}
        onPress={() => {
          onCreate(trimmed);
          setName('');
        }}
      >
        <Text style={styles.buttonLabel}>Создать семью</Text>
      </Pressable>
    </View>
  );
});

function MemberRow({
  member,
  canRemove,
  onRemove,
}: {
  member: FamilyMember;
  canRemove: boolean;
  onRemove: (id: string) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{member.isMe ? 'Ты' : member.userId.slice(0, 8)}</Text>
        <Text style={styles.rowCaption}>{ROLE_LABELS[member.role]}</Text>
      </View>
      {canRemove ? (
        <Pressable onPress={() => onRemove(member.id)}>
          <Text style={styles.rowAction}>Удалить</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function InviteRow({
  invite,
  onShare,
  onRevoke,
}: {
  invite: FamilyInvite;
  onShare: (link: string) => void;
  onRevoke: (id: string) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>Ссылка до {formatDate(invite.expiresAt)}</Text>
        <Text style={styles.rowCaption}>Переходов: {invite.uses}</Text>
      </View>
      <Pressable onPress={() => onShare(invite.link)}>
        <Text style={styles.rowAction}>Отправить</Text>
      </Pressable>
      <Pressable onPress={() => onRevoke(invite.id)}>
        <Text style={styles.rowAction}>Отозвать</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  section: {
    width: '100%',
    gap: theme.spacing.two,
    padding: theme.spacing.three,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  label: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  hint: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
  },
  input: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    paddingVertical: theme.spacing.two,
    paddingHorizontal: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.backgroundElement,
  },
  list: {
    gap: theme.spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    paddingVertical: theme.spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  rowText: {
    flex: 1,
    gap: theme.spacing.half,
  },
  rowTitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  rowCaption: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
  rowAction: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
  button: (pressed: boolean, disabled = false) => ({
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
  }),
  buttonLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leaveButton: (pressed: boolean) => ({
    alignItems: 'center',
    paddingVertical: theme.spacing.two,
    opacity: pressed ? 0.8 : 1,
  }),
  leaveLabel: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
  },
}));
