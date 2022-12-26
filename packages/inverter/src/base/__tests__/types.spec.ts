import fs from 'fs/promises';
import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
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
  const relPath = path.resolve(__dirname, testFile).replace(`${process.cwd()}/`, '');
  const absPath = path.resolve(process.cwd(), relPath);
  const testFileContents = await fs.readFile(absPath, { encoding: 'utf-8' });
  const suiteBounds = testFileContents.split('\n').reduce((acc, cur, index) => {
    if (cur.trim().includes('_test_anchor')) {
      acc.push(index);
    }
    return acc;
  }, [] as number[]);

  const diagnostics = await tsd({
    cwd: process.cwd(),
    testFiles: [relPath],
    typingsFile: relPath, // fake
  });

  return diagnostics
    .filter((x) => x.fileName.includes(relPath))
    .reduce((acc, cur) => {
      const index = suiteBounds.findIndex((s, i) => cur.line > s && cur.line < (suiteBounds[i + 1] || +Infinity));
      const key = `suite${index + 1}`;
      if (!acc[key]) {
        throw new Error(
          `You have a type error out of bounds, please sync tests with typings in: ${cur.fileName}:${cur.line}:${cur.column}`,
        );
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
    const res = await runTypeTest('./token.spec-d.ts');
    expect(res).toEqual({
      suite1: [],
      suite2: [
        expect.objectContaining({
          message: "Type '(x: 1) => 1' is not assignable to type 'Fn'.",
        }),
      ],
    });
  });
});
