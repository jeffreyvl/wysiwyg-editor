import { EditArea } from "./edit-area";
import { Dictionary, ActiveMode, ToolbarOptions, Direction } from "./util";
import { ToolbarItem, ColorPickerItem} from "./toolbar-item";
import { ToolbarButton, ChangeDirectionButton, ToolbarButtonBase } from "./toolbar-button";

export class Toolbar {

    buttonContainer: HTMLElement;
    editArea: EditArea;
    toolbarItems: Dictionary<ToolbarItem> = new Dictionary();
    options: ToolbarOptions;
    simpleOptions: string[];
    fullOptions:string[];
    constructor(toolbar:HTMLElement, editArea:EditArea, options:ToolbarOptions) {
        if (toolbar.nodeName !== "DIV") {
            throw Error("Invalid HTMLElement");
        }
        this.editArea = editArea;
        this.buttonContainer = $("<ul/>")[0];
        $(toolbar).append(this.buttonContainer);
        this.options = options;
        this.simpleOptions = ["undo"];
        this.fullOptions = ["undo","redo", "|",
                            "bold", "italic", "underline", "strikethrough", "subscript", "superscript", "|",
                            "formatltr", "formatrtl", "|",
                            "forecolor", "resetforecolor", "|",
                            "backcolor", "resetbackcolor", "|",];
        this.initItems();
        this.renderItems();
        let listener: ()=>boolean = () => { this.checkState(); return true; };
        $(this.editArea.editor).mouseup(listener).mouseup(listener).keydown(listener).keyup(listener).blur(() => this.resetToolbar());
    }

    buttonClick(e:any):boolean {
        this.checkState();
        e.preventDefault();
        return false;
    }

    renderItems():void {
        $(this.buttonContainer).empty();
        let items: string[] = this.options === ToolbarOptions.Simple ? this.simpleOptions : this.fullOptions;
        for (let item of items) {
            if (item === "|") {
                $(this.buttonContainer).append($("<li/>").addClass("seperator"));
            } else {
                $(this.buttonContainer).append(this.toolbarItems[item].container);
            }
        }
        this.checkState();
    }

    checkState(): void {
        for (let key of Object.keys(this.toolbarItems)) {
            this.toolbarItems[key].checkState();
        }
    }

    resetToolbar(): void {
        for (let key of Object.keys(this.toolbarItems)) {
            if (this.toolbarItems[key] instanceof ToolbarButton) {
                (<ToolbarButton>this.toolbarItems[key]).removeActive();
            }
        }
    }

    initItems():void {
        this.toolbarItems.undo = new ToolbarButton("undo", "Ongedaan maken",this, false);
        this.toolbarItems.redo = new ToolbarButton("redo", "Opnieuw",this, false);
        this.toolbarItems.bold = new ToolbarButton("bold", "Vet",this);
        this.toolbarItems.italic = new ToolbarButton("italic", "Cursief",this);
        this.toolbarItems.underline = new ToolbarButton("underline", "Onderstrepen",this);
        this.toolbarItems.strikethrough = new ToolbarButton("strikethrough", "Doorhalen",this);
        this.toolbarItems.subscript = new ToolbarButton("subscript", "Subscript",this);
        this.toolbarItems.superscript = new ToolbarButton("superscript", "SuperScript",this);
        this.toolbarItems.formatltr = new ChangeDirectionButton("formatltr", "Links naar rechts uitlijnen",this, Direction.LTR);
        this.toolbarItems.formatrtl = new ChangeDirectionButton("formatrtl", "Recht naar links uitlijnen",this, Direction.RTL);
        this.toolbarItems.forecolor = new ColorPickerItem("forecolor", "Tekstkleur", this, "#FF0000");
        this.toolbarItems.backcolor = new ColorPickerItem("backcolor", "Markeren", this, "#FFFF00");
        this.toolbarItems.resetbackcolor = new ToolbarButton("resetbackcolor", "Tekstkleur verwijderen",
                                            this, false, "removeformat", "backcolor");
        this.toolbarItems.resetforecolor = new ToolbarButton("resetforecolor", "Tekstkleur verwijderen",
                                            this, false, "removeformat", "forecolor");
    }
}