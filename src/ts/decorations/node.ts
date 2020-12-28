import createDeco from '../utils/create-deco';

export default (type, toPosition) => predicate => (from, to, doc, decos) => {
  let newDecos = decos;
  doc.nodesBetween(from, to, (node, pos) => {
    if (predicate(node)) {
      const decoPos = toPosition(node, pos);
      const oldDecos = newDecos.find(
        decoPos,
        decoPos,
        spec => spec.key === type
      );
      newDecos = newDecos
        .remove(oldDecos)
        .add(doc, [createDeco(decoPos, type)]);
    }
  });
  return newDecos;
};
