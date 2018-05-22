import { EditArea } from "./edit-area";
import { Toolbar } from "./toolbar";

export abstract class ToolbarItem {
    container:HTMLElement;
    toolbar: Toolbar;
    constructor(toolbar:Toolbar) {
        this.toolbar = toolbar;
        this.container = document.createElement("li");
    }
    checkState():void {
        return;
    }
}

export class ColorPickerItem extends ToolbarItem {

    selectButton: HTMLElement;
    applyButton: HTMLElement;
    color: string;
    command:string;

    constructor(name: string, text: string, toolbar: Toolbar, defaultColor: string, command?:string) {
        super(toolbar);
        this.command = command?command:name;
        this.color = defaultColor;
        this.applyButton = $("<button/>").appendTo(this.container).attr("title", text).addClass(name)
                            .css("float", "left").click((e) => {this.execute();this.toolbar.buttonClick(e);})[0];
        this.selectButton = $("<button/>").appendTo(this.container).attr("title", text).addClass("selector")
                            .click((e) => {this.openColorPicker(); e.preventDefault();})[0];
        this.showColor();
    }

    showColor():void {
        $(this.applyButton).css("background-color", this.color);
    }
    execute(): void {
        this.toolbar.editArea.formatDoc(this.command,false,this.color);
    }

    openColorPicker(): void {
        return;
    }
}