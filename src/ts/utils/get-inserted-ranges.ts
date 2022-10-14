import { EditorState, Transaction } from "prosemirror-state";

type Range = [from: number, to: number];

export default (
  { mapping, selection }: Transaction,
  { selection: oldSelection }: EditorState
): Range[] => {
  // We must invalidate the ranges touched by old and new selections.
  const ranges: Range[] = [
    [selection.from, selection.to],
    [oldSelection.from, oldSelection.to],
  ];

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
