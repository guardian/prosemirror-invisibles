import createDeco from '../utils/create-deco';

export default (from, to, doc, decos) => {
  let newDecos = decos;
  doc.nodesBetween(from, to, (node, pos) => {
    newDecos =
      node.type === node.type.schema.nodes.paragraph
        ? newDecos.add(doc, [createDeco(pos + node.nodeSize - 1, 'par')])
        : newDecos;
  });
  return newDecos;
};
