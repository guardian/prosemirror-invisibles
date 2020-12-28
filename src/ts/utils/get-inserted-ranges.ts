import { Transaction } from "prosemirror-state";

export default ({ mapping }: Transaction) => {
  let ranges: [from: number, to: number][] = [];
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
