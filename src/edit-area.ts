import { ActiveMode, Direction } from "./util";
import rangy from "rangy/lib/rangy-core.js";
import "rangy/lib/rangy-highlighter";
import "rangy/lib/rangy-classapplier";
import "rangy/lib/rangy-textrange";
import "rangy/lib/rangy-serializer";
import "rangy/lib/rangy-selectionsaverestore";

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
        let listener: () => boolean = () => { this.updateTextArea(); return true; };
        // .on("paste", (e) => this.onPaste(e));
        editor.contentEditable = "true";
        this.updateEditor();
    }

    onPaste(e: any): boolean {
        if (!this.pasteFlag) {
            this.pasteFlag = true;
            this.formatDoc("paste");
        } else {
            this.pasteFlag = false;
            return true;
        }
        e.stopPropagation();
        e.preventDefault();
        return false;
    }
    onCut(e: any): boolean {
        if (!this.cutFlag) {
            this.cutFlag = true;
            this.formatDoc("cut");
        } else {
            this.cutFlag = false;
            return true;
        }
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    updateEditor(): void {
        $(this.editor).html($(this.textArea).val().toString());
        this.CleanUpCSS();
    }

    updateTextArea(): void {
        $(this.textArea).val($(this.editor).html());
    }

    updateMode(mode: ActiveMode): boolean {
        if (mode === undefined) {
            return false;
        }
        if (mode === ActiveMode.Html) {
            this.updateTextArea();
            $(this.editor).hide();
            $(this.textArea).show();
        } else {
            this.updateEditor();
            $(this.textArea).hide();
            $(this.editor).show();
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
        if (this.checkrtl()) {
            return Direction.RTL;
        } else {
            return Direction.LTR;
        }
    }
    checkrtl(): boolean {
        if (this.editor.childNodes.length === 1) {
            let firstChild: HTMLElement = <HTMLElement>this.editor.firstChild;
            if (firstChild.nodeType === 1 && firstChild.style.direction === "rtl") {
                return true;
            }
        }
        return false;
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

    removeCSS(range: RangyRange, property: string): void {
        let nodes: Node[] = range.getNodes([1], (node: Node) => { return range.containsNodeContents(node); });
        nodes.forEach((node) => this.removeCSSElement(<Element>node, property));
    }

    removeCSSElement(element: Element, property: string): void {
        $(element).css(property, "");
    }

    CleanUpCSS(): void {
        let tags: string[] = ["span", "div"];
        $(this.editor).find("*").each((index, element) => this.replaceCSSWithMarkUp(element, tags));
    }

    replaceCSSWithMarkUp(element: HTMLElement, tags:string[]): void {
        if (tags.indexOf(element.tagName.toLowerCase()) === -1) {
            return;
        }
        this.replaceCSSWithMarkUpNode(element, "fontWeight", { bold: "strong" });
        this.replaceCSSWithMarkUpNode(element, "fontStyle", { italic: "em" });
        this.replaceCSSWithMarkUpNode(element, "textDecoration", { underline: "u", "line-through": "strike" });
        this.replaceCSSWithMarkUpNode(element, "verticalAlign", { sub: "sub", super: "sup" });

        this.cleanUpTags(element);
    }

    replaceCSSWithMarkUpNode(element: HTMLElement, property: string, transform: {}): void {
        let style: string = element.style[property];

        if (style === "" || style === undefined) {
            return;
        }
        element.style[property] = "";
        for (let key of Object.keys(transform)) {
            if (style.indexOf(key) !== -1) {
                $(element).contents().wrapAll($("<" + transform[key] + "/>"));
            }
        }
    }

    cleanUpTags(element: HTMLElement): void {
        if (element.getAttribute("style") === null ||
            element.getAttribute("style") === "") {
            $(element).contents().unwrap();
        }
    }

}