import { EditArea } from "./edit-area";
import { Toolbar } from "./toolbar";
import { Dictionary } from "./util";

export abstract class ToolbarItem {
    container: HTMLElement;
    toolbar: Toolbar;
    constructor(toolbar: Toolbar) {
        this.toolbar = toolbar;
        this.container = document.createElement("li");
    }
    abstract execute(): void;
}
export interface ItemToCheck {

    checkState(): void;
}
export interface ItemWithPopup {
    open():void;
    close():void;
}

export class ColorPickerItem extends ToolbarItem implements ItemWithPopup {

    selectButton: HTMLElement;
    applyButton: HTMLElement;
    color: string;
    command: string;
    colorPicker: HTMLElement;
    isOpen:boolean=false;

    constructor(name: string, text: string, toolbar: Toolbar, defaultColor: string, command?: string) {
        super(toolbar);
        this.command = command ? command : name;
        this.color = defaultColor;
        this.colorPicker = $("<div/>").addClass("colorpicker").hide()[0];
        $(this.container).append(this.colorPicker);
        this.applyButton = $("<button/>").appendTo(this.container).attr("title", text).addClass(name)
            .css("float", "left")[0];
        this.selectButton = $("<button/>").appendTo(this.container).attr("title", text).addClass("selector")[0];
        this.showColor();
        this.createColorPicker();
        this.addHandler();

    }

    addHandler():void {
        $(this.selectButton).click((e) => { e.preventDefault(); this.open(); return false; });
        $(this.applyButton).click((e) => { e.preventDefault(); this.execute(); return false; });
        window.addEventListener("click", e => {
            if (this.isOpen &&!this.colorPicker.contains(<Node>e.target)) {
              this.close();
            }
          });
    }
    setColor(color: string): void {
        this.color = color;
        this.showColor();
        this.close();
    }
    showColor(): void {
        $(this.applyButton).css("background-color", this.color);
    }
    execute(): void {
        this.toolbar.editArea.formatDoc(this.command, false, this.color);
    }

    open(): void {
        this.isOpen = true;
        this.toolbar.registerPopup(this);
        this.toolbar.editArea.saveSelection();
        this.toolbar.editArea.editor.contentEditable = "false";
        $(this.colorPicker).show();

    }

    close(): void {
        this.isOpen=false;
        $(this.colorPicker).hide();
        this.toolbar.unRegisterPopup(this);
        this.toolbar.editArea.editor.contentEditable = "true";
        this.toolbar.editArea.restoreSelection();
    }

    createColorPicker(): void {

        let body: HTMLElement = $("<body/>").appendTo($("<table/>").attr("cellSpacing", 1).attr("cellPadding", 0)
            .addClass("colortable").appendTo(this.colorPicker))[0];

        let tr: HTMLElement;
        let td: HTMLElement;
        let i: number = 0;
        let colors: string[] = [
            "#ffffff",
            "#cccccc",
            "#c0c0c0",
            "#999999",
            "#666666",
            "#333333",
            "#000000",
            "#ffcccc",
            "#ff6666",
            "#ff0000",
            "#cc0000",
            "#990000",
            "#660000",
            "#330000",
            "#ffcc99",
            "#ff9966",
            "#ff9900",
            "#ff6600",
            "#cc6600",
            "#993300",
            "#663300",
            "#ffff99",
            "#ffff66",
            "#ffcc66",
            "#ffcc33",
            "#cc9933",
            "#996633",
            "#663333",
            "#ffffcc",
            "#ffff33",
            "#ffff00",
            "#ffcc00",
            "#999900",
            "#666600",
            "#333300",
            "#99ff99",
            "#66ff99",
            "#33ff33",
            "#33cc00",
            "#009900",
            "#006600",
            "#003300",
            "#99FFFF",
            "#33FFFF",
            "#66CCCC",
            "#00CCCC",
            "#339999",
            "#336666",
            "#003333",
            "#CCFFFF",
            "#66FFFF",
            "#33CCFF",
            "#3366FF",
            "#3333FF",
            "#000099",
            "#000066",
            "#CCCCFF",
            "#9999FF",
            "#6666CC",
            "#6633FF",
            "#6600CC",
            "#333399",
            "#330099",
            "#FFCCFF",
            "#FF99FF",
            "#CC66CC",
            "#CC33CC",
            "#993399",
            "#663366",
            "#330033"
        ];

        colors.forEach(color => {
            if (i === 0) {
                tr = $("<tr/>")[0];
                $(body).append(tr);
            }
            td = $("<td/>").css("background-color", color)
                .click((e) => { e.preventDefault(); this.setColor(color); this.execute(); return false; }).append($("<div/>"))[0];
            $(tr).append(td);
            i++;
            if (i === 7) {
                i = 0;
            }
        });
    }
}

export class DropwdownItem extends ToolbarItem implements ItemToCheck {

    command: string;
    options: Dictionary<string | number>;
    dropDownList: HTMLElement;
    constructor(name: string, text: string, toolbar: Toolbar, options: Dictionary<string | number>, command?: string) {
        super(toolbar);
        this.command = command;
        this.options = options;
        $(this.container).append(text + "  ").addClass(name);
        this.dropDownList = $("<select/>").appendTo(this.container).change(e => { e.preventDefault(); this.execute(); return false; })[0];

        // tslint:disable-next-line:forin
        for (let key in this.options) {
            $(this.dropDownList).append($("<option/>")
                .attr("value", this.options[key])
                .text(key));
        }
    }

    getCurrentValue(): string | number {
        return (<HTMLSelectElement>this.dropDownList).value;
    }

    checkState(): void {
        let documentValue: string | number = this.toolbar.editArea.getFont(this.command);
        let flag: boolean = false;
        // tslint:disable-next-line:forin
        for (let key in this.options) {
            if (key.toLowerCase() === documentValue || this.options[key] === documentValue) {
                flag = true;
                documentValue = this.options[key];
                break;
            }
        }
        if (flag) {
            $(this.dropDownList).val(documentValue);
        } else {
            $(this.dropDownList).val("default");
        }
    }
    execute(): void {
        let currentValue: string | number = this.getCurrentValue();
        if (currentValue === "default") {
            this.toolbar.editArea.formatDoc("removeformat", false, this.command);
        } else {
            this.toolbar.editArea.formatDoc(this.command, false, currentValue);
        }
    }

}