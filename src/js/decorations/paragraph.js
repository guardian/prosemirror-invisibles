import createDeco from '../utils/create-deco';

export default (
  predicate = node => node.type === node.type.schema.nodes.paragraph
) => (from, to, doc, decos) => {
  let newDecos = decos;
  doc.nodesBetween(from, to, (node, pos) => {
    newDecos = predicate(node)
      ? newDecos.add(doc, [createDeco(pos + node.nodeSize - 1, 'par')])
      : newDecos;
  });
  return newDecos;
};
