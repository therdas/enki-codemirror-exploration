import { EditorView } from "codemirror";
import { DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view"
import { Decoration } from "@codemirror/view";
import { indentNodeProp, syntaxTree } from "@codemirror/language";

import { Range, RangeSet } from "@codemirror/state"

export const levelUnorgMap = new Map<number, string>([
  [1, '-'],
  [2, '•'],
  [3, '◦'],
  [0, '‣'],
])

const romanUpperSet = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
const romanLowerSet = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
const romanValues = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];


const toRoman =(level: number, charSet: string[], valueSet: number[]) => {
  let str = '';
  for (let i in charSet) {
    let q = Math.floor(level / valueSet[i]);
    level -= q * valueSet[i];
    str += charSet[i].repeat(q);
  }
  return str;
}

const romanUpper = (n) => toRoman(n, romanUpperSet, romanValues);
const romanLower = (n) => toRoman(n, romanLowerSet, romanValues);

const alphaLower = (n) => {
  return String.fromCharCode(96 + n);
}

const alphaUpper = (n) => {
  return String.fromCharCode(64 + n);
}

export const levelOrgMap = new Map<number, Function>([
  [1, romanLower],
  [2, romanUpper],
  [3, alphaUpper],
  [4, alphaLower],
  [0, (n) => '' + n],
])

class ListItemBulletWidget extends WidgetType {
    constructor(public level: number, public ordered: boolean, public no: number) {
        super()
    }

    toDOM(): HTMLElement {
        let wrap = document.createElement('span');
        wrap.className ="cm-list-item";

        console.log("LVBL", this.level, this.no, this.ordered)

        wrap.textContent = '' + this.ordered ? (levelOrgMap.get(this.level) ?? levelOrgMap.get(0))!(this.no)+'. ' : ''+(levelUnorgMap.get(this.level) ?? levelUnorgMap.get(0));
        
        return wrap
    }

    ignoreEvent(event: Event): boolean {
        return false;
    }
}   



function convertBulletWidget(view: EditorView) {
    let widgets: Range<Decoration>[] = [];
    for(let {from, to} of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from, to,
            enter: (node) => {
                if(node.name == "ListMark") {
                  let depth = 0;
                  let n = node.node;
                  let text = view.state.doc.sliceString(node.from, node.to);
                  let ordered = false;
                  let no = 0;
                  while(n.parent) {
                    n = n.parent;
                    if(n.name === 'BulletList' || n.name === 'OrderedList')
                      ++depth;

                    if(depth == 1) {
                      if(n.name == 'OrderedList'){
                        ordered = true;
                        no = Number.parseInt(text.slice(0, -1)) ?? 0
                      }
                    }
                  }
                  let marked = view.state.doc.sliceString(node.from, node.to).charAt(1);
                  
                  console.log(depth, ordered, no); 

                  let deco = Decoration.replace({
                      widget: new ListItemBulletWidget(depth, ordered, no),
                  })

                  widgets.push(deco.range(node.from, node.to))
                }
            }
        })

    }
    return Decoration.set(widgets);
}

export const BulletWidgetPlugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet
  
    constructor(view: EditorView) {
      this.decorations = convertBulletWidget(view)
    }
  
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged ||
          syntaxTree(update.startState) != syntaxTree(update.state))
        this.decorations = convertBulletWidget(update.view)
    }
  }, {
    decorations: v => v.decorations,
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