import { EditorView } from "codemirror";
import { EditorState, Range, RangeSet } from "@codemirror/state"
import { ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view"
import { Decoration } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

const doubleMarks = ['StrongEmphasis']
const singleMarks = ['Emphasis', 'InlineCode']

class hideOnNotFocusDecoration extends WidgetType {
    toDOM(view: EditorView): HTMLElement {
        const span = document.createElement('span');
        span.textContent = '';
        span.className = "cm-hidden";
        return span
    }

    ignoreEvent(event: Event): boolean {
        return false;
    }
}

function hideMarks(state: EditorState): RangeSet<Decoration> {
    let decorations: Range<Decoration>[] = [];
    syntaxTree(state).iterate({
        enter: (node) => {
            if (singleMarks.indexOf(node.name) !== -1) {
                decorations.push(Decoration.replace({ widget: new hideOnNotFocusDecoration() }).range(node.from, node.from + 1))
                decorations.push(Decoration.replace({ widget: new hideOnNotFocusDecoration() }).range(node.to - 1, node.to))
            } else if (doubleMarks.indexOf(node.name) !== -1) {
                decorations.push(Decoration.replace({ widget: new hideOnNotFocusDecoration() }).range(node.from, node.from + 2))
                decorations.push(Decoration.replace({ widget: new hideOnNotFocusDecoration() }).range(node.to - 2, node.to))
            }
        }
    })

    return RangeSet.of(decorations, true);
}




export const hideMarkExtension = ViewPlugin.fromClass(class {
    public decorations: RangeSet<Decoration>;
    public oldDecorations: RangeSet<Decoration> = RangeSet.empty;
    public hiding = false;
    public hidingFrom = -1;
    public hidingTo = -1;
    constructor(view: EditorView) {
        this.decorations = hideMarks(view.state);
    }
    update(update: ViewUpdate) {
        let dirty = false;
        // Calculate deltas
        if (update.docChanged) {
            this.decorations = hideMarks(update.view.state);
            dirty = true;
        }

        // Check for hiding
        const head = update.state.selection.main.head;
        // Perform a filter (this can be sped up later using a hashmap)


        const { range_from, range_to, type } = getMarkLocation(update.state, head);

        // Check if the currently hidden node is the same as the one we should be hiding...
        if (!(this.hidingFrom == range_from && this.hidingTo == range_to) && this.hiding) {
            // We only really do this if range1 is in range2
            if (this.hidingFrom <= range_from && range_to <= this.hidingTo) {

                if (doubleMarks.indexOf(type) != -1 || singleMarks.indexOf(type) != -1) {
                    // We need to reset marks :(
                    this.decorations = this.oldDecorations;
                    this.oldDecorations = RangeSet.empty;
                    this.hiding = false;
                }
            }
        }

        if (!this.hiding || dirty) {
            const filtered = this.decorations.update({
                filter: (from, to) => {
                    if ((doubleMarks.indexOf(type) !== -1 || singleMarks.indexOf(type) !== -1) && intersect(range_from, range_to, from, to, head)) {
                        this.hidingFrom = range_from; this.hidingTo = range_to;
                        this.hiding = true;
                        return false;
                    } else
                        return true;
                }
            });

            //Check if filter worked even?
            if (this.hiding) {
                this.oldDecorations = this.decorations;
                this.decorations = filtered;
            }
        } else {

            // Check if we can stop hiding
            if (!(this.hidingFrom <= head && head <= this.hidingTo)) {
                this.decorations = this.oldDecorations;
                this.oldDecorations = RangeSet.empty;
                this.hiding = false;
                this.hidingFrom = -1; this.hidingTo = -1;
            }
        }
    }
}, {
    decorations: instance => instance.decorations,
    provide: plugin => EditorView.atomicRanges.of(view => {
        return view.plugin(plugin)?.decorations || Decoration.none;
    })
})

function intersect(fromA: number, fromB: number, toA: number, toB: number, head: number) {
    // From is the container, to is the (possible) child
    return (toA <= fromB && fromA <= toB)
}

function getMarkLocation(state: EditorState, head: number): { range_from: number, range_to: number, type: string } {
    const tree = syntaxTree(state);
    const node = tree.resolveInner(head);

    let n = node;
    if (n.name.endsWith("Mark")) {
        if (n.parent)
            n = n.parent;
    }

    return {
        range_from: n.from,
        range_to: n.to,
        type: n.name
    }
}