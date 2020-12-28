import { default as character } from "./character";
import ToInvisible from "./invisible";

export default (predicate = (char: string) => char === " "): ToInvisible =>
  character("space")(predicate);
