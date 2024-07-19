import { JSX } from "./html.ts";

interface RawHtml {
  __html?: string;
}

export function jsx(type: string, props: Record<string, unknown>) {
  return [type, props];
}

export { jsx as jsxs };
export { jsx as Fragment };

/** jsx: precompile */
export async function jsxTemplate(
  strings: string[],
  ...values: unknown[]
): Promise<string> {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];

    if (Array.isArray(value)) {
      const r = value[0](value[1]);
      if (typeof r === "string") {
        result += r;
      } else {
        result += await r;
      }
    } else {
      result += value;
    }
    result += strings[i + 1];
  }
  return result;
}

export function jsxEscape(content: unknown): string {
  if (typeof content === "function") {
    return jsxEscape(content());
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
      break;
    case "number":
    case "boolean":
      return content.toString();
  }

  if (typeof content === "number" || typeof content === "boolean") {
    return content.toString();
  }

  return "";
}

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
export type { JSX };
