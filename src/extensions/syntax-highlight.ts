import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
export { defaultHighlightStyle } from "@codemirror/language";

export const markdownStyle = HighlightStyle.define([
    {tag: tags.monospace, color: '#f00'}
])