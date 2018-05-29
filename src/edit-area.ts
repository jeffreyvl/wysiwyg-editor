import { ActiveMode, Direction, CaretPosition } from "./util";
import rangy from "rangy/lib/rangy-core.js";
import "rangy/lib/rangy-highlighter";
import "rangy/lib/rangy-classapplier";
import "rangy/lib/rangy-textrange";
import "rangy/lib/rangy-serializer";
import "rangy/lib/rangy-selectionsaverestore";
import { Helper } from "./helper";

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
        $(this.editor).keydown(e => this.editorKeyPress(e));
        this.updateEditor();
    }

    editorKeyPress(e: JQuery.Event<HTMLElement, null>): boolean {
        // if (e.keyCode === 13 && !this.CheckIfRangeIsInsideContainerWithType(["ul", "ol", "li"])) {
        //     this.insertBreakAtRange();
        //     e.preventDefault();
        //     return false;
        // }
        return true;
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

    CheckIfRangeIsInsideContainerWithType(nodeNames: string[]): boolean {
        let range: RangyRange = this.getFirstRange();
        let container: Node = range.commonAncestorContainer;
        if (nodeNames.indexOf(container.nodeName.toLowerCase()) !== -1) {
            return true;
        }
        return this.checkIfNodeIsInsideContainerWithType(nodeNames, container);
    }

    checkIfNodeIsInsideContainerWithType(nodeNames: string[], container: Node): boolean {
        let found: boolean = false;
        $(container).parentsUntil(this.editor).each((index: number, element: HTMLElement): void => {
            if (nodeNames.indexOf(element.nodeName.toLowerCase()) !== -1) {
                found = true;
            }
        });
        return found;
    }

    getParentContainerOfRangeWithType(nodeNames: string[]): Node | undefined {
        let range: RangyRange = this.getFirstRange();
        let container: Node = range.commonAncestorContainer;
        if (nodeNames.indexOf(container.nodeName.toLowerCase()) !== -1) {
            return container;
        }
        return this.getParentContainerOfNodeWithType(nodeNames, container);
    }

    getParentContainerOfNodeWithType(nodeNames: string[], container: Node): Node | undefined {
        let node: Node = undefined;
        $(container).parentsUntil(this.editor).each((index: number, element: HTMLElement): void => {
            if (nodeNames.indexOf(element.nodeName.toLowerCase()) !== -1) {
                node = element;
            }
        });
        return node;
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

    setCaretAfter(node: Node): void {
        let range: RangyRange = this.getFirstRange();
        range.collapseAfter(node);
        rangy.getSelection().setSingleRange(range);
    }

    setCaretBefore(node: Node): void {
        let range: RangyRange = this.getFirstRange();
        range.collapseBefore(node);
        rangy.getSelection().setSingleRange(range);
    }

    updateEditor(): void {
        $(this.editor).html($(this.textArea).val().toString());
        this.CleanUpCSS();
    }

    updateTextArea(): void {
        $(this.textArea).val(Helper.FormatHtmlString($(this.editor).html()));
    }

    updateMode(mode: ActiveMode): boolean {
        if (mode === undefined) {
            return false;
        }
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

    checkState(cmd: string): boolean {
        if (document.queryCommandEnabled(cmd)) {
            return document.queryCommandState(cmd);
        }
    }

    getDirection(): Direction {
        if (this.editor.childNodes.length === 1) {
            let firstChild: HTMLElement = <HTMLElement>this.editor.firstChild;
            if (firstChild.nodeType === 1 && firstChild.style.direction === "rtl") {
                return Direction.RTL;
            }
        }
        return Direction.LTR;
    }

    changeDirection(direction: Direction): boolean {
        if (direction === this.getDirection()) {
            return false;
        }
        this.editor.focus();
        this.saveSelection();
        if (direction === Direction.RTL) {
            if (this.editor.childNodes.length === 1 && this.editor.firstChild.nodeType === 1
                && ((<Element>this.editor.firstChild).nodeName === "DIV" || (<Element>this.editor.firstChild).nodeName === "SPAN")) {
                $(<Element>this.editor.firstChild).css("direction", "rtl");
            } else {
                let par: HTMLElement = $("<div/>").css("direction", "rtl")[0];
                $(this.editor).contents().wrapAll(par);
            }
        } else {
            let element: Element = <Element>this.editor.firstChild;
            $(element).css("direction", "");
            if (element.getAttribute("style") === null ||
                element.getAttribute("style") === "") {
                $(element).contents().unwrap();
            }
        }
        this.editor.focus();
        this.restoreSelection();
        return true;
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

    getFirstRange(): RangyRange {
        var sel: RangySelection = rangy.getSelection();
        return sel.rangeCount ? sel.getRangeAt(0) : null;
    }

    formatDoc(cmd: string, showUI?: boolean, value?: any): void {
        this.editor.focus();
        if (document.queryCommandEnabled(cmd)) {
            document.execCommand(cmd, showUI, value);
            this.updateTextArea();
        }
        this.editor.focus();
    }

    // removeCSS(range: RangyRange, property: string): void {
    //     let nodes: Node[] = range.getNodes([1], (node: Node) => { return range.containsNodeContents(node); });
    //     nodes.forEach((node) => this.removeCSSElement(<Element>node, property));
    // }

    // removeCSSElement(element: Element, property: string): void {
    //     $(element).css(property, "");
    // }

    CleanUpCSS(): void {
        $(this.editor).find("*").each((index, element) => {
            this.replaceCSSWithMarkUp(element);
            this.replaceCSSWithAttribute(element);
        });
    }

    replaceCSSWithMarkUp(element: HTMLElement): void {
        this.replaceCSSWithMarkUpNode(element, "fontWeight", { bold: $("<strong/>") });
        this.replaceCSSWithMarkUpNode(element, "fontStyle", { italic: $("<em/>") });
        this.replaceCSSWithMarkUpNode(element, "textDecoration", { underline: $("<u/>"), "line-through": $("<strike/>") });
        this.replaceCSSWithMarkUpNode(element, "verticalAlign", { sub: $("<sub/>"), super: $("<sup/>") });
        this.cleanUpTag(element);
    }

    replaceCSSWithAttribute(element: HTMLElement): void {
        this.replaceCSSWithAttributeNode(element, "text-align", "align",
            { left: "left", center: "center", right: "right", justify: "justify" });
    }

    replaceCSSWithAttributeNode(element: HTMLElement, property: string, attribute: string, transform: {}): void {
        let style: string = this.getAndResetStyle(element, property);
        if (style === "") {
            return;
        }
        for (let key of Object.keys(transform)) {
            if (style.indexOf(key) !== -1) {
                element[attribute] = transform[key];
            }
        }
    }
    replaceCSSWithMarkUpNode(element: HTMLElement, property: string, transform: {}): void {
        let style: string = this.getAndResetStyle(element, property);
        if (style === "") {
            return;
        }
        for (let key of Object.keys(transform)) {
            if (style.indexOf(key) !== -1) {
                $(element).contents().wrapAll(transform[key]);
            }
        }
    }

    getAndResetStyle(element: HTMLElement, property: string): string {
        let style: string = element.style[property];

        if (style === "" || style === undefined) {
            return "";
        }
        element.style[property] = "";
        return style;
    }

    cleanUpTag(element: HTMLElement): void {
        if (["span"].indexOf(element.tagName.toLowerCase()) === -1) {
            return;
        }
        if (element.getAttribute("style") === null ||
            element.getAttribute("style") === "") {
            $(element).contents().unwrap();
        }
    }

}