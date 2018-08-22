import { Decoration } from 'prosemirror-view';

export default (pos, type) => {
  const span = document.createElement('span');
  span.classList.add('invisible', `invisible--${type}`);
  return Decoration.widget(pos, span, {
    marks: []
  });
};
