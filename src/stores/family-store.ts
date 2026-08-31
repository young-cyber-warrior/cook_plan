import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { makeAutoObservable, runInAction } from 'mobx';
import { Share } from 'react-native';

import {
  acceptInviteMessage,
  createInviteToken,
  INVITE_TTL_MS,
  inviteLink,
  toAcceptInviteResult,
  toFamilyRole,
} from '@/features/family/lib/invite';
import type {
  AcceptInviteResult,
  Family,
  FamilyInvite,
  FamilyMember,
  FamilyRole,
} from '@/features/family/types';
import type { Scope } from '@/lib/scope';
import { supabase } from '@/lib/supabase';
import { powersync } from '@/sync/database';
import type { FamilyMemberRow, FamilyRow, InviteRow } from '@/sync/schema';
import { nowIso } from '@/sync/write';

import type { RootStore } from './root-store';

const PENDING_INVITE_KEY = 'family.pendingInvite';
// адаптируй текущий класс к тому как напсианы все соталянеы сторы (обработка ошибок/логи/проивзодительность и потимизация/лишине методы )
export class FamilyStore {
  familyRows: FamilyRow[] = [];
  memberRows: FamilyMemberRow[] = [];
  inviteRows: InviteRow[] = [];

  constructor(private root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  startWatching(scope: Scope) {
    powersync.watch(
      'select * from families where deleted = 0',
      [],
      {
        onResult: results =>
          runInAction(() => {
            this.familyRows = results.array as FamilyRow[];
          }),
        onError: cause => this.root.errors.notify('family.watch', cause),
      },
      { signal: scope.signal },
    );

    powersync.watch(
      'select * from family_members where deleted = 0 order by created_at',
      [],
      {
        onResult: results =>
          runInAction(() => {
            this.memberRows = results.array as FamilyMemberRow[];
          }),
        onError: cause => this.root.errors.notify('family.members.watch', cause),
      },
      { signal: scope.signal },
    );

    powersync.watch(
      'select * from invites where deleted = 0 and revoked = 0 order by created_at desc',
      [],
      {
        onResult: results =>
          runInAction(() => {
            this.inviteRows = results.array as InviteRow[];
          }),
        onError: cause => this.root.errors.notify('family.invites.watch', cause),
      },
      { signal: scope.signal },
    );
  }

  private get myMemberRow(): FamilyMemberRow | null {
    const userId = this.root.auth.userId;
    return this.memberRows.find(row => row.user_id === userId) ?? null;
  }

  get myRole(): FamilyRole | null {
    return toFamilyRole(this.myMemberRow?.role);
  }

  get family(): Family | null {
    const familyId = this.myMemberRow?.family_id;
    const row = this.familyRows.find(item => item.id === familyId);
    if (!row) return null;
    return { id: row.id, name: row.name ?? '', isOwner: this.myRole === 'owner' };
  }

  get members(): FamilyMember[] {
    const userId = this.root.auth.userId;
    return this.memberRows
      .map(row => ({
        id: row.id,
        userId: row.user_id ?? '',
        role: toFamilyRole(row.role) ?? 'member',
        isMe: row.user_id === userId,
      }))
      .sort((a, b) => Number(b.role === 'owner') - Number(a.role === 'owner'));
  }
  
  get invites(): FamilyInvite[] {
    return this.inviteRows.map(row => ({
      id: row.id,
      token: row.token ?? '',
      link: inviteLink(row.token ?? ''),
      expiresAt: row.expires_at ?? '',
      uses: row.uses ?? 0,
      maxUses: row.max_uses,
    }));
  }

  createFamily(name: string) {
    const userId = this.root.auth.userId;
    if (!userId || this.family) return;

    const familyId = randomUUID();
    const now = nowIso();

    this.root.write(
      'family.createFamily',
      () =>
        powersync.writeTransaction(async tx => {
          await tx.execute(
            'insert into families (id, owner_id, name, deleted, created_at) values (?, ?, ?, 0, ?)',
            [familyId, userId, name.trim(), now],
          );
          await tx.execute(
            'insert into family_members (id, owner_id, family_id, user_id, role, deleted, created_at) values (?, ?, ?, ?, ?, 0, ?)',
            [randomUUID(), userId, familyId, userId, 'owner', now],
          );
        }),
      { familyId },
    );
  }

  private createInvite(): string | null {
    const userId = this.root.auth.userId;
    const family = this.family;
    if (!userId || !family?.isOwner) return null;

    const id = randomUUID();
    const token = createInviteToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

    this.root.write(
      'family.createInvite',
      () =>
        powersync.execute(
          'insert into invites (id, owner_id, family_id, token, expires_at, max_uses, uses, revoked, deleted, created_at) values (?, ?, ?, ?, ?, null, 0, 0, 0, ?)',
          [id, userId, family.id, token, expiresAt, nowIso()],
        ),
      { id },
    );

    return token;
  }

  async shareInvite() {
    const token = this.createInvite();
    if (!token) return;

    try {
      await Share.share({ message: inviteLink(token) });
    } catch (cause) {
      this.root.errors.notify('family.shareInvite', cause);
    }
  }

  shareExistingInvite(link: string) {
    this.root.write('family.shareExistingInvite', () => Share.share({ message: link }));
  }

  revokeInvite(id: string) {
    this.root.write(
      'family.revokeInvite',
      () => powersync.execute('update invites set revoked = 1 where id = ?', [id]),
      { id },
    );
  }

  removeMember(id: string) {
    this.root.write(
      'family.removeMember',
      () => powersync.execute('update family_members set deleted = 1 where id = ?', [id]),
      { id },
    );
  }

  leaveFamily() {
    const row = this.myMemberRow;
    if (!row) return;

    this.root.write(
      'family.leaveFamily',
      () => powersync.execute('update family_members set deleted = 1 where id = ?', [row.id]),
      { id: row.id },
    );
  }

  async acceptInvite(token: string): Promise<AcceptInviteResult> {
    try {
      const { data, error } = await supabase.rpc('accept_invite', { p_token: token });
      if (error) throw error;
      return toAcceptInviteResult(data);
    } catch (cause) {
      console.error('family.acceptInvite', cause);
      return { ok: false, reason: 'network' };
    }
  }

  savePendingInvite(token: string): Promise<void> {
    return AsyncStorage.setItem(PENDING_INVITE_KEY, token);
  }

  async consumePendingInvite(scope: Scope) {
    const token = await scope.wait(AsyncStorage.getItem(PENDING_INVITE_KEY));
    if (!token) return;

    const result = await scope.wait(this.acceptInvite(token));
    if (!result.ok && result.reason === 'network') return;

    await scope.wait(AsyncStorage.removeItem(PENDING_INVITE_KEY));
    if (!result.ok) {
      this.root.errors.notify('family.acceptInvite', new Error(acceptInviteMessage(result.reason)));
    }
  }
}
