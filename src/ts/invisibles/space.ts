import { default as character } from "./character";
import AddDecorationsForInvisible from "../utils/invisible";

// The defaultPredicate may well be redundant in these functions.
// We may not indeed need a default value as each function discretely deals with their specific node/character
type PredicateFunction = (char: string) => boolean;
const defaultPredicate: PredicateFunction = (char: string) => char === " ";
const space = (predicate: PredicateFunction = defaultPredicate): AddDecorationsForInvisible => character("space")(predicate);
export { space as default }
