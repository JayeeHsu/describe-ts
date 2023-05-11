import * as fs from "fs";
import parse from './parse';
import * as path from "path";
import { expect, it } from 'vitest';

const fixturesDirPath = '__fixtures__/components';

function loadFixtures() {
      return fs.readdirSync(path.resolve(__dirname, fixturesDirPath)).map((filename) => {
            const filepath = path.resolve(__dirname, fixturesDirPath, filename)
            return { filename, filepath };
      })
}

const fixtures = loadFixtures();

it('解析组件', () => {
      fixtures.forEach(fixture => {
            expect(parse(fixture.filepath, {})).toMatchSnapshot();
      })
})