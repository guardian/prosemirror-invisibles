# prosemirror-invisibles
A simple implementation of invisible characters in [ProseMirror](https://prosemirror.net/).

---

## Install
`npm install @guardian/prosemirror-invisibles`

## Usage
Add the plugin to the state and pass the invisibles you would like to display in the document.
```javascript
import invisibles, { space, hardBreak, paragraph } from 'prosemirror-invisibles';

new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    doc: DOMParser.fromSchema(mySchema).parse(
      document.querySelector("#content")
    ),
    plugins: [
      invisibles([space(), hardBreak(), paragraph()])
    ]
  })
});
```

And import the css from `prosemirror-invisibles/dist/invisibles.css`.
