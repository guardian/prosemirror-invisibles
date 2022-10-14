import { TextSelection } from "prosemirror-state";
import { createEditor } from "./helpers";

describe("Invisibles plugin", () => {
  it("should render character invisibles", () => {
    const view = createEditor(`<p>1 2 3 4</p>`);

    const elements = view.dom.querySelectorAll(".invisible--space");

    expect(elements.length).toEqual(3);
  });

  it("should render node invisibles", () => {
    const view = createEditor(`<p>1</p><p>2</p>`);

    const elements = view.dom.querySelectorAll(".invisible--par");

    expect(elements.length).toEqual(2);
  });

  it("should not double render invisibles when changes in the document occur", () => {
    const view = createEditor(`
        <p>1 2 3 4</p>
      `);

    view.dispatch(
      view.state.tr.setSelection(TextSelection.create(view.state.doc, 2, 9))
    );

    const elements = view.dom.querySelectorAll(".invisible--space");

    expect(elements.length).toEqual(3);
  });

  it("should add content to node invisibles when the selection includes the invisible and the next node", () => {
    const view = createEditor(`
      <p>1 2 3 4</p>
      <p>5 6 7 8</p>
    `);
    view.dispatch(
      view.state.tr.setSelection(TextSelection.create(view.state.doc, 2, 13))
    );

    const elements = view.dom.querySelectorAll(".invisible--par");
    const firstParaInvisible = elements.item(0);
    const secondParaInvisible = elements.item(1);

    expect(firstParaInvisible.textContent).toEqual("\u2002");
    expect(secondParaInvisible.textContent).toEqual("");
  });

  it("should remove content from node invisibles when they are no longer included in the selection", () => {
    const view = createEditor(`
      <p>1 2 3 4</p>
      <p>5 6 7 8</p>
    `);
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
});
