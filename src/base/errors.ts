import type { Token } from './token.types';
import type { TodoAny } from './util.types';

export class TokenNotProvidedError extends Error {
  depStack: Readonly<symbol[]>;

  constructor(depStack: symbol[]) {
    const descriptionStack = depStack.map((s) => `"${s.description}"`);
    const failedTokenDescription = descriptionStack.at(descriptionStack.length - 1);
    super(`Token ${failedTokenDescription} was not provided,
  stack: ${descriptionStack.join(' -> ')}`);
    this.depStack = depStack;
    this.name = 'TokenNotProvidedError';
  }
}

export class CyclicDepError extends Error {
  depStack: Readonly<symbol[]>;

  constructor(depStack: symbol[]) {
    const descriptionStack = depStack.map((s) => `"${s.description}"`);
    const failedTokenDescription = descriptionStack.at(descriptionStack.length - 1);

    super(`Cyclic dependency detected for token: ${failedTokenDescription},
  stack: ${descriptionStack.join(' -> ')}`);
    this.depStack = depStack;
    this.name = 'CyclicDepError';
  }
}

export class TokenViolationError extends Error {
  constructor(readonly message: string, readonly originalToken: Token.Instance<TodoAny>) {
    super(message);
    this.name = 'TokenViolationError';
  }
}
