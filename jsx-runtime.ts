import { HTMLElements } from "./html.ts";

interface RawHtml {
  __html?: string;
}

type Props = Record<string, unknown>;

type Content =
  | string
  | number
  | boolean
  | RawHtml
  | ((...args: unknown[]) => Content)
  | Content[];

interface Component {
  // deno-lint-ignore no-explicit-any
  type: string | ((props: Props) => any);
  props: Props;
}

/** The jsx function to create elements */
export function jsx(
  type: string,
  props: Props,
): Component {
  return { type, props };
}

/** Alias jsxs to jsx for compatibility with automatic runtime */
export { jsx as jsxs };

/** Fragment component to group multiple elements */
export function Fragment(props: { children: unknown }) {
  return props.children;
}

/** Required for "precompile" mode */
export async function jsxTemplate(
  strings: string[],
  ...values: unknown[]
): Promise<string> {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];

    if (typeof value === "string") {
      result += value;
    } else if (isComponent(value)) {
      result += await renderComponent(value);
    } else {
      result += await value;
    }

    result += strings[i + 1];
  }
  return result;
}

/** Required for "precompile" mode: render content */
export async function jsxEscape(content: Content): Promise<string> {
  if (Array.isArray(content)) {
    return (await Promise.all(content.map(jsxEscape))).join("");
  }

  if (content == null || content === undefined) {
    return "";
  }

  switch (typeof content) {
    case "string":
      return content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(
        />/g,
        "&gt;",
      );
    case "object":
      if ("__html" in content) {
        return (content as RawHtml).__html ?? "";
      }
      if (isComponent(content)) {
        return await renderComponent(content);
      }
      break;
    case "number":
    case "boolean":
      return content.toString();
  }

  return content as Promise<string>;
}

function isComponent(value: unknown): value is Component {
  return value !== null && typeof value === "object" && "type" in value &&
    "props" in value;
}

async function renderComponent(component: Component): Promise<string> {
  const { type, props } = component;

  // An HTML tag
  if (typeof type === "string") {
    const attrs: string[] = [type];
    let content = "";

    if (props) {
      for (
        const [key, val] of Object.entries(props)
      ) {
        if (key === "dangerouslySetInnerHTML") {
          content = (val as RawHtml).__html ?? "";
          continue;
        }
        attrs.push(jsxAttr(key, val));
      }
    }
    return `<${attrs.join(" ")}>${content}</${type}>`;
  }

  return await type(props);
}

/** Required for "precompile" mode: render attributes */
export function jsxAttr(name: string, value: unknown): string {
  if (typeof value === "string") {
    return `${name}="${value.replace(/"/g, "&quot;")}"`;
  }

  if (typeof value === "boolean") {
    return value ? name : "";
  }

  if (value == null || value === undefined) {
    return "";
  }

  return `${name}="${value}"`;
}

/** Make JSX global */
declare global {
  export namespace JSX {
    export type Children =
      | HTMLElements
      | RawHtml
      | string
      | number
      | boolean
      | Children[];
    export interface IntrinsicElements extends HTMLElements {}
    export interface ElementChildrenAttribute {
      children: Children;
    }
  }
}
