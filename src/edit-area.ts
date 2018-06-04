// tslint:disable-next-line:typedef
declare function require(name: string);
// tslint:disable-next-line:typedef
var debounce = require("lodash.debounce");
import { ActiveMode, Direction, CaretPosition, NodesInRange, Align } from "./util";
import rangy from "rangy/lib/rangy-core.js";
import "rangy/lib/rangy-highlighter";
import "rangy/lib/rangy-classapplier";
import "rangy/lib/rangy-textrange";
import "rangy/lib/rangy-serializer";
import "rangy/lib/rangy-selectionsaverestore";
import { formatHtmlString } from "./helper";
import { HTMLParsing } from "./html-parsing";
import { UndoManager } from "./undo-manager";
import wordFilter from "tinymce-word-paste-filter";

export class EditArea {

    savedSelection: RangySelection;
    savedSelectionActiveElement: Element;
    previousRange: Range;
    textArea: HTMLTextAreaElement;
    editor: HTMLDivElement;
    undoManager: UndoManager;
    pasteAsPlainText: boolean = false;
    markUpNodeNames: string[] = ["strong", "em", "sub", "sup", "u", "strike"];
    constructor(textArea: HTMLElement, editor: HTMLElement) {
        if (textArea.nodeName !== "TEXTAREA" || editor.nodeName !== "DIV") {
            throw Error("Invalid HTMLElements");
        }
        this.textArea = <HTMLTextAreaElement>textArea;
        this.editor = <HTMLDivElement>editor;
        editor.contentEditable = "true";
        rangy.init();
        this.updateEditor();
        this.undoManager = new UndoManager(this);
        let fn: () => boolean = () => { return this.undoManager.onChange(this.undoManager); };
        $(this.editor).keyup(debounce(fn, 500, { "maxWait": 2000 })).mouseup(fn).blur(fn).on("paste", fn).on("cut", fn);
        $(this.editor).keydown(e => this.handleKeyDown(this, e));
        $(this.editor).keyup(e => this.handleKeyUp(this, e));
        $(this.editor).on("paste", e => this.paste(this, e));

    }

    paste(that: EditArea, e: JQuery.Event<HTMLElement, null>): boolean {
        if (that.pasteAsPlainText) {
            e.preventDefault();
            e.stopPropagation();
            let paste: string = ((<any>e).clipboardData || (<any>window).clipboardData).getData("text");
            that.insertHTMLAtRange(paste.replace(/\n/g, "<br />"));
            that.pasteAsPlainText = false;
            return false;
        }
        return true;
    }
    handleKeyUp(that: EditArea, e: JQuery.Event<HTMLElement, null>): boolean {
        if (e.keyCode === 32 || e.keyCode === 13) {
            that.undoManager.onChange(that.undoManager);
        }
        return true;
    }
    handleKeyDown(that: EditArea, e: JQuery.Event<HTMLElement, null>): boolean {
        if (e.keyCode === 89 && e.ctrlKey) {
            e.preventDefault();
            that.formatDoc("redo");
            return false;
        }
        if (e.keyCode === 90 && e.ctrlKey) {
            e.preventDefault();
            that.formatDoc("undo");
            return false;
        }
        if (e.keyCode === 13) {
            if (that.getParentWithTypeOfRange(["li", "ul", "ol"]) === undefined) {
                e.preventDefault();
                that.insertBreakAtRange();
                return false;
            }
        }
        return true;
    }

    updateEditor(): void {
        this.setHTML($(this.textArea).val().toString());
        this.CleanUpCSS();
    }

    updateTextArea(): void {
        $(this.textArea).val(formatHtmlString(this.getHTML()));
    }

    setHTML(value: string): void {
        $(this.editor).html(value);
    }
    getHTML(): string {
        return $(this.editor).html();
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

    setCaretAtBeginning(node: Node): void {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        range.collapseToPoint(node, 0);
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
            case ("formatltr"):
                return this.getDirection() === Direction.LTR;
            case ("formatrtl"):
                return this.getDirection() === Direction.RTL;
            default:
                if (document.queryCommandEnabled(cmd)) {
                    return document.queryCommandState(cmd);
                }
        }
    }

    getFont(property: string): string | number {
        let attr: string = "";
        if (property.toLowerCase() === "fontsize") {
            attr = "size";
            return parseInt(this.getValueOfParentWithAttributeFromRange(attr), undefined);
        } else if (property.toLowerCase() === "fontname") {
            attr = "face";
            return this.getValueOfParentWithAttributeFromRange(attr).toLowerCase();
        }
    }

    getAlignment(): Align {
        let alignment: string = this.getValueOfParentWithPropertyFromRange("text-align");
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
        return this.getParentWithTypeOfRange(["p"]) !== undefined || this.getNodeExactelyInRangeWithType(["p"]) !== undefined;
    }

    formatDoc(cmd: string, showUI?: boolean, value?: any): void {
        this.editor.focus();
        switch (cmd) {
            case ("p"):
                HTMLParsing.removePropertyRecursively(this.surroundRange("p", true, true, true), "text-align");
                break;
            case ("justifyleft"):
                this.applyPropertyToRange("text-align", "left", "p");
                break;
            case ("justifycenter"):
                this.applyPropertyToRange("text-align", "center", "p");
                break;
            case ("justifyright"):
                this.applyPropertyToRange("text-align", "right", "p");
                break;
            case ("justifyfull"):
                this.applyPropertyToRange("text-align", "justify", "p");
                break;
            case ("justifyreset"):
                this.removePropertyFromRange("text-align");
                break;
            case ("undo"):
                this.undoManager.undo();
                break;
            case ("redo"):
                this.undoManager.redo();
                break;
            case ("formatltr"):
                this.changeDirection(Direction.LTR);
                break;
            case ("formatrtl"):
                this.changeDirection(Direction.RTL);
                break;
            case ("outdent"):
                this.outdent();
                break;
            case ("indent"):
                this.indent();
                break;
            case ("insertorderedlist"):
                this.InsertListElementAtRange("ol");
                break;
            case ("insertunorderedlist"):
                this.InsertListElementAtRange("ul");
                break;
            case ("pastetext"):
                this.pasteAsPlainText = true;
                this.formatDoc("paste");
                break;
            case ("pasteword"):
                this.formatDoc("paste");
                this.setHTML(wordFilter(this.getHTML()));
                break;
            default:
                if (document.queryCommandEnabled(cmd)) {
                    document.execCommand(cmd, showUI, value);
                }
                break;
        }
        this.editor.focus();
        this.undoManager.onChange(this.undoManager);
    }

    createLink(url: string, target: string): any {
        this.editor.focus();
        this.restoreSelection();
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        let link: Node = $("<a/>").attr("href", url).attr("target", target).attr("shape", "rect")[0];
        if (range.collapsed) {
            $(link).text("new link");
            this.insertNodeAtRange(link);
        } else {
            range.surroundContents(link);
        }
    }

    outdent(): void {
        this.saveSelection();
        if (this.getDirection() === Direction.LTR) {
            this.addToPropertyFromRange("marginLeft", -40, "p");
        } else {
            this.addToPropertyFromRange("marginRight", -40, "p");
        }
        this.restoreSelection();
    }

    indent(): void {
        this.saveSelection();
        if (this.getDirection() === Direction.LTR) {
            this.addToPropertyFromRange("marginLeft", 40, "p");
        } else {
            this.addToPropertyFromRange("marginRight", 40, "p");
        }
        this.restoreSelection();
    }

    groupChildNodesFromRange(range: RangyRange, keepTextOnly: boolean = false, elementsToGroup: string[] = this.markUpNodeNames,
        elementsToBreakAfter: string[] = ["br"], elementsToRemove: string[] = ["br"]): Node[][] {
        let result: Node[][] = [];
        let children: Node[];
        if (range === undefined) {
            range = this.getFirstRange();
            if (range === undefined) {
                return result;
            }
        }
        if (range.collapsed) {
            // let commonAncestorContainer:Node = range.startContainer;
            // if (commonAncestorContainer === this.editor || commonAncestorContainer === undefined) {
            //     return result;
            // }
            // children = [range.commonAncestorContainer];
            return result;
        }
        children = this.getNodesInRange(range, NodesInRange.ChildrenAll, [1, 3]);
        let parent: Node = this.getParentWithTypeOfRange([], range);
        parent = parent === undefined ? this.editor : parent;
        let grouped: Node[][];
        grouped = HTMLParsing.groupChildNodes(parent, elementsToGroup, elementsToBreakAfter, elementsToRemove, keepTextOnly);
        grouped.forEach(group => {
            let flag: boolean = false;
            group.forEach((value) => {
                let temp: any = value;
                while (!flag && temp !== undefined && temp !== this.editor) {
                    if (children.indexOf(temp) !== -1) {
                        flag = true;
                    }
                    temp = temp.parentNode;
                }
            });
            if (flag) {
                result.push(group);
            }
        });
        return result;
    }

    surroundRange(tagName: string, toggle: boolean = true, clean: boolean = true, insertBR: boolean = true): HTMLElement {
        this.saveSelection();
        tagName = tagName.toLowerCase();
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return undefined;
        }
        let element: HTMLElement = this.getParentWithTypeOfRange([tagName], range);
        if (element !== undefined) {
            if (toggle) {
                if (clean) {
                    HTMLParsing.removeTagKeepAttributesRecursive(element);
                } else {
                    HTMLParsing.removeTagKeepAttributes(element);
                }
            }
            return element;
        }
        let newElement: HTMLElement = document.createElement(tagName);
        let wrapper: HTMLElement;
        if (range.collapsed) {
            let container: Node = this.getParentWithTypeOfRange([], range, this.markUpNodeNames);
            container = container === undefined ? this.getHighestNodeFromRange(range) : container;
            container = container === undefined ? this.editor : container;
            wrapper = this.surroundContainerWithElement(container, newElement);
            // wrapper = $(this.groupChildNodesFromRange(range, false, true)).wrapAll(newElement).parent()[0];
        } else {

            let children: Node[] = this.getNodesInRange(range, NodesInRange.ChildrenAll, [1, 3]);

            if (this.getNodesInRange(range, NodesInRange.Intersecting, [1]).length === 0) {
                if (children.length === 1) {
                    wrapper = this.surroundContainerWithElement(children[0], newElement);
                } else {
                    range.surroundContents(newElement);
                    wrapper = newElement;
                }
            } else {
                if (children.length === children[0].parentNode.childNodes.length) {
                    wrapper = this.surroundContainerWithElement(children[0].parentNode, newElement);
                } else {
                    wrapper = $(children).wrapAll(newElement).parent()[0];
                }
            }
        }
        if (wrapper === undefined) {
            return wrapper;
        }
        if (clean) {
            if (wrapper.childNodes.length === 1) {
                HTMLParsing.removeTagKeepAttributesRecursiveInsertBRChildren(wrapper.firstChild);
            } else {
                HTMLParsing.removeTagKeepAttributesChildren(wrapper, [tagName], insertBR);
            }
        }
        this.restoreSelection();
        return wrapper;
    }

    applyPropertyToRange(property: string, value: string, tagName: string, cleanTag: boolean = true,
        insertBR: boolean = true, cleanCSS: boolean = true): HTMLElement {
        let element: HTMLElement = this.surroundRange(tagName, false, cleanTag, insertBR);
        if (element === undefined) {
            return undefined;
        }
        element.style[property] = value;
        if (cleanCSS) {
            HTMLParsing.removePropertyChildren(element, property);
        }
        return element;
    }

    addToPropertyFromRange(property: string, diff: number, tagName: string, cleanTag: boolean = true,
        insertBR: boolean = true, cleanCSS: boolean = true): HTMLElement {
        let element: HTMLElement = this.surroundRange(tagName, false, cleanTag, insertBR);
        if (element === undefined) {
            return undefined;
        }
        if (element.style[property] === undefined || element.style[property] === "") {
            element.style[property] = "0px";
        }
        let value: number = parseInt(element.style[property], undefined);
        value = value + diff;
        if (value <= 0) {
            element.style[property] = "";
        } else {
            element.style[property] = value + "px";
        }
        if (cleanCSS) {
            HTMLParsing.removePropertyChildren(element, property);
        }
        HTMLParsing.removeDefaultCSS(element);
        return element;
    }

    changeDirection(direction: Direction): void {
        this.saveSelection();
        if (direction === Direction.RTL) {
            let element: HTMLElement = HTMLParsing.castNodeToHTMLElement(this.editor.firstChild);
            if (element !== undefined && this.editor.childNodes.length === 1
                && element.nodeName.toLowerCase() === "div") {
                $(element).css("direction", "rtl");
            } else {
                let par: HTMLElement = $("<div/>").css("direction", "rtl")[0];
                $(this.editor).contents().wrapAll(par);
            }
            HTMLParsing.removePropertyChildren(this.editor.firstChild, "direction");
        } else {
            let firstChild: HTMLElement = HTMLParsing.castNodeToHTMLElement(this.editor.firstChild);
            HTMLParsing.removePropertyChildren(this.editor, "direction");
        }
        this.restoreSelection();
    }

    insertBreakAtRange(): void {
        let node: Node = $("<br>")[0];
        this.insertNodeAtRange(node);
        this.checkLastBreak(node);
    }

    checkLastBreak(node: Node): void {
        if (this.editor.lastChild === node) {
            let lastBreak: Node = $("<br>")[0];
            this.insertNodeAtRange(lastBreak, CaretPosition.Before);
        }
    }
    insertHTMLAtRange(value: string, caretPosition: CaretPosition = CaretPosition.After): void {
        let span: HTMLElement = $("<span/>").html(value)[0];
        this.insertNodeAtRange(span, CaretPosition.After);
        $(span).contents().unwrap();
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

    InsertListElementAtRange(nodeName: string): void {
        if (["ul", "ol"].indexOf(nodeName) === -1) {
            return;
        }
        let li: HTMLElement = $("<li/>")[0];
        let list: HTMLElement = $("<" + nodeName + "/>")[0];
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        let element: HTMLElement = this.getParentWithTypeOfRange(["ol", "ul"], range);
        if (element !== undefined) {
            if (element.nodeName !== nodeName) {
                HTMLParsing.replaceTag(element, list);
            }
            return;
        }
        if (range.collapsed) {
            let container: HTMLElement = this.getParentWithTypeOfRange(["p"], range);
            if (container !== undefined) {
                $(list).insertAfter(container);
            } else {
                this.insertNodeAtRange(list);
            }
        } else {
            let groups: Node[][];
            groups = this.groupChildNodesFromRange(range, true);
            groups.forEach(group => $(list).append($("<li/>").append($(group))));
            this.insertNodeAtRange(list);
        }
        $(list).append(li);
        this.setCaretAtBeginning(li);
    }

    surroundContainerWithElement(container: Node, element: HTMLElement): HTMLElement {
        if (container === this.editor) {
            return <HTMLElement>$(this.editor).contents().wrapAll(element).parent()[0];
        } else if (["span", "div"].indexOf(container.nodeName.toLowerCase()) !== -1) {
            return HTMLParsing.replaceTag(<HTMLElement>container, element);
        } else if (container.parentNode.childNodes.length === 1) {
            return this.surroundContainerWithElement(container.parentNode, element);
        } else {
            return $(container).wrap(element).parent()[0];
        }
    }

    removePropertyFromRange(property: string): void {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        if (range.collapsed) {
            let container: Node = this.getParentWithPropertyFromRange(property);
            if (container !== undefined) {
                HTMLParsing.removePropertyRecursively(container, property);
            }
        }
        $(this.getNodesInRange(range, NodesInRange.All)).each((index, element) => HTMLParsing.removeProperty(element, property));
    }

    removeAttributeFromRange(attribute: string): void {
        let range: RangyRange = this.getFirstRange();
        if (range === undefined) {
            return;
        }
        if (range.collapsed) {
            let container: Node = this.getParentWithAttributeFromRange(attribute);
            if (container !== undefined) {
                HTMLParsing.removeAttributeRecursively(container, attribute);
            }
        }
        $(this.getNodesInRange(range, NodesInRange.All)).each((index, element) => HTMLParsing.removeAttribute(element, attribute));
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
        if (container !== undefined && container[attribute] !== "" && container[attribute] !== undefined) {
            return container;
        }
        return this.getParentWithAttributeFromNode(attribute, container);
    }

    getParentWithAttributeFromNode(attribute: string, node: Node): HTMLElement {
        let parent: HTMLElement = undefined;
        $(node).parentsUntil(this.editor).each((index, element) => {
            if (element[attribute] !== undefined && element[attribute] !== "") {
                parent = element;
                return false;
            }
        });
        return parent;
    }

    getParentWithTypeOfRange(nodeNames: string[] = [], range?: RangyRange, blackList: string[] = []): HTMLElement {
        if (range === undefined) {
            range = this.getFirstRange();
        }
        if (range === undefined) {
            return undefined;
        }
        let container: Node = range.commonAncestorContainer;
        if (container.nodeType === 1 && (<HTMLElement>container).className !== "rangySelectionBoundary" &&
            (nodeNames.length === 0 || nodeNames.indexOf(container.nodeName.toLowerCase()) !== -1) &&
            (blackList.indexOf(container.nodeName.toLowerCase()) === -1)) {
            return <HTMLElement>container;
        }
        return this.getParentWithTypeOfNode(container, nodeNames, blackList);
    }

    getParentWithTypeOfNode(node: Node, nodeNames: string[] = [], blackList: string[] = [], ): HTMLElement {
        let parent: HTMLElement = undefined;
        $(node).parentsUntil(this.editor).each((index: number, element: HTMLElement): false => {
            if (element.nodeType === 1 && (<HTMLElement>element).className !== "rangySelectionBoundary" &&
                (nodeNames.length === 0 || nodeNames.indexOf(element.nodeName.toLowerCase()) !== -1) &&
                (blackList.indexOf(element.nodeName.toLowerCase()) === -1)) {
                parent = element;
                return false;
            }
        });
        return parent;
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



        // removeCSSFromRange(range: RangyRange, property: string): void {
    //     let nodes: Node[] = range.getNodes([1], (node: Node) => { return range.containsNodeContents(node); });
    //     nodes.forEach((node) => this.removeCSSElement(<Element>node, property));
    // }
    // removeCSSElement(element: Element, property: string): void {
    //     $(element).css(property, "");
    // }



