import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

import { createPropFilter } from './createPropFilter';

export interface IStringIndexedObject<T> {
      [key: string]: T;
}

export interface IPropItemType {
      name: string;
      value?: any;
      raw?: string;
}

export interface IPropItem {
      name: string;
      required: boolean;
      type: IPropItemType;
      description: string;
      defaultValue: any;
      tags: Record<string, any>
}

export interface IPropsInfo extends IStringIndexedObject<IPropItem> { }

export interface IMethodParameter {
      name: string;
      description?: string | null;
      type: IMethodParameterType;
}

export interface IMethodParameterType {
      name: string;
}

export interface IMethod {
      name: string;
      docblock: string;
      modifiers: string[];
      params: IMethodParameter[];
      returns?: {
            description?: string | null;
            type?: string;
      } | null;
      description: string;
}

export interface IComponentDoc {
      exportName: string;
      description: string;
      props: Props;
      methods: IMethod[];
      block?: [number, number];
      tags: Record<string, any>
}


export interface IComponent {
      name: string;
}

export interface IPropItemType {
      name: string;
      value?: any;
      raw?: string;
}

export interface StaticPropFilter {
      skipPropsWithName?: string[] | string;
      skipPropsWithoutDoc?: boolean;
}

export type PropFilter = (props: IPropItem, component: IComponent) => boolean;

export interface ParserOptions {
      propFilter?: StaticPropFilter | PropFilter;
      shouldExtractLiteralValuesFromEnum?: boolean;
}

export const defaultParserOpts: ParserOptions = {};

export interface FileParser {
      parse(filePathOrPaths: string | string[]): IComponentDoc[];
      parseWithProgramProvider(filePathOrPaths: string | string[], programProvider?: () => ts.Program): IComponentDoc[];
}

const defaultOptions: ts.CompilerOptions = {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.Latest,
};

/**
 * Parses a file with default TS options
 * @param filePath component file that should be parsed
 */
export function parse(filePathOrPaths: string | string[], parserOpts: ParserOptions = defaultParserOpts) {
      return withCompilerOptions(defaultOptions, parserOpts).parse(filePathOrPaths);
}

/**
 * Constructs a parser for a default configuration.
 */
export function withDefaultConfig(parserOpts: ParserOptions = defaultParserOpts): FileParser {
      return withCompilerOptions(defaultOptions, parserOpts);
}

/**
 * Constructs a parser for a specified tsconfig file.
 */
export function withCustomConfig(tsconfigPath: string, parserOpts: ParserOptions): FileParser {
      const basePath = path.dirname(tsconfigPath);
      const { config, error } = ts.readConfigFile(tsconfigPath, (filename) => fs.readFileSync(filename, 'utf8'));

      if (error !== undefined) {
            // tslint:disable-next-line: max-line-length
            const errorText = `Cannot load custom tsconfig.json from provided path: ${tsconfigPath}, with error code: ${error.code}, message: ${error.messageText}`;
            throw new Error(errorText);
      }

      const { options, errors } = ts.parseJsonConfigFileContent(config, ts.sys, basePath, {}, tsconfigPath);

      if (errors && errors.length) {
            throw errors[0];
      }

      return withCompilerOptions(options, parserOpts);
}

/**
 * Constructs a parser for a specified set of TS compiler options.
 */
export function withCompilerOptions(
      compilerOptions: ts.CompilerOptions,
      parserOpts: ParserOptions = defaultParserOpts,
): FileParser {
      return {
            parse(filePathOrPaths: string | string[]): IComponentDoc[] {
                  return parseWithProgramProvider(filePathOrPaths, compilerOptions, parserOpts);
            },
            parseWithProgramProvider(filePathOrPaths, programProvider) {
                  return parseWithProgramProvider(filePathOrPaths, compilerOptions, parserOpts, programProvider);
            },
      };
}

function parseWithProgramProvider(
      filePathOrPaths: string | string[],
      compilerOptions: ts.CompilerOptions,
      parserOpts: ParserOptions,
      programProvider?: () => ts.Program
): IComponentDoc[] {
      const filePaths = Array.isArray(filePathOrPaths) ? filePathOrPaths : [filePathOrPaths];

      const program = programProvider ? programProvider() : ts.createProgram(filePaths, compilerOptions);

      const parser = new Parser(program, parserOpts);

      const checker = program.getTypeChecker();

      return filePaths
            .map((filePath) => program.getSourceFile(filePath))
            .filter((sourceFile): sourceFile is ts.SourceFile => typeof sourceFile !== 'undefined')
            .flatMap((sourceFile) => {
                  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);

                  if (!moduleSymbol) {
                        return [];
                  }

                  return checker.getExportsOfModule(moduleSymbol)
                        .map((_export) => parser.getComponentDoc(_export))
                        .filter((componentDoc): componentDoc is IComponentDoc => componentDoc !== null)
                        .filter((componentDoc, index, componentDocs) => {
                              // 因为如果从不同的文件重新导出，getExportsOfModule函数可以返回重复的导出。
                              // 通过过滤掉重复项，我们确保每个组件在docs数组中只包含一次。
                              componentDocs.slice(index + 1).every((innerComponentsDoc) => innerComponentsDoc.exportName !== componentDoc!.exportName)
                        })
            })
}

interface IJSDoc {
      description: string;
      fullComment: string;
      tags: IStringIndexedObject<string>;
}

const defaultDoc: IJSDoc = {
      description: '',
      fullComment: '',
      tags: {}
}

export class Parser {
      private checker: ts.TypeChecker; // 类型检查器，可用于对程序中的源文件进行语义分析
      private propFilter: PropFilter;
      private shouldExtractLiteralValuesFromEnum: boolean;

      constructor(program: ts.Program, opts: ParserOptions) {
            const { shouldExtractLiteralValuesFromEnum } = opts;
            this.checker = program.getTypeChecker();
            this.propFilter = createPropFilter(opts);
            this.shouldExtractLiteralValuesFromEnum = Boolean(shouldExtractLiteralValuesFromEnum);
      }

      public getComponentDoc(_export: ts.Symbol): IComponentDoc | null {
            const declaration = _export.declarations?.[0];
            if (!declaration || (!ts.isInterfaceDeclaration(declaration) && !ts.isTypeAliasDeclaration(declaration))) {
                  return null;
            }

            const { name: exportName } = _export;
            const { description, tags } = this.getJsDocFromComment(_export);
            const props = this.getPropsInfo(_export);

            for (const [propName, prop] of Object.entries(props)) {
                  const component: IComponent = { name: exportName };
                  if (!this.propFilter(prop, component)) {
                        delete props[propName];
                  }
            }

            return {
                  tags,
                  description,
                  exportName,
                  methods: [],
                  props,
            };
      }

      // 从注释获取JSDoc
      private getJsDocFromComment(_export: ts.Symbol): IJSDoc {
            // in some cases this can be undefined (Pick<Type, 'prop1'|'prop2'>)
            // if (_export.getDocumentationComment === undefined) {
            //       return defaultDoc
            // }

            let mainComment = ts.displayPartsToString(_export.getDocumentationComment(this.checker))

            if (mainComment) {
                  mainComment = mainComment.replace('\r\n', '\n');
            }

            const tags = _export.getJsDocTags() || [];

            const tagMap: IStringIndexedObject<string> = {};

            const tagComments = tags.map((tag) => {
                  const formattedTag = this.formatTag(tag);
                  const [, key, content] = formattedTag.match(/^@([^ ]+) (.+)/) || [];
                  tagMap[key] = content;
                  return formattedTag;
            })

            return {
                  description: mainComment,
                  fullComment: `${mainComment}\n${tagComments.join('\n')}`.trim(),
                  tags: tagMap,
            };
      }

      // 格式化 {name: string;text?: SymbolDisplayPart[];} 到 `@name text`
      private formatTag(tag: ts.JSDocTagInfo): string {
            const { text, name } = tag;
            const tagText = text ? (Array.isArray(text) ? ts.displayPartsToString(text) : text) : '';
            if (/^\..+/.test(tagText)) {
                  // @key.key xxxx
                  const [, tagChild = '', desc = ''] = tagText.match(/^(\.[^ ]+)(.+)/) || [];
                  return `@${name}${tagChild} ${desc.trim()}`;
            }
            return `@${name} ${tagText}`;
      }

      // 获取prop信息
      private getPropsInfo(propsObj: ts.Symbol): IPropsInfo {
            const propsType = this.checker.getDeclaredTypeOfSymbol(propsObj);
            let propertiesOfProps = propsType.getProperties();

            if (!propertiesOfProps.length && propsType.isUnionOrIntersection()) {
                  propertiesOfProps = propsType.types.reduce<ts.Symbol[]>((accumulator, type) => [...accumulator, ...type.getProperties()], [])
            }

            const result: IPropsInfo = {};

            propertiesOfProps.forEach((prop) => {
                  const propName = prop.getName();

                  // 通过查看prop对象本身的上下文来查找道具类型
                  const propType = this.checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!);

                  // 判断prop是不是可选项
                  // https://stackoverflow.com/questions/73671685/how-to-get-information-about-the-inherited-interface-members-when-it-uses-a-util
                  const isOptional = (prop.getFlags() & ts.SymbolFlags.Optional) !== 0;

                  // 从prop的注释获取JsDoc
                  const { description, tags } = this.getJsDocFromComment(prop);

                  // 从tag获取默认值，TODO: 能否优化？从tag取默认值意味着需要维护真实默认值与注释中的@default的统一性
                  const defaultValue = { value: tags.default }

                  result[propName] = {
                        defaultValue,
                        name: propName,
                        description,
                        tags,
                        required: !isOptional,
                        type: this.getExtractType(propType),
                  }
            })

            return result
      }

      private getExtractType(propType: ts.Type): IPropItemType {
            const propTypeString = this.checker.typeToString(propType, undefined, ts.TypeFormatFlags.InTypeAlias);
            return {}
      }
}