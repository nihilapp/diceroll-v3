export type ComparisonOperator = '=' | '>' | '>=' | '<' | '<=';

export type ComparisonPredicate = {
  op: ComparisonOperator;
  value: number;
};

export type DiceModifierSpec
  = | {
    kind: 'keepHighest';
    count: number;
  }
  | {
    kind: 'keepLowest';
    count: number;
  }
  | {
    kind: 'dropHighest';
    count: number;
  }
  | {
    kind: 'dropLowest';
    count: number;
  }
  | {
    kind: 'rerollOnce';
    predicate: ComparisonPredicate;
    source: 'fvtt-r';
  }
  | {
    kind: 'rerollRecursive';
    predicate: ComparisonPredicate;
    source: 'fvtt-rr';
  }
  | {
    kind: 'explode';
    predicate?: ComparisonPredicate;
    source: 'bang' | 'fvtt-x';
  }
  | {
    kind: 'explodeOnce';
    predicate?: ComparisonPredicate;
    source: 'fvtt-xo';
  }
  | {
    kind: 'compound';
    predicate?: ComparisonPredicate;
    source: 'bang-bang';
  }
  | {
    kind: 'countSuccess';
    predicate: ComparisonPredicate;
  }
  | {
    kind: 'countFailure';
    predicate: ComparisonPredicate;
  }
  | {
    kind: 'deductFailures';
    predicate: ComparisonPredicate;
  }
  | {
    kind: 'subtractFailureFaces';
    predicate: ComparisonPredicate;
  }
  | {
    kind: 'marginSuccess';
    predicate: ComparisonPredicate;
  }
  | {
    kind: 'minimum';
    value: number;
  }
  | {
    kind: 'maximum';
    value: number;
  }
  | {
    kind: 'countEven';
  }
  | {
    kind: 'countOdd';
  };

export type DiceTermSpec = {
  notation: string;
  count: number;
  sides: number;
  modifiers: DiceModifierSpec[];
};
