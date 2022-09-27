import { createInvisibleDecosForCharacter } from "./character";

const isSpace = (char: string) => char === " ";
export default createInvisibleDecosForCharacter("space", isSpace);
