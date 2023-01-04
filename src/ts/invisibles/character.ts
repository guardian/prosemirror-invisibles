import textBetween from "../utils/text-between";
import createDeco from "../utils/create-deco";
import AddDecorationsForInvisible, { BuilderTypes } from "../utils/invisible";

export const createInvisibleDecosForCharacter = (
  type: string,
  predicate: (text: string) => boolean
): AddDecorationsForInvisible => ({
  type: BuilderTypes.CHAR,
  createDecorations: (from, to, doc, decos) =>
    textBetween(from, to, doc).reduce(
      (decos1, { pos, text }) =>
        text.split("").reduce(
          (decos2, char, i) =>
            predicate(char)
              ? decos2
                  .remove(decos.find(pos + i, pos + i, (_) => _.type === type))
                  .add(doc, [createDeco(pos + i, type)])
              : decos2,
          decos1
        ),
      decos
    ),
});
