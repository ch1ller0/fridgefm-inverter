import type { Token } from './token.types';
import type { TodoAny } from './util.types';

export class ResolverError extends Error {
  depStack: Token<TodoAny>[];

  constructor(depStack: Token<TodoAny>[]) {
    const descriptionStack = depStack.map((s) => s.symbol.description);
    super(
      `Token "${descriptionStack[descriptionStack.length - 1] ?? ''}" is not provided, stack: ${descriptionStack.join(
        ' -> ',
      )}`,
    );
    this.depStack = depStack;
    this.name = 'ResolverError';
  }
}

export class CyclicDepError extends Error {
  depStack: Token<TodoAny>[];

  constructor(depStack: Token<TodoAny>[]) {
    const descriptionStack = depStack.map((s) => s.symbol.description);
    super(`Cyclic dependency for token: ${descriptionStack[0]}, stack: ${descriptionStack.join(' -> ')}`);
    this.depStack = depStack;
    this.name = 'CyclicDepError';
  }
}
