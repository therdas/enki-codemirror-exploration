import { EditorView } from "codemirror";
import { DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view"
import { Decoration } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

class CheckboxWidget extends WidgetType {
    public checked: boolean = false;

    constructor(checked: boolean = false) {
        super()
        this.checked = checked;
    }

    eq(other: CheckboxWidget): boolean {
        return other.checked === this.checked
    }

    toDOM(): HTMLElement {
        let wrap = document.createElement('span');
        wrap.setAttribute("aria-hidden", "true");
        wrap.className ="cm-tasklist-toggle";

        let box = wrap.appendChild(document.createElement('input'))
        box.type = 'checkbox';
        box.checked = this.checked;
        
        return wrap
    }

    ignoreEvent(event: Event): boolean {
        return false;
    }
}   



function makeTasklistItems(view: EditorView) {
    let widgets = [];
    for(let {from, to} of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from, to,
            enter: (node) => {
                if(node.name == "TaskMarker") {
                    let marked = view.state.doc.sliceString(node.from, node.to).charAt(1);
                    let isChecked = marked == 'x' || marked == 'X';
                    let deco = Decoration.replace({
                        widget: new CheckboxWidget(isChecked),
                    })

                    //@ts-ignore
                    widgets.push(deco.range(node.from, node.to))
                }
            }
        })

    }
    return Decoration.set(widgets);
}

export const GFMTaskListItemPlugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet
  
    constructor(view: EditorView) {
      this.decorations = makeTasklistItems(view)
      console.log("I'm Alive!!")
    }
  
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged ||
          syntaxTree(update.startState) != syntaxTree(update.state))
        this.decorations = makeTasklistItems(update.view)
    }
  }, {
    decorations: v => v.decorations,
  
    eventHandlers: {
      mousedown: (e, view) => {
        let target = e.target as HTMLElement
        if (target.nodeName == "INPUT" &&
            target.parentElement!.classList.contains("cm-tasklist-toggle"))
          return toggleTaskState(view, view.posAtDOM(target))
      }
    }
})

function toggleTaskState(view: EditorView, pos: number) {
    let before = view.state.doc.sliceString(Math.max(0, pos - 3), pos)
    let change;
    if (before == "[ ]")
      change = {from: pos - 3, to: pos, insert: "[x]"}
    else if (before.endsWith("[x]"))
      change = {from: pos - 3, to: pos, insert: "[ ]"}
    else
      return false
    view.dispatch({changes: change})

    return true
  }