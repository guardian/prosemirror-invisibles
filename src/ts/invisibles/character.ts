import textBetween from '../utils/text-between';
import createDeco from '../utils/create-deco';
import ToInvisible from './invisible';

export default (type: string) => (
  predicate: (text: string) => boolean
): ToInvisible => {
  return (from, to, doc, decos) =>
    textBetween(from, to, doc).reduce(
      (decos1, { pos, text }) =>
        text.split('').reduce((decos2, char, i) => {
          return predicate(char)
            ? decos2.add(doc, [createDeco(pos + i, type)])
            : decos2;
        }, decos1),
      decos
    );
};
