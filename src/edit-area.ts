import { ActiveMode, Direction, CaretPosition, NodesInRange, Align } from "./util";
import rangy from "rangy/lib/rangy-core.js";
import "rangy/lib/rangy-highlighter";
import "rangy/lib/rangy-classapplier";
import "rangy/lib/rangy-textrange";
import "rangy/lib/rangy-serializer";
import "rangy/lib/rangy-selectionsaverestore";
import { Helper } from "./helper";
import { HTMLParsing } from "./html-parsing";

export class EditArea {

    savedSelection: RangySelection;
    savedSelectionActiveElement: Element;
    previousRange: Range;
    textArea: HTMLTextAreaElement;
    editor: HTMLDivElement;
    pasteFlag: boolean = false;
    cutFlag: boolean = false;

    constructor(textArea: HTMLElement, editor: HTMLElement) {
        if (textArea.nodeName !== "TEXTAREA" || editor.nodeName !== "DIV") {
            throw Error("Invalid HTMLElements");
        }
        this.textArea = <HTMLTextAreaElement>textArea;
        this.editor = <HTMLDivElement>editor;
        editor.contentEditable = "true";
        rangy.init();
        this.updateEditor();
    }

    updateEditor(): void {
        $(this.editor).html($(this.textArea).val().toString());
        this.CleanUpCSS();
    }

    updateTextArea(): void {
        $(this.textArea).val(Helper.FormatHtmlString($(this.editor).html()));
    }

    CleanUpCSS(): void {
        $(this.editor).find("*").each((index, element) => {
            HTMLParsing.replaceCSS(element);
        });
    }

    updateMode(mode: ActiveMode): boolean {
        if (mode === ActiveMode.Html) {
            this.updateTextArea();
            $(this.editor).hide();
            $(this.textArea).show().focus();
        } else {
            this.updateEditor();
            $(this.textArea).hide();
            $(this.editor).show().focus();
        }
        if (mode === ActiveMode.Preview) {
            this.editor.contentEditable = "false";
        } else {
            this.editor.contentEditable = "true";
        }
        return true;
    }

    getFirstRange(): RangyRange {
        this.editor.focus();
        let sel: RangySelection = rangy.getSelection();
        return sel.rangeCount ? sel.getRangeAt(0) : undefined;
    }

    setCaretAfter(node: Node): void {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        range.collapseAfter(node);
        rangy.getSelection().setSingleRange(range);
    }

    setCaretBefore(node: Node): void {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        range.collapseBefore(node);
        rangy.getSelection().setSingleRange(range);
    }

    saveSelection(): void {
        if (this.savedSelection) {
            rangy.removeMarkers(this.savedSelection);
        }
        this.savedSelection = rangy.saveSelection();
        this.savedSelectionActiveElement = document.activeElement;
    }

    restoreSelection(): void {
        if (this.savedSelection) {
            rangy.restoreSelection(this.savedSelection, true);
            this.savedSelection = null;
            window.setTimeout(() => {
                if (this.savedSelectionActiveElement && typeof (<HTMLElement>this.savedSelectionActiveElement).focus !== "undefined") {
                    (<HTMLElement>this.savedSelectionActiveElement).focus();
                }
            }, 1);
        }
    }

    checkState(cmd: string): boolean {
        this.editor.focus();
        switch (cmd) {
            case ("p"):
                return this.checkParagraph();
            case ("justifyleft"):
                return this.getAlignment() === Align.Left;
            case ("justifycenter"):
                return this.getAlignment() === Align.Center;
            case ("justifyright"):
                return this.getAlignment() === Align.Right;
            case ("justifyfull"):
                return this.getAlignment() === Align.Justify;
            case ("justifyreset"):
                return this.getAlignment() === Align.None;
            default:
                if (document.queryCommandEnabled(cmd)) {
                    return document.queryCommandState(cmd);
                }
        }
    }

    getAlignment(): Align {
        let alignment: string = this.getValueOfParentWithAttributeFromRange("align");
        switch (alignment) {
            case ("left"):
                return Align.Left;
            case ("center"):
                return Align.Center;
            case ("right"):
                return Align.Right;
            case ("justify"):
                return Align.Justify;
            default:
                return Align.None;
        }
    }

    getDirection(): Direction {
        let direction: string = this.getValueOfParentWithPropertyFromRange("direction");
        return direction === "" || direction.toLowerCase() === "ltr" ? Direction.LTR : Direction.RTL;
    }

    checkParagraph(): boolean {
        return this.checkIfRangeIsExactelyNodeWithType(["p"]) || this.checkIfRangeIsInsideParentWithType(["p"]);
    }

    formatDoc(cmd: string, showUI?: boolean, value?: any): void {
        this.editor.focus();
        switch (cmd) {
            case ("p"):
                this.surroundRange("p");
                break;
            case ("justifyreset"):
                this.removeAttributeFromRange("align");
                break;
            default:
                if (document.queryCommandEnabled(cmd)) {
                    document.execCommand(cmd, showUI, value);
                }
                break;
        }
        this.editor.focus();
    }

    surroundRange(tagName: string): void {
        tagName = tagName.toLowerCase();
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        let element: HTMLElement = this.getParentWithTypeOfRange([tagName], range);
        if (element !== undefined) {
            $(element).contents().unwrap();
            return;
        }
        let newElement: HTMLElement = document.createElement(tagName);

        if (range.collapsed) {
            let container: Node = this.getParentWithTypeOfRange([], range, ["strong", "em", "sub", "sup", "u", "strike"], [1]);
            container = container === undefined ? this.getHighestNodeFromRange(range) : container;
            this.surroundContainerWithElement(container, newElement, true, true);
        } else {

            let children: Node[] = this.getNodesInRange(range, NodesInRange.ChildrenAll, [1, 3]);

            if (this.getNodesInRange(range, NodesInRange.Intersecting, [1]).length === 0) {
                if (children.length === 1) {
                    this.surroundContainerWithElement(children[0], newElement, true, true);
                } else {
                    range.surroundContents(newElement);
                    $(children).each((index, element) => HTMLParsing.removeTagKeepAttributesRecursive(element));
                }
            } else {
                if (children.length === children[0].parentNode.childNodes.length) {
                    this.surroundContainerWithElement(children[0].parentNode, newElement, true, true);
                } else {
                    $(children).wrapAll(newElement);
                    $(children).each((index, element) => HTMLParsing.removeTagKeepAttributesRecursive(element, [tagName], true));
                }
            }
        }
    }

    changeDirection(direction: Direction): boolean {
        this.editor.focus();
        if (direction === Direction.RTL) {
            let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(this.editor.firstChild);
            if (element !== undefined && this.editor.childNodes.length === 1
                && element.nodeName.toLowerCase() === "div") {
                $(element).css("direction", "rtl");
            } else {
                let par: HTMLElement = $("<div/>").css("direction", "rtl")[0];
                $(this.editor).contents().wrapAll(par);
            }
            HTMLParsing.removeCSSPropertyChildren(this.editor.firstChild, "direction");
        } else {
            let firstChild: HTMLElement = HTMLParsing.castNodeToHTMLElement(this.editor.firstChild);
            HTMLParsing.removeCSSPropertyChildren(this.editor, "direction");
        }
        this.editor.focus();
        return true;
    }

    insertNodeAtRange(node: Node, caretPosition: CaretPosition = CaretPosition.After): void {
        let range: RangyRange = this.getFirstRange();
        if (!range) {
            return;
        }
        range.deleteContents();
        range.insertNode(node);
        switch (caretPosition) {
            case (CaretPosition.Before):
                this.setCaretBefore(node);
                break;
            case (CaretPosition.After):
                this.setCaretAfter(node);
                break;
        }
    }

    surroundContainerWithElement(container: Node, element: HTMLElement, removeTagInElement: boolean = false,
        insertBR: boolean = false): void {
        if (container === this.editor) {
            $(this.editor).contents().wrapAll(element);
            if (removeTagInElement) {
                HTMLParsing.removeTagKeepAttributesChildren(<HTMLElement>this.editor.firstChild,
                    [element.nodeName.toLowerCase()], insertBR);
            }
        } else if (["span", "div"].indexOf(container.nodeName.toLowerCase()) !== -1) {
            if (removeTagInElement) {
                HTMLParsing.removeTagKeepAttributesChildren(<HTMLElement>container, [element.nodeName.toLowerCase()], insertBR);
            }
            HTMLParsing.replaceTag(<HTMLElement>container, element);
        } else if (container.parentNode.childNodes.length === 1) {
            this.surroundContainerWithElement(container.parentNode, element, true, true);
        } else {
            $(container).wrap(element);
            if (removeTagInElement) {
                HTMLParsing.removeTagKeepAttributesRecursive(<HTMLElement>container, [element.nodeName.toLowerCase()], insertBR);
            }
        }
    }

    removeCSSFromRange(property: string): void {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        if (range.collapsed) {
            let container: Node = this.getParentWithTypeOfRange([], range, ["strong", "em", "sub", "sup", "u", "strike"], [1]);
            container = container === undefined ? this.getHighestNodeFromRange(range) : container;
            HTMLParsing.removeAttributeRecursively(container, property);
        }
        $(this.getNodesInRange(range, NodesInRange.All)).each((index, element) => HTMLParsing.removeCSSProperty(element, property));
    }

    removeAttributeFromRange(attribute: string): void {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        if (range.collapsed) {
            let container: Node = this.getParentWithAttributeFromRange("align");
            if (container !== undefined) {
                HTMLParsing.removeAttributeRecursively(container, attribute);
            }
        }
        $(this.getNodesInRange(range, NodesInRange.All)).each((index, element) => HTMLParsing.removeAttribute(element, attribute));
    }
    checkIfNodeIsInsideParentWithType(container: Node, nodeNames: string[] = [], blackList: string[] = []): boolean {
        return this.getParentWithTypeOfNode(container, nodeNames, blackList) !== undefined;
    }

    checkIfRangeIsInsideParentWithType(nodeNames: string[] = [], range?: RangyRange, blackList: string[] = []): boolean {
        return this.getParentWithTypeOfRange(nodeNames, range, blackList) !== undefined;
    }
    checkIfRangeIsExactelyNodeWithType(nodeNames: string[] = [], range?: RangyRange): boolean {
        return this.getNodeExactelyInRangeWithType(nodeNames, range) !== undefined;
    }
    getNodesInRange(range?: RangyRange, position: NodesInRange = NodesInRange.All, nodeTypes: number[] = [1]): Node[] {
        let nodes: Node[] = [];
        if (range === undefined) {
            range = this.getFirstRange();
            if (range === undefined) {
                return nodes;
            }
        }
        let container: Node = this.getParentWithTypeOfRange([], range);
        container = container === undefined ? this.editor : container;
        let sorting: (node: Node) => boolean = undefined;
        if (position === NodesInRange.Intersecting) {
            sorting = (node) => { return !range.containsNodeContents(node); };
        }
        if (position === NodesInRange.Inside) {
            sorting = (node) => { return range.containsNodeContents(node); };
        }
        if (position === NodesInRange.ChildrenAll) {
            sorting = (node) => { return node.parentNode === container; };
        }
        if (position === NodesInRange.Inside) {
            sorting = (node) => { return node.parentNode === container && range.containsNodeText(node); };
        }
        nodes = range.getNodes(nodeTypes, sorting);
        return nodes;
    }

    getValueOfParentWithPropertyFromRange(property: string): string {
        let parent: HTMLElement = this.getParentWithPropertyFromRange(property);
        return parent === undefined ? "" : parent.style[property];
    }

    getParentWithPropertyFromRange(property: string): HTMLElement {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return undefined;
        }
        let container: HTMLElement = this.getParentWithTypeOfRange([], range);
        if (container !== undefined && container.style && container.style[property] !== "" && container.style[property] !== undefined) {
            return container;
        }
        return this.getParentWithPropertyFromNode(property, container);
    }

    getParentWithPropertyFromNode(property: string, node: Node): HTMLElement {
        let parent: HTMLElement = undefined;
        $(node).parentsUntil(this.editor).each((index, element) => {
            if (element.style && element.style[property] !== undefined && element.style[property] !== "") {
                parent = element;
                return false;
            }
        });
        return parent;
    }

    getValueOfParentWithAttributeFromRange(property: string): string {
        let parent: HTMLElement = this.getParentWithAttributeFromRange(property);
        return parent === undefined ? "" : parent[property];
    }

    getParentWithAttributeFromRange(attribute: string): HTMLElement {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return undefined;
        }
        let container: HTMLElement = this.getParentWithTypeOfRange([], range);
        if (container !== undefined && container.style && container[attribute] !== "" && container[attribute] !== undefined) {
            return container;
        }
        return this.getParentWithAttributeFromNode(attribute, container);
    }

    getParentWithAttributeFromNode(attribute: string, node: Node): HTMLElement {
        let parent: HTMLElement = undefined;
        $(node).parentsUntil(this.editor).each((index, element) => {
            if (element.style && element[attribute] !== undefined && element[attribute] !== "") {
                parent = element;
                return false;
            }
        });
        return parent;
    }

    getParentWithTypeOfRange(nodeNames: string[] = [], range?: RangyRange, blackList: string[] = [],
        nodeTypes: number[] = [1]): HTMLElement {
        if (range === undefined) {
            range = this.getFirstRange();
        }
        if (range === undefined) {
            return undefined;
        }
        let container: Node = range.commonAncestorContainer;
        if (nodeTypes.indexOf(container.nodeType) !== -1 && (nodeNames.length === 0 ||
            nodeNames.indexOf(container.nodeName.toLowerCase()) !== -1) &&
            (blackList.indexOf(container.nodeName.toLowerCase()) === -1)) {
            return <HTMLElement>container;
        }
        return this.getParentWithTypeOfNode(container, nodeNames, blackList, nodeTypes);
    }

    getParentWithTypeOfNode(container: Node, nodeNames: string[] = [], blackList: string[] = [],
        nodeTypes: number[] = [1]): HTMLElement {
        let node: HTMLElement = undefined;
        $(container).parentsUntil(this.editor).each((index: number, element: HTMLElement): false => {
            if (nodeTypes.indexOf(element.nodeType) !== -1 && (nodeNames.length === 0 ||
                nodeNames.indexOf(element.nodeName.toLowerCase()) !== -1) &&
                (blackList.indexOf(container.nodeName.toLowerCase()) === -1)) {
                node = element;
                return false;
            }
        });
        return node;
    }

    getNodeExactelyInRangeWithType(nodeNames: string[] = [], range?: RangyRange): Node | undefined {
        let node: Node = undefined;
        if (range === undefined) {
            range = this.getFirstRange();
        }
        if (range === undefined) {
            return node;
        }
        let children: Node[] = this.getNodesInRange(range, NodesInRange.ChildrenAll, [1, 3]);

        if (this.getNodesInRange(range, NodesInRange.Intersecting, [1]).length === 0 && children.length === 1 &&
            (nodeNames.length === 0 || nodeNames.indexOf(children[0].nodeName) !== -1)) {
            node = children[0];
        }
        return node;
    }

    getHighestNodeFromRange(range?: RangyRange): Node {
        if (range === undefined) {
            range = this.getFirstRange();
        }
        if (range === undefined) {
            return undefined;
        }
        let node: Node = range.commonAncestorContainer;
        while (node.parentNode !== this.editor) {
            node = node.parentNode;
        }
        return node;
    }

}

  // insertBreakAtRange(): void {
    //     let node: Node = $("<br>")[0];
    //     this.insertNodeAtRange(node);
    //     this.checkLastBreak(node);
    // }

    // checkLastBreak(node: Node): void {
    //     if (this.editor.lastChild === node) {
    //         let lastBreak: Node = $("<br>")[0];
    //         this.insertNodeAtRange(lastBreak, CaretPosition.Before);
    //     }
    // }

        // removeCSSFromRange(range: RangyRange, property: string): void {
    //     let nodes: Node[] = range.getNodes([1], (node: Node) => { return range.containsNodeContents(node); });
    //     nodes.forEach((node) => this.removeCSSElement(<Element>node, property));
    // }
    // removeCSSElement(element: Element, property: string): void {
    //     $(element).css(property, "");
    // }



