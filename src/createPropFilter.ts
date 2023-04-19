import {
      Component,
      ParserOptions,
      PropFilter,
      PropItem,
      StaticPropFilter,
} from "./parser";

export function createPropFilter(opts: ParserOptions): PropFilter {
      return (prop: PropItem, component: Component) => {
            const { propFilter } = opts;
            // skip children property in case it has no custom documentation
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