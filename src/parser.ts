import * as ts from 'typescript';

import { createPropFilter } from './createPropFilter';

interface IStringIndexedObject<T> {
      [key: string]: T;
}

interface IPropItemType {
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

interface IPropsInfo extends IStringIndexedObject<IPropItem> { }

interface IMethodParameter {
      name: string;
      description?: string | null;
      type: IMethodParameterType;
}

interface IMethodParameterType {
      name: string;
}

interface IMethod {
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
      props: IPropsInfo;
      methods: IMethod[];
      block?: [number, number];
      tags: Record<string, any>
}


export interface IComponent {
      name: string;
}

interface IPropItemType {
      name: string;
      value?: any;
      raw?: string;
}

export interface StaticPropFilter {
      skipPropsWithName?: string[] | string;
      skipPropsWithoutDoc?: boolean;
}

export type TPropFilter = (props: IPropItem, component: IComponent) => boolean;

export interface ParserOptions {
      propFilter?: StaticPropFilter | TPropFilter;
      shouldExtractLiteralValuesFromEnum?: boolean;
}

const defaultParserOpts: ParserOptions = {};

const defaultCompilerOptions: ts.CompilerOptions = {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.Latest,
};

export function parse(
      filePathOrPaths: string | string[],
      compilerOptions: ts.CompilerOptions = defaultCompilerOptions,
      parserOpts: ParserOptions = defaultParserOpts,
): IComponentDoc[] {
      const filePaths = Array.isArray(filePathOrPaths) ? filePathOrPaths : [filePathOrPaths];

      const program = ts.createProgram(filePaths, compilerOptions);

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
                              return componentDocs.slice(index + 1).every((innerComponentsDoc) => innerComponentsDoc.exportName !== componentDoc!.exportName)
                        })
            })
}

interface IJSDoc {
      description: string;
      fullComment: string;
      tags: IStringIndexedObject<string | string[]>;
}

class Parser {
      private checker: ts.TypeChecker; // 类型检查器，可用于对程序中的源文件进行语义分析
      private propFilter: TPropFilter;
      private shouldExtractLiteralValuesFromEnum: boolean;

      constructor(program: ts.Program, opts: ParserOptions) {
            const { shouldExtractLiteralValuesFromEnum } = opts;
            this.checker = program.getTypeChecker();
            this.propFilter = createPropFilter(opts);
            this.shouldExtractLiteralValuesFromEnum = Boolean(shouldExtractLiteralValuesFromEnum);
      }

      // 获取组件文档
      public getComponentDoc(_export: ts.Symbol): IComponentDoc | null {
            const declaration = _export.declarations?.[0];

            // if (!declaration || (!ts.isInterfaceDeclaration(declaration) && !ts.isTypeAliasDeclaration(declaration))) {
            //       return null;
            // }
            if (!declaration ||
                  (!ts.isInterfaceDeclaration(declaration)
                        && !ts.isTypeAliasDeclaration(declaration))
                  && !ts.isClassDeclaration(declaration)
            ) {
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
            // const defaultDoc: IJSDoc = {
            //       description: '',
            //       fullComment: '',
            //       tags: {}
            // }
            // in some cases this can be undefined (Pick<Type, 'prop1'|'prop2'>)
            // if (_export.getDocumentationComment === undefined) {
            //       return defaultDoc
            // }

            let mainComment = ts.displayPartsToString(_export.getDocumentationComment(this.checker))

            if (mainComment) {
                  mainComment = mainComment.replace('\r\n', '\n');
            }

            const tags = _export.getJsDocTags() || [];

            const tagMap: IStringIndexedObject<string | string[]> = {};

            const tagComments = tags.map((tag) => {
                  const formattedTag = this.formatTag(tag);
                  const [, key, content] = formattedTag.match(/^@([^ ]+) (.+)/) || [];
                  if (tagMap[key]) {
                        tagMap[key] = [content, ...tagMap[key]]
                  } else {
                        tagMap[key] = content;
                  }
                  return formattedTag;
            })

            return {
                  description: mainComment,
                  fullComment: `${mainComment} \n${tagComments.join('\n')} `.trim(),
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
                  return `@${name}${tagChild} ${desc.trim()} `;
            }
            return `@${name} ${tagText} `;
      }

      // 获取prop信息
      private getPropsInfo(_export: ts.Symbol): IPropsInfo {
            const propsType = this.checker.getDeclaredTypeOfSymbol(_export);
            let propertiesOfProps = propsType.getProperties();

            if (!propertiesOfProps.length && propsType.isUnionOrIntersection()) {
                  // 如果是并集类型或交集类型，则进一步嗅探props解构出来
                  propertiesOfProps = propsType.types.reduce<ts.Symbol[]>((accumulator, type) => [...accumulator, ...type.getProperties()], [])
            }

            propertiesOfProps = propertiesOfProps.filter((prop) => {
                  // 过滤掉函数成员
                  return prop.getFlags() & ts.SymbolFlags.Property
            })

            const result: IPropsInfo = {};

            propertiesOfProps.forEach((prop) => {
                  const propName = prop.getName();

                  // 通过查看prop对象本身的上下文来查找prop类型
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

            console.log(result)

            return result
      }

      // 提取propItem类型
      private getExtractType(propType: ts.Type): IPropItemType {
            // TypeFormatFlags.InTypeAlias 除去换行和缩进
            const propTypeString = this.checker.typeToString(propType, undefined, ts.TypeFormatFlags.InTypeAlias);

            if ((this.shouldExtractLiteralValuesFromEnum)
                  && propType.isUnion()
                  && propType.types.every((type) => type.isStringLiteral())) {
                  return {
                        name: 'enum',
                        raw: propTypeString,
                        value: propType.types.map((type) => {
                              return {
                                    value: type.isStringLiteral() ? `"${type.value}"` : undefined
                              }
                        }).filter(Boolean)
                  }
            }

            return {
                  name: propTypeString
            }
      }
}