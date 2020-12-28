import { default as character } from "./character";

export default (predicate = (char: string) => char === " ") =>
  character("space")(predicate);
