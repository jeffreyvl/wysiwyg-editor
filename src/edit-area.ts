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
    mode: ActiveMode;
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
        this.setMode(ActiveMode.Design);
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
    }

    updateTextArea(): void {
        $(this.textArea).val($(this.editor).html());
    }

    setMode(mode: ActiveMode): void {
        if (this.mode !== undefined && (this.mode === mode || (mode !== ActiveMode.Html || this.mode !== ActiveMode.Html))) {
            return;
        }
        if (mode === ActiveMode.Html) {
            this.updateTextArea();
            $(this.textArea).show();
            $(this.editor).hide();
        } else {
            this.updateEditor();
            $(this.textArea).hide();
            $(this.editor).show();
        }
        this.mode = mode;
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

    changeDirection(direction: Direction): void {
        if (direction === this.getDirection()) {
            return;
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
                $(this.editor.firstChild).contents().unwrap();
            }
        }
        this.editor.focus();
        this.restoreSelection();
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
        if (document.queryCommandEnabled(cmd)) {
            document.execCommand(cmd, showUI, value);
            this.updateTextArea();
        }
        this.editor.focus();
    }
}