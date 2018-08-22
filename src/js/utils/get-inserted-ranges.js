export default ({ mapping }) => {
  let ranges = [];
  mapping.maps.forEach((stepMap, i) => {
    stepMap.forEach((oldStart, oldEnd, newStart, newEnd) => {
      ranges.push([
        mapping.slice(0, i).map(newStart),
        mapping.slice(0, i).map(newEnd)
      ]);
    });
  });
  return ranges;
};
