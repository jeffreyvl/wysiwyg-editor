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
        this.close(false);
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

    close(force:boolean = true): void {
        this.isOpen=false;
        $(this.colorPicker).hide();
        this.toolbar.unRegisterPopup(this);
        this.toolbar.editArea.editor.contentEditable = "true";
        if (force) {
        this.toolbar.editArea.removeSavedSelection();
        }
    }
    

    createColorPicker(): void {

        let body: HTMLElement = $("<body/>").appendTo($("<table/>").attr("cellSpacing", 1).attr("cellPadding", 0)
            .addClass("colortable").appendTo(this.colorPicker))[0];

        let tr: HTMLElement;
        let td: HTMLElement;
        let i: number = 0;
        let colors: string[] = [
            "#000000","#000000","#000000","#000000","#003300","#006600","#009900","#00cc00","#00ff00","#330000","#333300","#336600","#339900","#33cc00","#33ff00","#660000","#663300","#666600","#669900","#66cc00","#66ff00","#000000","#333333","#000000","#000033","#003333","#006633","#009933","#00cc33","#00ff33","#330033","#333333","#336633","#339933","#33cc33","#33ff33","#660033","#663333","#666633","#669933","#66cc33","#66ff33","#000000","#666666","#000000","#000066","#003366","#006666","#009966","#00cc66","#00ff66","#330066","#333366","#336666","#339966","#33cc66","#33ff66","#660066","#663366","#666666","#669966","#66cc66","#66ff66","#000000","#999999","#000000","#000099","#003399","#006699","#009999","#00cc99","#00ff99","#330099","#333399","#336699","#339999","#33cc99","#33ff99","#660099","#663399","#666699","#669999","#66cc99","#66ff99","#000000","#cccccc","#000000","#0000cc","#0033cc","#0066cc","#0099cc","#00cccc","#00ffcc","#3300cc","#3333cc","#3366cc","#3399cc","#33cccc","#33ffcc","#6600cc","#6633cc","#6666cc","#6699cc","#66cccc","#66ffcc","#000000","#ffffff","#000000","#0000ff","#0033ff","#0066ff","#0099ff","#00ccff","#00ffff","#3300ff","#3333ff","#3366ff","#3399ff","#33ccff","#33ffff","#6600ff","#6633ff","#6666ff","#6699ff","#66ccff","#66ffff","#000000","#ff0000","#000000","#990000","#993300","#996600","#999900","#99cc00","#99ff00","#cc0000","#cc3300","#cc6600","#cc9900","#cccc00","#ccff00","#ff0000","#ff3300","#ff6600","#ff9900","#ffcc00","#ffff00","#000000","#00ff00","#000000","#990033","#993333","#996633","#999933","#99cc33","#99ff33","#cc0033","#cc3333","#cc6633","#cc9933","#cccc33","#ccff33","#ff0033","#ff3333","#ff6633","#ff9933","#ffcc33","#ffff33","#000000","#0000ff","#000000","#990066","#993366","#996666","#999966","#99cc66","#99ff66","#cc0066","#cc3366","#cc6666","#cc9966","#cccc66","#ccff66","#ff0066","#ff3366","#ff6666","#ff9966","#ffcc66","#ffff66","#000000","#ffff00","#000000","#990099","#993399","#996699","#999999","#99cc99","#99ff99","#cc0099","#cc3399","#cc6699","#cc9999","#cccc99","#ccff99","#ff0099","#ff3399","#ff6699","#ff9999","#ffcc99","#ffff99","#000000","#00ffff","#000000","#9900cc","#9933cc","#9966cc","#9999cc","#99cccc","#99ffcc","#cc00cc","#cc33cc","#cc66cc","#cc99cc","#cccccc","#ccffcc","#ff00cc","#ff33cc","#ff66cc","#ff99cc","#ffcccc","#ffffcc","#000000","#ff00ff","#000000","#9900ff","#9933ff","#9966ff","#9999ff","#99ccff","#99ffff","#cc00ff","#cc33ff","#cc66ff","#cc99ff","#ccccff","#ccffff","#ff00ff","#ff33ff","#ff66ff","#ff99ff","#ffccff","#ffffff"
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
            if (i === 21) {
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