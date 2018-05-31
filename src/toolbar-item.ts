import { EditArea } from "./edit-area";
import { Toolbar } from "./toolbar";

export abstract class ToolbarItem {
    container:HTMLElement;
    toolbar: Toolbar;
    constructor(toolbar:Toolbar) {
        this.toolbar = toolbar;
        this.container = document.createElement("li");
    }
}
export interface ItemToCheck {

    checkState():void;
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
                            .css("float", "left").click((e) => {e.preventDefault();this.execute();return false;})[0];
        this.selectButton = $("<button/>").appendTo(this.container).attr("title", text).addClass("selector")
                            .click((e) => {e.preventDefault();this.openColorPicker();})[0];
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

export class DropwdownItem extends ToolbarItem {

    command:string;
    options: [[string|number, string]];
    dropDownList: HTMLElement;
    constructor(name:string,text:string, toolbar:Toolbar, options: [[string|number, string]], command?:string) {
        super(toolbar);
        this.command = command;
        this.options = options;
        $(this.container).append(text+"  ").addClass(name);
        this.dropDownList = $("<select/>").appendTo(this.container).change((e)=> {e.preventDefault();this.execute();return false;})[0];
        options.forEach((val) => {
            $(this.dropDownList).append($("<option></option>")
                           .attr("value",val[0])
                           .text(val[1]));
       });
    }

    getCurrentValue():string|number {
        return (<HTMLSelectElement>this.dropDownList).value;
    }
    execute(): void {
        let currentValue: string|number = this.getCurrentValue();
        if (currentValue === "default") {
            this.toolbar.editArea.formatDoc("removeformat", false, this.command);
        }
        this.toolbar.editArea.formatDoc(this.command, false, currentValue);
    }

}