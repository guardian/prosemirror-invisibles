import { default as character } from './character';

export default (predicate = char => char === ' ') =>
  character('space')(predicate);
