import node from './node';

export default (
  predicate = node => node.type === node.type.schema.nodes.hard_break
) => node('break', (_, pos) => pos)(predicate);
