# @fridgefm/inverter
A powerful and tiny IoC library heavily inspired by [`ditox`](https://github.com/mnasyrov/ditox). Lets you create _highly scalable modular apps and libraries_.

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
Example usage is shown [here in examples](./src/examples/). You can start the example app 
```
# cli calculator app
yarn example src/examples/calc-app/
# or its debug version
yarn example:debug src/examples/calc-app/
```
```
# basic server app
yarn example src/examples/server-app/
# or its debug version
yarn example:debug src/examples/server-app/
```
