import type { Token } from './token.types';

type DepStack = Readonly<symbol[]>;

export class TokenNotProvidedError extends Error {
  depStack: DepStack;

  constructor(depStack: DepStack) {
    const descriptionStack = depStack.map((s) => `"${s.description}"`);
    const failedTokenDescription = descriptionStack[descriptionStack.length - 1];
    super(`Token ${failedTokenDescription} was not provided,
  stack: ${descriptionStack.join(' -> ')}`);
    this.depStack = depStack;
    this.name = 'TokenNotProvidedError';
  }
}

export class CyclicDepError extends Error {
  depStack: DepStack;

  constructor(depStack: DepStack) {
    const descriptionStack = depStack.map((s) => `"${s.description}"`);
    const failedTokenDescription = descriptionStack[descriptionStack.length - 1];

    super(`Cyclic dependency detected for token: ${failedTokenDescription},
  stack: ${descriptionStack.join(' -> ')}`);
    this.depStack = depStack;
    this.name = 'CyclicDepError';
  }
}

export class TokenViolationError extends Error {
  constructor(
    readonly message: string,
    readonly originalToken: Token.AnyInstance,
  ) {
    super(message);
    this.name = 'TokenViolationError';
  }
}
