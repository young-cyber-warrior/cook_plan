export type FamilyRole = 'owner' | 'member';

export interface Family {
  id: string;
  name: string;
  isOwner: boolean;
}

export interface FamilyMember {
  id: string;
  userId: string;
  role: FamilyRole;
  isMe: boolean;
}

export interface FamilyInvite {
  id: string;
  token: string;
  link: string;
  expiresAt: string;
  uses: number;
  maxUses: number | null;
}

export type AcceptInviteReason =
  | 'unauthenticated'
  | 'not_found'
  | 'revoked'
  | 'expired'
  | 'exhausted'
  | 'already_in_family'
  | 'network';

export type AcceptInviteResult =
  | { ok: true; familyId: string }
  | { ok: false; reason: AcceptInviteReason };
