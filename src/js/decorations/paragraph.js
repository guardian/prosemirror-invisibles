import createDeco from '../utils/create-deco';

const par = 'par';

export default (
  predicate = node => node.type === node.type.schema.nodes.paragraph
) => (from, to, doc, decos) => {
  let newDecos = decos;
  doc.nodesBetween(from, to, (node, pos) => {
    if (predicate(node)) {
      const decoPos = pos + node.nodeSize - 1;
      const oldDecos = newDecos.find(
        decoPos,
        decoPos,
        spec => spec.key === par
      );
      newDecos = newDecos.remove(oldDecos).add(doc, [createDeco(decoPos, par)]);
    }
  });
  return newDecos;
};
