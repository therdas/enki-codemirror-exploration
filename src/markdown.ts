import { NodeSet } from "@lezer/common";
import { MarkdownParser } from "@lezer/markdown";
import { styleTags, tags as t, Tag } from "@lezer/highlight";

const markdownHighlighting = styleTags({
    "Blockquote/...": t.quote,
    HorizontalRule: t.contentSeparator,
    "ATXHeading1/... SetextHeading1/...": t.heading1,
    "ATXHeading2/... SetextHeading2/...": t.heading2,
    "ATXHeading3/...": t.heading3,
    "ATXHeading4/...": t.heading4,
    "ATXHeading5/...": t.heading5,
    "ATXHeading6/...": t.heading6,
    "Comment CommentBlock": t.comment,
    Escape: t.escape,
    Entity: t.character,
    "Emphasis/...": t.emphasis,
    "StrongEmphasis/...": t.strong,
    "Link/... Image/...": t.link,
    "OrderedList/... BulletList/...": t.list,
    "BlockQuote/...": t.quote,
    "InlineCode CodeText": t.monospace,
    "URL Autolink": t.url,
    "HeaderMark HardBreak QuoteMark ListMark LinkMark EmphasisMark CodeMark": t.processingInstruction,
    "CodeInfo LinkLabel": t.labelName,
    LinkTitle: t.string,
    Paragraph: t.content
  })

