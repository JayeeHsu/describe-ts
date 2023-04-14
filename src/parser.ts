export interface StringIndexedObject<T> {
      [key: string]: T;
}

export interface PropItemType {
      name: string;
      value?: any;
      raw?: string;
}

export interface PropItem {
      name: string;
      required: boolean;
      type: PropItemType;
      description: string;
      defaultValue: any;
      tags: Record<string, any>
}

export interface Props extends StringIndexedObject<PropItem> { }

export interface MethodParameter {
      name: string;
      description?: string | null;
      type: MethodParameterType;
}

export interface MethodParameterType {
      name: string;
}

export interface Method {
      name: string;
      docblock: string;
      modifiers: string[];
      params: MethodParameter[];
      returns?: {
            description?: string | null;
            type?: string;
      } | null;
      description: string;
}

export interface ComponentDoc {
      exportName: string;
      description: string;
      props: Props;
      methods: Method[];
      block?: [number, number];
      tags: Record<string, any>
}
