import fs from 'fs/promises';
import path from 'path';
import tsd from 'tsd';

type Diagnostic = {
  message: string;
  severity: string;
  line: string;
  column: string;
};

type TestTypeRes = {
  [key: `suite${number}`]: Diagnostic[] | undefined;
};

const runTypeTest = async (testFile: string): Promise<TestTypeRes> => {
  const testFileContents = await fs.readFile(path.resolve(process.cwd(), testFile), { encoding: 'utf-8' });
  const suiteBounds = testFileContents.split('\n').reduce((acc, cur, index) => {
    if (cur.trim().includes('_test_anchor')) {
      acc.push(index);
    }
    return acc;
  }, [] as number[]);

  const diagnostics = await tsd({
    cwd: process.cwd(),
    testFiles: [testFile],
    typingsFile: testFile, // fake
  });

  return diagnostics
    .filter((x) => x.fileName.includes(testFile))
    .reduce((acc, cur) => {
      const index = suiteBounds.findIndex((s, i) => cur.line > s && cur.line < (suiteBounds[i + 1] || +Infinity));
      const key = `suite${index + 1}`;
      if (!acc[key]) {
        throw new Error('You have a type error out of bounds');
      }
      acc[key].push({
        message: cur.message.split('\n')[0],
        severity: cur.severity,
        line: cur.line,
        column: cur.column,
      });
      return acc;
    }, Object.fromEntries(suiteBounds.map((_, i) => [`suite${i + 1}`, []])));
};

describe('types are sound', () => {
  it('token.type', async () => {
    const res = await runTypeTest('src/__tests__/token.spec-d.ts');
    const { suite1, suite2 } = res;
    console.log(res);

    expect(suite1).toEqual([]);
    expect(suite2.length).toEqual(1);
    expect(suite2[0].message).toEqual("Type '(x: 1) => 1' is not assignable to type 'Fn'.");
  });
});

// (async () => {
//   const diagnostics = await tsd();

//   console.log(diagnostics.length);
//   //=> 2
// })();
