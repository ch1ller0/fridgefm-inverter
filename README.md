# @fridgefm/inverter
A powerful and tiny IoC library with Typescript-first support. Lets you create _highly scalable modular apps and libraries_.

[![npm package](https://img.shields.io/npm/v/@fridgefm/inverter?style=flat-square)](https://www.npmjs.com/package/@fridgefm/inverter)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@fridgefm/inverter?style=flat-square)](https://bundlephobia.com/package/@fridgefm/inverter)
[![downloads](https://img.shields.io/npm/dt/@fridgefm/inverter?style=flat-square)](https://www.npmjs.com/package/@fridgefm/inverter)
[![open issues](https://img.shields.io/github/issues-raw/ch1ller0/fridgefm-inverter?style=flat-square)](https://github.com/ch1ller0/fridgefm-inverter/issues)

## Key features
- Powerful TS support
- NestJS-similar API
- Zero-dependency (even `reflect-metadata`)
- Async auto-resolve providers
- [Hierarchical containerss](#container-hierarchy) and [Injection scopes](#injection-scopes)
- [Multi-token support](#token-modifications)
- Static provider declaration and no inconsistency
- Works in Node and browser

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
First of all, create a token you want to provide
```typescript
const myToken = createToken<{a: number}>('my:token')
```
1. `useValue`\
The most basic method of providing a value is `useValue`. Simply provide a value, which is assignable to `myTokens`'s interface.
    ```typescript
    const myProvider = injectable({
        provide: someToken, 
        useValue: { a: 1 }
    })
    ```
1. `useFactory`\
Sometimes you want to generate a value and save something in the closure.
    ```typescript
    const myProvider = injectable({
        provide: someToken, 
        useFactory: () => {
            // do something here if you want... It will run while constructing the provider
            const a = Date.now()
            return { a }
        }
    })
    ```
    or with depdendencies
    ```typescript
    const myProvider = injectable({
        provide: someToken, 
         // type is automatically inferred from all the tokens your provider depends on
        useFactory: (num, anotherNum) => num + anotherNum + 10,
        inject: [numberToken, anotherNumberToken] as const
    })
    ```
> `useFactory` also has a `scope` field, which you can configure. Refer to [Injection scopes](#injection-scopes) for more info

### Token modifications
Set of modificators that allow you to modify your tokens.
```typescript
import { modifyToken, createToken } from '@fridgefm/inverter'

 // value will be overwritten with the last registered provider, which provides this token
const baseToken = createToken<number>('num')
// value will be injected as an array and each new provider adds to the array
const multiToken = modifyToken.multi(baseToken)
// if token is not provided, it will return default value
const defaultToken = modifyToken.defaultValue(baseToken, 101)
```
1. `defaultValue`
    ```typescript
    const myProvider = injectable({
        provide: someToken,
        useFactory: (num) => num * 10, // if the token is not registered in the container, you still get the default value for `num`
        inject: [defaultToken] as const
    })
    const finalValue = await container.get(someToken) // 1010 (a result of 101*10)
    ```
1. `multi`
    ```typescript
    const myProvider = injectable({
        provide: someToken,
        useFactory: (multiNums) => multiNums.reduce((acc, cur) => acc + cur, 0), // here `multiNums` is a an array of numbers
        inject: [multiToken] as const
    })
    const num1Provider = injectable({ provide: multiToken, useValue: 15 })
    const num2Provider = injectable({ provide: multiToken, useValue: 25 })
    const num3Provider = injectable({ provide: multiToken, useValue: 35 })
    const finalValue = await container.get(someToken) // 75 (it is a sum of all the multiNums)
    ```
### Container hierarchy
It is possible to create child containers and develop hierarchies. Child containers are useful when you have some private information (for example for each request) and `no other containers (including the parent one) have access to it`.

```typescript
const globalContainer = createContainer({ providers: [] })
const childContainer = createChildContainer(rootContainer, {
    providers: [injectable({ provide: PRIVATE_TOKEN, useValue: token })],
}).get(VALUE_THAT_DEPENDS_ON_PRIVATE_TOKEN);
```

### Injection scopes
Imagine we have created a bunch of conatiners and 
```typescript
const container = createContainer({ providers });
const childContainers = [createChildContainer(container), createChildContainer(container)]
const allContainers = [container, ...childContainers]
const provider = injectable({ provide: RANDOM, useFactory: () => randomString(), scope: SCOPE })
const resolveAll = () => Promise.all(allContainers.map((cont) => Promise.all([cont.get(RANDOM), cont.get(RANDOM)])));
```
Now the result of calling `resolveAll` depends on the `SCOPE` variable. There are different variants:

1. `singleton`\
Caches the value globally for the parent and all the chilren
```typescript
const provider = injectable({ provide: RANDOM, useFactory: () => randomString(), scope: 'singleton' })
await resolveAll() 
//  parent           child-1          child-2     
// [5e546e, 5e546e] [5e546e, 5e546e] [5e546e, 5e546e]
```
1. `scoped`\
This is the default\
Caches the result per-container
```typescript
const provider = injectable({ provide: RANDOM, useFactory: () => randomString(), scope: 'scoped' })
await resolveAll() 
//  parent           child-1          child-2     
// [b539d7, b539d7] [02176f, 02176f] [99a3e0, 99a3e0]
```
1. `transient`\
Does not cache at all
```typescript
const provider = injectable({ provide: RANDOM, useFactory: () => randomString(), scope: 'transient' })
await resolveAll() 
//  parent           child-1          child-2     
// [e63742, 59defd] [0abb46, 5cd9a1] [690125, 227e8c]
```