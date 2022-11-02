# prosemirror-invisibles
A simple implementation of invisible characters in [ProseMirror](https://prosemirror.net/).

Demo [here.](https://guardian.github.io/prosemirror-invisibles/)

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

## A note on line-break invisibles and selections

At the time of writing, Chrome, Firefox and Safari all provide limited feedback when rendering a selection that includes a line break – the selection and cursor does not change until content after the break is highlighted. Below, you can see there is a selection position that includes the linebreak which is not visible to users:

![No clear indication when we've selected across the paragraph boundary. Taken in Firefox](https://user-images.githubusercontent.com/7767575/196673262-27f8bd5f-ea43-4139-805e-59576d06aaab.gif)

This is problematic for invisible characters that represent line breaks (paragraphs, soft returns, etc.) – we must include line break invisibles when they're part of a selection, or we risk misleading the user by implying that line breaks are not part of a selection when they are.

Including content in the decorations representing invisible characters introduces problems with layout and cursor behaviour, so at present we fake this by adding an additional span within these decorations when they're part of a selection. We can then add a width to the span, and give it a background colour that's identical to the text selection. This kludge gives us the behaviour we expect:

![Selecting invisibles provides a clear indication when we've selected across the paragraph boundary. Taken in Firefox](https://user-images.githubusercontent.com/7767575/196673269-9f8794a6-91c0-432b-a4c6-ec54a9a12e40.gif)

Adapting this styling may be necessary in your own editor to ensure that the impostor span's colour and size are correct. We recommend removing this styling if this behaviour isn't desirable. Finally, we'd love a better solution to this problem – any suggestions most welcome!

## Running locally 

To run the sandbox locally run: 

```yarn watch```
