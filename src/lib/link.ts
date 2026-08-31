export type LinkTarget = 'invite' | 'recipe';

export function shareLink(target: LinkTarget, token: string): string {
  return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/link/${target}/${token}`;
}
