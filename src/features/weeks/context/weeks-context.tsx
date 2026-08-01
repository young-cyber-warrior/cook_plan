import * as Haptics from 'expo-haptics';
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { buildWeek, initialWeeks, resizeWeek } from '../lib/build-week';
import type { Week, WeekRange } from '../types';

/** `weekId: null` — creating a new week; string — editing that week's dates. */
interface EditingState {
  weekId: string | null;
}

interface WeeksContextValue {
  weeks: Week[];
  activeIndex: number;
  sheetVisible: boolean;
  editing: EditingState | null;
  /** False once a single week is left — it can never be removed. */
  canRemove: boolean;
  setActiveIndex: (index: number) => void;
  openSheet: () => void;
  closeSheet: () => void;
  startAdd: () => void;
  startEdit: (weekId: string) => void;
  cancelEdit: () => void;
  saveWeek: (range: WeekRange) => void;
  removeWeek: (weekId: string) => void;
}

const WeeksContext = createContext<WeeksContextValue | null>(null);

/**
 * Lives at the app root for the same reason as AddRecipeProvider: the trigger (Navbar pill)
 * renders above the tab Stack while the pager and the sheet live inside the Days screen.
 */
export function WeeksProvider({ children }: PropsWithChildren) {
  const [weeks, setWeeks] = useState<Week[]>(initialWeeks);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<EditingState | null>(null);

  const value = useMemo<WeeksContextValue>(() => {
    const closeSheet = () => {
      setSheetVisible(false);
      setEditing(null);
    };

    return {
      weeks,
      activeIndex,
      sheetVisible,
      editing,
      canRemove: weeks.length > 1,
      setActiveIndex,
      openSheet: () => setSheetVisible(true),
      closeSheet,
      startAdd: () => setEditing({ weekId: null }),
      startEdit: weekId => setEditing({ weekId }),
      cancelEdit: () => setEditing(null),

      saveWeek: range => {
        const saved = editing?.weekId
          ? resizeWeek(weeks.find(week => week.id === editing.weekId)!, range)
          : buildWeek(range);

        if (!editing?.weekId) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const next = [...weeks.filter(week => week.id !== saved.id), saved].sort((a, b) =>
          a.start.localeCompare(b.start),
        );
        setWeeks(next);
        setActiveIndex(next.findIndex(week => week.id === saved.id));
        closeSheet();
      },

      removeWeek: weekId => {
        if (weeks.length <= 1) return;
        const next = weeks.filter(week => week.id !== weekId);
        setWeeks(next);
        setActiveIndex(current => Math.min(current, next.length - 1));
      },
    };
  }, [weeks, activeIndex, sheetVisible, editing]);

  return <WeeksContext.Provider value={value}>{children}</WeeksContext.Provider>;
}

export function useWeeksContext(): WeeksContextValue {
  const context = useContext(WeeksContext);
  if (!context) throw new Error('useWeeksContext must be used within WeeksProvider');
  return context;
}
