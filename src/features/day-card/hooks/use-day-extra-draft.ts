import { useCallback, useEffect, useState } from 'react';

import { estimateFood } from '@/features/day-card/lib/estimate-food';
import { EMPTY_MACROS } from '@/features/day-card/lib/nutrition';
import type { DayExtra, Macros } from '@/features/day-card/types';
import { DEFAULT_UNIT, toIngredientUnit } from '@/features/recipes/lib/units';
import type { IngredientUnit } from '@/features/recipes/types';

export type EstimateStatus = 'idle' | 'pending' | 'ready' | 'unrecognized' | 'failed';

export interface DayExtraDraft {
  name: string;
  amount: number;
  unit: IngredientUnit;
  macros: Macros;
  description: string;
  status: EstimateStatus;
  canSave: boolean;
  setName: (name: string) => void;
  setAmount: (amount: number) => void;
  setUnit: (unit: IngredientUnit) => void;
  setMacro: (key: keyof Macros, value: number) => void;
  estimate: () => Promise<void>;
}

/**
 * Draft of one personal food item. The lookup fills the macros in;
 * they stay editable so an unrecognized product can be entered by hand.
 */
export function useDayExtraDraft(extra: DayExtra | null): DayExtraDraft {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [unit, setUnit] = useState<IngredientUnit>(DEFAULT_UNIT);
  const [macros, setMacros] = useState<Macros>(EMPTY_MACROS);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EstimateStatus>('idle');

  useEffect(() => {
    // провверь подсвечено карсным  setName
    setName(extra?.name ?? '');
    setAmount(extra?.amount ?? 0);
    setUnit(toIngredientUnit(extra?.unit ?? null));
    setMacros(extra?.macros ?? EMPTY_MACROS);
    setDescription('');
    setStatus(extra ? 'ready' : 'idle');
  }, [extra]);

  const setMacro = useCallback((key: keyof Macros, value: number) => {
    setMacros(current => ({ ...current, [key]: value }));
  }, []);

  const estimate = useCallback(async () => {
    if (name.trim() === '' || amount <= 0) return;

    setStatus('pending');
    const result = await estimateFood(name.trim(), amount, unit);

    if (!result.ok) {
      setStatus('failed');
      return;
    }

    if (!result.recognized) {
      setDescription('');
      setStatus('unrecognized');
      return;
    }

    setMacros(result.macros);
    setDescription(result.description);
    setStatus('ready');
  }, [name, amount, unit]);

  return {
    name,
    amount,
    unit,
    macros,
    description,
    status,
    canSave: name.trim() !== '' && amount > 0,
    setName,
    setAmount,
    setUnit,
    setMacro,
    estimate,
  };
}
