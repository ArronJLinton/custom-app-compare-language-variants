import { diffWords } from "diff";

export interface WordDiffPart {
  readonly value: string;
  readonly added?: boolean;
  readonly removed?: boolean;
}

export const getWordDiff = (left: string, right: string): WordDiffPart[] => {
  if (!left && !right) {
    return [];
  }
  return diffWords(left, right).map((part) => ({
    value: part.value,
    added: part.added,
    removed: part.removed,
  }));
};
