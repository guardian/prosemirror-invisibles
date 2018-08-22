export default ({ mapping }) => {
  let ranges = [];
  mapping.maps.forEach((stepMap, i) => {
    stepMap.forEach((oldStart, oldEnd, newStart, newEnd) => {
      ranges.push([
        mapping.slice(i + 1).map(newStart),
        mapping.slice(i + 1).map(newEnd)
      ]);
    });
  });
  return ranges;
};
