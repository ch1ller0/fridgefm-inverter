# @fridgefm/inverter
A powerful and tiny IoC library with Typescript-first support. Lets you create _highly scalable modular apps and libraries_.

[![npm package](https://img.shields.io/npm/v/@fridgefm/inverter?style=flat-square)](https://www.npmjs.com/package/@fridgefm/inverter)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@fridgefm/inverter?style=flat-square)](https://bundlephobia.com/package/@fridgefm/inverter)
[![downloads](https://img.shields.io/npm/dt/@fridgefm/inverter?style=flat-square)](https://www.npmjs.com/package/@fridgefm/inverter)
[![open issues](https://img.shields.io/github/issues-raw/ch1ller0/fridgefm-inverter?style=flat-square)](https://github.com/ch1ller0/fridgefm-inverter/issues)

## Key features
- Powerful TS support
- NestJS-similar API
- Does not require `reflect-metadata`
- Static provider declaration and no inconsistency
- Hierarchical containers
- Multi-token support
- Works in Node and browser
- Good unit test coverage

## Installation
```
npm install @fridgefm/inverter --save
```
or
```
yarn add @fridgefm/inverter
```
## Examples
Example usage is shown [here in examples](./examples/). You can start the example app 
```
# cli calculator app
yarn example src/examples/calc-app/
```
```
# basic chat app
yarn example src/examples/chat-app/
```

## Basic features
### Injection types
There are several methods to provide a value for injectables.
1. `useValue`
    ```typescript
    const myProvider = injectable({
        provide: someToken, 
        useValue: { a: 1 }
    })
    ```
1. `useFactory`
    ```typescript
    const myProvider = injectable({
        provide: someToken, 
        useFactory: () => ({ a: 1 })
    })
    ```
    or
    ```typescript
    const myProvider = injectable({
        provide: someToken, 
        useFactory: (num) => num + 10, // type is automatically inferred from the all the tokens your provided depends on
        inject: [numberToken] as const
    })
    ```
    For more examples refer to [container hierarchy]
### Token modifications
Set of modificators that allow you to modify your tokens.
```typescript
import { modifyToken, createToken } from '@fridgefm/inverter'

const baseToken = createToken<number>('num')
const multiToken = modifyToken.multi(baseToken)
const defaultToken = modifyToken.defaultValue(baseToken, 5)
```
1. `defaultValue`
    ```typescript
    const defaultToken = modifyToken(createToken<number>('num'), 5)
    const myProvider = injectable({
        provide: someToken,
        useFactory: (num) => num * 10, // if the token is not registered in the container, you still get the default value for `num`
        inject: [defaultToken] as const
    })
    const finalValue = await container.resolve(someToken) // 50 (it is a result of 5*10)
    ```
1. `multi`
    ```typescript
    const multiNumToken = modifyToken(createToken<number>('num'))
    const myProvider = injectable({
        provide: someToken,
        useFactory: (nums) => nums.reduce((acc, cur) => acc + cur, 0), // here `nums` is a an array of numbers
        inject: [multiNumToken] as const
    })
    const num1Provider = injectable({ provide: multiNumToken, useValue: 15 })
    const num2Provider = injectable({ provide: multiNumToken, useValue: 25 })
    const num3Provider = injectable({ provide: multiNumToken, useValue: 35 })

    const finalValue = await container.resolve(someToken) // 75 (it is a sum of all the multiNums)
    ```
### Container hierarchy and injection scopes
    ```typescript
    const globalContainer = craeteContainer({ providers: [] })
    const childContainer = createChildContainer({ parent: globalContainer, providers: [] })
    ```
1. `singleton`
1. `scoped`
1. `transient`