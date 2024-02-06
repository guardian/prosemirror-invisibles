import { createInvisibleDecosForCharacter } from "./character";

const isSoftHyphen = (char: string) => char === "\u00ad";
export default createInvisibleDecosForCharacter("soft-hyphen", isSoftHyphen);
