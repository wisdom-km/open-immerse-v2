export type MdastNode = {
  type: string;
  value?: string;
  url?: string;
  alt?: string | null;
  title?: string | null;
  lang?: string | null;
  identifier?: string;
  ordered?: boolean | null;
  start?: number | null;
  checked?: boolean | null;
  depth?: number;
  align?: readonly ("left" | "right" | "center" | null)[] | null;
  children?: readonly MdastNode[];
  position?: {
    start: { offset?: number | null };
    end: { offset?: number | null };
  } | null;
};
