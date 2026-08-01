import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet as RNStyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';

import { DayPlanCard } from '@/features/day-card/components/day-plan-card';

import { useWeeksContext } from '../context/weeks-context';
import type { Week } from '../types';
import { WeekDots } from './week-dots';

/** A Unistyles style on a Reanimated component is rejected at runtime — plain sheet for the pager. */
const animatable = RNStyleSheet.create({
  pager: { flex: 1 },
});

interface WeekPageProps {
  week: Week;
  width: number;
  /** Vertical drag in progress — the pager must not steal a diagonal continuation of it. */
  onVerticalDrag: (dragging: boolean) => void;
}

/**
 * Memoized page: swiping must not re-render the neighbour weeks — mounting seven
 * DayPlanCards mid-gesture is what makes the pager feel sluggish.
 */
const WeekPage = memo(function WeekPage({ week, width, onVerticalDrag }: WeekPageProps) {
  return (
    <View style={{ width }}>
      <FlatList
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        data={week.days}
        keyExtractor={day => day.id}
        initialNumToRender={4}
        onScrollBeginDrag={() => onVerticalDrag(true)}
        onScrollEndDrag={() => onVerticalDrag(false)}
        renderItem={({ item: day }) => <DayPlanCard day={day} />}
      />
    </View>
  );
});

export function WeekPager() {
  const { weeks, activeIndex, setActiveIndex } = useWeeksContext();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<FlatList<Week>>(null);
  /** Index the pager itself is on — guards the sync effect from re-animating a user swipe. */
  const pagerIndex = useRef(activeIndex);
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const scrollX = useSharedValue(activeIndex * width);

  const onVerticalDrag = useCallback((dragging: boolean) => setSwipeEnabled(!dragging), []);

  useEffect(() => {
    if (pagerIndex.current === activeIndex) return;
    pagerIndex.current = activeIndex;
    pagerRef.current?.scrollToOffset({ offset: activeIndex * width, animated: true });
  }, [activeIndex, width]);

  /** JS-side state (navbar pill, sheet) syncs when the page settles; dots don't wait for it. */
  const settle = useCallback(
    (offset: number) => {
      const index = Math.min(weeks.length - 1, Math.max(0, Math.round(offset / width)));
      if (index === pagerIndex.current) return;
      pagerIndex.current = index;
      setActiveIndex(index);
    },
    [weeks.length, width, setActiveIndex],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: event => {
      scheduleOnRN(settle, event.contentOffset.x);
    },
  });

  return (
    <View style={styles.root}>
      <WeekDots count={weeks.length} scrollX={scrollX} pageWidth={width} onSelect={setActiveIndex} />
      <Animated.FlatList
        ref={pagerRef}
        style={animatable.pager}
        data={weeks}
        keyExtractor={week => week.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={swipeEnabled}
        /* Snap-настройки вместо pagingEnabled: страница прилипает к соседней сразу,
           без инерционного доезда — переход ощущается быстрее. */
        snapToInterval={width}
        snapToAlignment="start"
        disableIntervalMomentum
        decelerationRate="fast"
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <WeekPage week={item as Week} width={width} onVerticalDrag={onVerticalDrag} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  page: {
    flex: 1,
  },
  pageContent: {
    padding: theme.spacing.three,
    gap: theme.spacing.three,
  },
}));
