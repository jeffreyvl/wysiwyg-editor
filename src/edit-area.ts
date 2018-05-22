import { ActiveMode, Direction } from "./util";

export class EditArea {
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
        // $(this.editor).blur(() => this.previousRange = this.getRange());
        let listener: () => boolean = () => { this.updateTextArea(); return true; };
        // $(this.editor).mousedown(listener).mouseup(listener).keydown(listener).keyup(listener).blur(listener)
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
            if (firstChild.nodeType !== 3 && firstChild.style.direction === "rtl") {
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
        this.previousRange = this.getRange();
        if (direction === Direction.RTL) {
            let par: HTMLElement = $("<p/>").css("direction", "rtl")[0];
            let range: Range = document.createRange();
            range.selectNodeContents(this.editor);
            range.surroundContents(par);
        } else {
            let node: Node = this.editor.firstChild;
            this.editor.removeChild(this.editor.firstChild);
            while (node.firstChild) {
                this.editor.appendChild(node.firstChild);
            }
        }
        this.editor.focus();
        this.restoreRange();
    }

    getSelection(): Selection {
        if (window.getSelection) {
            return window.getSelection();
        }
        if ((<any>document).selection) {
            return (<any>document).selection;
        }
        return null;
    }

    getRange(): Range {
        let selection: Selection = this.getSelection();
        if (!selection) {
            return null;
        }
        if (selection.getRangeAt) {
            if (selection.rangeCount > 0) {
                return selection.getRangeAt(0);
            }
        }
        if ((<any>selection).createRange) {
            return (<any>selection).createRange();
        }
        return null;
    }

    restoreRange(): void {
        if (this.previousRange) {
            let selection: Selection = this.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.previousRange);
        }
    }

    formatDoc(cmd: string, showUI?: boolean, value?: any): void {
        this.editor.focus();
        if (document.queryCommandEnabled(cmd)) {
            document.execCommand(cmd, showUI, value);
            this.updateTextArea();
        }
        this.editor.focus();
    }
}