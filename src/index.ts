import { basicSetup, EditorView } from "codemirror";
import { markdown, markdownKeymap, markdownLanguage } from "@codemirror/lang-markdown";

import "./index.scss";
import { keymap } from "@codemirror/view"
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { hideMarkExtension } from "./extensions/hide-marks.ts";
import { markdownStyle } from "./extensions/syntax-highlight.ts";
import { GFMTaskListItemPlugin } from "./extensions/format-task-list-item.ts";
import { BulletWidgetPlugin } from "./extensions/list-item-bullet-show.ts";

let view = new EditorView({
    parent: document.body,
    extensions: [
        basicSetup,
        markdown({
            base: markdownLanguage,
            completeHTMLTags: true,
        }),
        GFMTaskListItemPlugin,
        hideMarkExtension,
        BulletWidgetPlugin,
        history(),
        keymap.of([...markdownKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        syntaxHighlighting(defaultHighlightStyle),
        syntaxHighlighting(markdownStyle),
    ]
})

