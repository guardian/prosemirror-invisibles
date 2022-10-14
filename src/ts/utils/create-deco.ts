import { Decoration } from "prosemirror-view";

export default (pos: number, type: string, content = ""): Decoration => {
  const createElement = () => {
    const span = document.createElement("span");
    span.innerHTML = content;
    span.classList.add("invisible");
    span.classList.add(`invisible--${type}`);
    return span;
  };

  return Decoration.widget(pos, createElement, {
    marks: [],
    key: `type-${content}`,
    type,
    side: 1000, // always render last
  });
};
