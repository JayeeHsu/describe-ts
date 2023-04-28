import {
      IComponent,
      ParserOptions,
      TPropFilter,
      IPropItem,
      StaticPropFilter,
} from "./parser";

export function createPropFilter(opts: ParserOptions): TPropFilter {
      return (prop: IPropItem, component: IComponent) => {
            const { propFilter } = opts;
            // 跳过 没有自定义文档的 “children” property (React)
            // if (prop.name === "children" && prop.description.length === 0) {
            //   return false;
            // }
            if (typeof propFilter === "function") {
                  const keep = propFilter(prop, component);
                  if (!keep) {
                        return false;
                  }
            } else if (typeof propFilter === "object") {
                  const {
                        skipPropsWithName,
                        skipPropsWithoutDoc,
                  } = propFilter as StaticPropFilter;
                  if (
                        typeof skipPropsWithName === "string" &&
                        skipPropsWithName === prop.name
                  ) {
                        return false;
                  }
                  if (
                        Array.isArray(skipPropsWithName) &&
                        skipPropsWithName.includes(prop.name)
                  ) {
                        return false;
                  }
                  if (skipPropsWithoutDoc && prop.description.length === 0) {
                        return false;
                  }
            }
            return true;
      };
}
