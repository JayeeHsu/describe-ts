import path from 'path';
import fs from 'fs';
import { sync as spawnSync } from 'cross-spawn';


export function getCustomElements() {
      return global.__STORYBOOK_CUSTOM_ELEMENTS__ || global.__STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__;
}
export function isValidComponent(tagName: string) {
      if (!tagName) {
            return false;
      }
      if (typeof tagName === 'string') {
            return true;
      }
      throw new Error('Provided component needs to be a string. e.g. component: "my-element"');
}

export function isValidMetaData(customElements: any) {
      if (!customElements) {
            return false;
      }

      if (
            (customElements.tags && Array.isArray(customElements.tags)) ||
            (customElements.modules && Array.isArray(customElements.modules))
      ) {
            return true;
      }
      throw new Error(`You need to setup valid meta data in your config.js via setCustomElements().
        See the readme of addon-docs for web components for more details.`);
}
interface TagItem {
      name: string;
      type: { [key: string]: any };
      description: string;
      default?: any;
      kind?: string;
      defaultValue?: any;
}

interface Tag {
      name: string;
      description: string;
      attributes?: TagItem[];
      properties?: TagItem[];
      events?: TagItem[];
      methods?: TagItem[];
      members?: TagItem[];
      slots?: TagItem[];
      cssProperties?: TagItem[];
      cssParts?: TagItem[];
}

interface CustomElements {
      tags: Tag[];
      modules?: [];
}

interface Module {
      declarations?: [];
      exports?: [];
}

interface Declaration {
      tagName: string;
}

function mapItem(item: TagItem, category: string): any {
      const type =
            category === 'properties' ? { name: item.type?.text || item.type } : { name: 'void' };

      return {
            name: item.name,
            required: false,
            description: item.description,
            type,
            table: {
                  category,
                  type: { summary: item.type?.text || item.type },
                  defaultValue: {
                        summary: item.default !== undefined ? item.default : item.defaultValue,
                  },
            },
      };
}

function mapEvent(item: TagItem): any[] {
      let name = item.name
            .replace(/(-|_|:|\.|\s)+(.)?/g, (_match, _separator, chr: string) => {
                  return chr ? chr.toUpperCase() : '';
            })
            .replace(/^([A-Z])/, (match) => match.toLowerCase());

      name = `on${name.charAt(0).toUpperCase() + name.substr(1)}`;

      return [{ name, action: { name: item.name }, table: { disable: true } }, mapItem(item, 'events')];
}

function mapData(data: TagItem[], category: string) {
      return (
            data &&
            data
                  .filter((item) => item && item.name)
                  .reduce((acc, item) => {
                        if (item.kind === 'method') return acc;

                        switch (category) {
                              case 'events':
                                    mapEvent(item).forEach((argType) => {
                                          acc[argType.name] = argType;
                                    });
                                    break;
                              default:
                                    acc[item.name] = mapItem(item, category);
                                    break;
                        }

                        return acc;
                  }, {})
      );
}

const getMetaDataExperimental = (tagName: string, customElements: CustomElements) => {
      if (!isValidComponent(tagName) || !isValidMetaData(customElements)) {
            return null;
      }
      const metaData = customElements.tags.find(
            (tag) => tag.name.toUpperCase() === tagName.toUpperCase()
      );
      return metaData;
};

const getMetaDataV1 = (tagName: string, customElements: CustomElements) => {
      if (!isValidComponent(tagName) || !isValidMetaData(customElements)) {
            return null;
      }

      let metadata;
      customElements?.modules?.forEach((_module: Module) => {
            _module?.declarations?.forEach((declaration: Declaration) => {
                  if (declaration.tagName === tagName) {
                        metadata = declaration;
                  }
            });
      });

      return metadata;
};

const getMetaData = (tagName: string, manifest: any) => {
      if (manifest?.version === 'experimental') {
            return getMetaDataExperimental(tagName, manifest);
      }
      return getMetaDataV1(tagName, manifest);
};

export const extractArgTypesFromElements = (tagName: string, customElements: CustomElements) => {
      const metaData = getMetaData(tagName, customElements);
      return (
            metaData && {
                  ...mapData(metaData.attributes, 'attributes'),
                  ...mapData(metaData.members, 'properties'),
                  ...mapData(metaData.properties, 'properties'),
                  ...mapData(metaData.events, 'events'),
                  ...mapData(metaData.slots, 'slots'),
                  ...mapData(metaData.cssProperties, 'css custom properties'),
                  ...mapData(metaData.cssParts, 'css shadow parts'),
            }
      );
};

export const extractArgTypes = (tagName: string) => {
      const cem = getCustomElements();
      return extractArgTypesFromElements(tagName, cem);
};

export const extractComponentDescription = (tagName: string) => {
      const metaData = getMetaData(tagName, getCustomElements());
      return metaData && metaData.description;
};
const runWebComponentsAnalyzer = () => {
      const output = fs.readFileSync('src/web-components/card/index.js', 'utf8');

      return output;
};

const customElementsJson = runWebComponentsAnalyzer();
const customElements = JSON.parse(customElementsJson);

const properties = extractArgTypesFromElements('input', customElements);

console.log(
      'properties:', properties
)
