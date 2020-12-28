import { Decoration } from "prosemirror-view";

export default (pos: number, type: string): Decoration => {
  const span = document.createElement("span");
  span.classList.add("invisible");
  span.classList.add(`invisible--${type}`);
  return Decoration.widget(pos, span, {
    marks: [],
    key: type,
  });
};
