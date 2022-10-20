import { AllSelection, TextSelection } from "prosemirror-state";
import { br, doc, p } from "prosemirror-test-builder";

import { createEditor } from "./helpers";

describe("Invisibles plugin", () => {
  it("should render character invisibles", () => {
    const view = createEditor(doc(p("1 2 3 4")));

    const elements = view.dom.querySelectorAll(".invisible--space");

    expect(elements.length).toEqual(3);
  });

  it("should render node invisibles", () => {
    const view = createEditor(doc(p("1"), p("2")));

    const elements = view.dom.querySelectorAll(".invisible--par");

    expect(elements.length).toEqual(2);
  });

  it("should not double render invisibles when the selection changes", () => {
    const view = createEditor(doc(p("1 2 3 4")));

    view.dispatch(
      view.state.tr.setSelection(TextSelection.create(view.state.doc, 2, 9))
    );

    const elements = view.dom.querySelectorAll(".invisible--space");

    expect(elements.length).toEqual(3);
  });

  it("should add node and character decorations when content is added", () => {
    const docNode = doc(p("1 2 3 4"));
    const view = createEditor(docNode);

    view.dispatch(view.state.tr.insert(docNode.nodeSize - 2, p("5, 6, 7, 8")));

    const charElements = view.dom.querySelectorAll(".invisible--space");
    expect(charElements.length).toEqual(6);

    const nodeElements = view.dom.querySelectorAll(".invisible--par");
    expect(nodeElements.length).toEqual(2);
  });

  it("should add content to node invisibles when the selection includes the invisible and the next node", () => {
    const view = createEditor(doc(p("1 2 3 4"), p("5 6 7 8")));
    view.dispatch(
      view.state.tr.setSelection(TextSelection.create(view.state.doc, 2, 13))
    );

    const elements = view.dom.querySelectorAll(".invisible--par");
    const firstParaInvisible = elements.item(0);
    const secondParaInvisible = elements.item(1);

    expect(firstParaInvisible.children.length).toEqual(1);
    expect(secondParaInvisible.children.length).toEqual(0);
  });

  it("should remove content from node invisibles when they are no longer included in the selection", () => {
    const view = createEditor(doc(p("1 2 3 4"), p("5 6 7 8")));
    view.dispatch(
      view.state.tr.setSelection(TextSelection.create(view.state.doc, 2, 13))
    );
    view.dispatch(
      view.state.tr.setSelection(TextSelection.create(view.state.doc, 2, 2))
    );

    const elements = view.dom.querySelectorAll(".invisible--par");
    const firstParaInvisible = elements.item(0);
    const secondParaInvisible = elements.item(1);

    expect(firstParaInvisible.textContent).toEqual("");
    expect(secondParaInvisible.textContent).toEqual("");
  });

  it("should continue to render decorations as selection passes over them", () => {
    const docNode = doc(p("1 2 3 4", br(), br(), p("5 6 7 8")));
    const view = createEditor(docNode);

    // This collapsed selection shifts left each iteration, to
    // catch a bug where selections caused node decos to disappear.
    for (let curPos = docNode.nodeSize - 2; curPos > 0; curPos--) {
      view.dispatch(
        view.state.tr.setSelection(TextSelection.create(view.state.doc, curPos, curPos))
      );

      const elements = view.dom.querySelectorAll(".invisible--break");
      expect(elements.length).toBe(2);
    }
  });

  it("should correctly handle selections which reduce the document size", () => {
    const docNode = doc(p("1 2 3 4", br(), br(), p("5 6 7 8")));
    const view = createEditor(docNode);

    const removeDoc = () => view.dispatch(
      view.state.tr.setSelection(new AllSelection(view.state.doc)).deleteSelection()
    );

    expect(removeDoc).not.toThrow();
  });
});
