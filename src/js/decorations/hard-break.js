import createDeco from '../utils/create-deco';

export default (
  predicate = node => node.type === node.type.schema.nodes.hard_break
) => {
  return (from, to, doc, decos) => {
    let newDecos = decos;
    doc.nodesBetween(from, to, (node, pos) => {
      newDecos = predicate(node)
        ? newDecos.add(doc, [createDeco(pos, 'break')])
        : newDecos;
    });
    return newDecos;
  };
};
