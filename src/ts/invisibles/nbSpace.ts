import { createInvisibleDecosForCharacter } from "./character";

const isNbSpace = (char: string) => char === " ";
export default createInvisibleDecosForCharacter("nb-space", isNbSpace);
