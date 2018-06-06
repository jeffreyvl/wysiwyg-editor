// tslint:disable-next-line:typedef
declare function require(name:string);
// tslint:disable-next-line:typedef
var Manager = require("undo-manager");
import { EditArea } from "./edit-area";

export class UndoManager {

    editor: EditArea;
    manager: any;
    currentValue: string;
    constructor(editor: EditArea) {
        this.editor = editor;
        this.manager = new Manager();
        this.currentValue = this.editor.getHTML();
    }

    onChange(EditorUndoManager:UndoManager): boolean {
        let that:UndoManager = EditorUndoManager;
        if (that.currentValue === that.editor.getHTML()) {
            return;
        }
        let oldValue: string = that.currentValue;
        let newValue: string = that.editor.getHTML();
        that.manager.add({
            undo: ()=> {
                that.editor.setHTML(oldValue);
            },
            redo: () => {
                that.editor.setHTML(newValue);
            }
        });
        that.currentValue = newValue;
        return true;
    }

    undo(): void {
        if (!this.manager.hasUndo()) {
            return;
        }
        this.manager.undo();
        this.currentValue = this.editor.getHTML();
    }

    redo(): void {
        if (!this.manager.hasRedo()) {
            return;
        }
        this.manager.redo();
        this.currentValue = this.editor.getHTML();
    }
}
