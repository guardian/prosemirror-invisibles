import { Node } from "prosemirror-model";

interface Position {
  pos: number;
  text: string;
}

export default (from: number, to: number, doc: Node): Position[] => {
  const positions: Position[] = [];
  doc.nodesBetween(from, to, (node, pos) => {
    if (node.isText) {
      const offset = Math.max(from, pos) - pos;
      positions.push({
        pos: pos + offset,
        text: node.text?.slice(offset, to - pos) || "",
      });
    }
  });
  return positions;
};
