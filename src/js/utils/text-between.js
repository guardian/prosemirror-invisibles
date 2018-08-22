export default (from, to, doc) => {
  let positions = [];
  doc.nodesBetween(from, to, (node, pos) => {
    if (node.isText) {
      const offset = Math.max(from, pos) - pos;
      positions.push({
        pos: pos + offset,
        text: node.text.slice(offset, to - pos)
      });
    }
  });
  return positions;
};
