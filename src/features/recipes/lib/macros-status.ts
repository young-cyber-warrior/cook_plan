import type { MacrosStatus } from '@/features/recipes/types';
// я уже нескольок раз вижу вот эти статусы обьедеи и вынеси в одно если есть смысл 
const STATUSES: readonly MacrosStatus[] = ['idle', 'pending', 'ready', 'partial', 'failed'];

export const toMacrosStatus = (value: string | null | undefined): MacrosStatus =>
  STATUSES.find(status => status === value) ?? 'idle';
