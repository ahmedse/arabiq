import { createElement } from "react";
import type { ReactNode } from "react";

const FALLBACK_TEXT = "";
const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

type StrapiBlock = {
  type?: string;
  children?: StrapiBlock[];
  text?: string;
  level?: number;
  format?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  url?: string;
};

function renderTextNode(node: StrapiBlock, key: string | number): ReactNode {
  const text = node.text ?? FALLBACK_TEXT;

  let content: ReactNode = text;

  if (node.bold) {
    content = <strong key={`${key}-bold`}>{content}</strong>;
  }
  if (node.italic) {
    content = <em key={`${key}-italic`}>{content}</em>;
  }
  if (node.underline) {
    content = <span key={`${key}-underline`} className="underline">{content}</span>;
  }
  if (node.strikethrough) {
    content = <span key={`${key}-strike`} className="line-through">{content}</span>;
  }

  return <span key={key}>{content}</span>;
}

function renderNodes(nodes: StrapiBlock[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => renderNode(node, `${keyPrefix}-${index}`));
}

function renderNode(node: StrapiBlock, key: string | number): ReactNode {
  const type = node.type ?? "text";
  const children = node.children ?? [];

  switch (type) {
    case "text":
      return renderTextNode(node, key);
    case "paragraph":
      return <p key={key} className="text-slate-700">{renderNodes(children, `${key}-p`)}</p>;
    case "heading": {
      const level = Math.min(Math.max(node.level ?? 2, 1), 6);
      const Tag = HEADING_TAGS[level - 1] ?? "h2";
      return createElement(Tag, { key, className: "font-semibold text-slate-900" }, renderNodes(children, `${key}-h`));
    }
    case "list": {
      const ListTag = node.format === "ordered" ? "ol" : "ul";
      return (
        <ListTag key={key} className="ml-5 list-disc space-y-1 text-slate-700">
          {renderNodes(children, `${key}-list`)}
        </ListTag>
      );
    }
    case "list-item":
      return <li key={key}>{renderNodes(children, `${key}-li`)}</li>;
    case "link":
      return (
        <a
          key={key}
          href={node.url ?? "#"}
          className="text-blue-600 hover:underline"
          rel="noreferrer"
          target="_blank"
        >
          {renderNodes(children, `${key}-link`)}
        </a>
      );
    default:
      if (children.length) {
        return <span key={key}>{renderNodes(children, `${key}-span`)}</span>;
      }
      return <span key={key}>{node.text ?? FALLBACK_TEXT}</span>;
  }
}

export function renderRichText(input: unknown): ReactNode {
  if (!input) {
    return null;
  }

  if (typeof input === "string") {
    return <p className="text-slate-700">{input}</p>;
  }

  if (Array.isArray(input)) {
    return <div className="space-y-4">{renderNodes(input as StrapiBlock[], "rt")}</div>;
  }

  return null;
}
