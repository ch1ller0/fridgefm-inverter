import type { Token } from './token.types';
import type { TodoAny } from './util.types';

export class ResolverError extends Error {
  depStack: Token.Instance<TodoAny>[];

  constructor(message: string, depStack: Token.Instance<TodoAny>[]) {
    const descriptionStack = depStack.map((s) => s.symbol.description);
    super(`${message}, stack: ${descriptionStack.join(' -> ')}`);
    this.depStack = depStack;
    this.name = 'ResolverError';
  }
}

export class TokenViolationError extends Error {
  // token: Token.Instance<TodoAny>;

  constructor(message: string, private readonly originalToken: Token.Instance<TodoAny>) {
    super(message);
    this.name = 'TokenViolationError';
  }
}
