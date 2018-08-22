import createDeco from '../utils/create-deco';

export default (from, to, doc, decos) => {
  let newDecos = decos;
  doc.nodesBetween(from, to, (node, pos) => {
    newDecos =
      node.type === node.type.schema.nodes.hard_break
        ? newDecos.add(doc, [createDeco(pos, 'break')])
        : newDecos;
  });
  return newDecos;
};
