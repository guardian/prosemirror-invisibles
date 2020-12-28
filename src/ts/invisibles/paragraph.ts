import { Node } from 'prosemirror-model';
import node from './node';

export default (
  predicate = (node: Node) => node.type === node.type.schema.nodes.paragraph
) => node('par', (node, pos) => pos + node.nodeSize - 1)(predicate);
