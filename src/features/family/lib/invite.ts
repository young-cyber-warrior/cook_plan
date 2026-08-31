import { shareLink } from '@/lib/link';
import { createToken } from '@/lib/token';

import type { AcceptInviteReason, AcceptInviteResult, FamilyRole } from '../types';

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ACCEPT_INVITE_MESSAGES: Record<AcceptInviteReason, string> = {
  unauthenticated: 'Сначала войди в аккаунт',
  not_found: 'Приглашение не найдено',
  revoked: 'Приглашение отозвано',
  expired: 'Срок приглашения истёк',
  exhausted: 'Приглашение уже использовано',
  already_in_family: 'Ты уже в семье — сначала выйди из текущей',
  network: 'Нет связи с сервером',
};

const ACCEPT_INVITE_REASONS = new Set<string>(Object.keys(ACCEPT_INVITE_MESSAGES));

export const createInviteToken = createToken;

export function inviteLink(token: string): string {
  return shareLink('invite', token);
}

export function acceptInviteMessage(reason: AcceptInviteReason): string {
  return ACCEPT_INVITE_MESSAGES[reason];
}

export function toFamilyRole(value: string | null | undefined): FamilyRole | null {
  return value === 'owner' || value === 'member' ? value : null;
}

export function toAcceptInviteResult(value: unknown): AcceptInviteResult {
  const data = value as { ok?: unknown; family_id?: unknown; reason?: unknown } | null;

  if (data?.ok === true && typeof data.family_id === 'string') {
    return { ok: true, familyId: data.family_id };
  }

  const reason = typeof data?.reason === 'string' ? data.reason : '';
  return { ok: false, reason: ACCEPT_INVITE_REASONS.has(reason) ? (reason as AcceptInviteReason) : 'not_found' };
}
