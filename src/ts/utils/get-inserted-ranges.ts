import { Transaction } from "prosemirror-state";

export type Range = [from: number, to: number];

export default ({ mapping }: Transaction): Range[] => {
  // We must invalidate the ranges touched by old and new selections.
  const ranges: Range[] = [];

  mapping.maps.forEach((stepMap, i) => {
    stepMap.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
      ranges.push([
        mapping.slice(i + 1).map(newStart),
        mapping.slice(i + 1).map(newEnd),
      ]);
    });
  });

  return ranges;
};
