// import { modifyToken } from '../../index'; // di entry

// const ROOT_TOKEN = createToken<() => [number, number, number]>('root');

describe('module-declaration', () => {
  describe('base mechanics', () => {
    it.todo('modules declare self providers');
    it.todo('dynamic modules via forRootFn');
    it.todo('import providers resolve first');
    it.todo('import providers do not resolve if resolved earlier');
  });

  describe('order specific mechanics', () => {
    it.todo('first registered module is shadowed by next providers');
    it.todo('first registered module is shadowed by next modules providers');
  });
});
