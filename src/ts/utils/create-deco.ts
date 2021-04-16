import { Decoration } from "prosemirror-view";

export default (pos: number, type: string): Decoration => {
  const createElement = () => {
    const span = document.createElement("span");
    span.classList.add("invisible");
    span.classList.add(`invisible--${type}`);
    return span;
  }
  return Decoration.widget(pos, createElement, {
    marks: [],
    key: type,
  });
};
