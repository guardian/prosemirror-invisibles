import { Decoration } from "prosemirror-view";

/**
 * Create a decoration for an invisible char of the given type.
 */
export default (
  pos: number,
  type: string,
  // Mark the decoration as selected.
  markAsSelected = false
): Decoration => {
  const createElement = () => {
    const span = document.createElement("span");
    span.classList.add("invisible");
    span.classList.add(`invisible--${type}`);
    if (markAsSelected) {
      const selectedContainer = document.createElement("span");

      selectedContainer.classList.add("invisible__selected-container");
      span.appendChild(selectedContainer);
      const selectedMarker = document.createElement("span");
      selectedMarker.classList.add("invisible__selected-marker");
      selectedMarker.innerHTML = " ";
      selectedContainer.appendChild(selectedMarker);
    }
    return span;
  };

  return Decoration.widget(pos, createElement, {
    marks: [],
    key: `${type}${markAsSelected ? "-selected" : ""}`,
    type,
    side: 1000, // always render last
  });
};
