import { EditArea } from "./edit-area";
import { Dictionary, ActiveMode, ToolbarOptions, Direction } from "./util";
import { ItemToCheck, ToolbarItem, ColorPickerItem, DropwdownItem } from "./toolbar-item";
import {ToolbarButtonBase, ToolbarButtonExecCommand,
    ToolbarButtonExecCommandCheck, ToggleViewButton, CreateLink,
} from "./toolbar-button";

export class Toolbar {

    buttonContainer: HTMLElement;
    bottomButtonContainer: HTMLElement;
    editArea: EditArea;
    mode:ActiveMode|undefined = undefined;
    toolbarItems: Dictionary<ToolbarItem> = new Dictionary();
    options: ToolbarOptions;
    simpleOptions: string[];
    fullOptions: string[];
    bottomOptions: string[];
    constructor(toolbar: HTMLElement, bottomToolbar: HTMLElement, editArea: EditArea, options: ToolbarOptions) {
        if (toolbar.nodeName !== "DIV" || bottomToolbar.nodeName !== "DIV") {
            throw Error("Invalid HTMLElement");
        }
        this.editArea = editArea;
        this.buttonContainer = $("<ul/>")[0];
        $(toolbar).append(this.buttonContainer);
        this.bottomButtonContainer = $("<ul/>")[0];
        $(bottomToolbar).append(this.bottomButtonContainer);
        this.options = options;
        this.simpleOptions = ["undo"];
        this.fullOptions = ["undo", "redo", "|",
            "bold", "italic", "underline", "strikethrough", "subscript", "superscript", "|",
            "formatltr", "formatrtl", "|",
            "forecolor", "resetforecolor", "|",
            "backcolor", "resetbackcolor", "|",
            "removeformat", "|",
            "font", "|",
            "size", "|",
            "cut", "copy", "paste", "pastetext", "pasteword","|",
            "outdent", "indent","|",
            "paragraph", "justifyleft", "justifycenter", "justifyright", "justifyfull", "justifyreset", "|",
            "orderedlist", "unorderedlist", "|",
            "horizontalrule", "link", "unlink"];
        this.bottomOptions = ["design", "html", "preview"];
        this.initItems();
        this.renderItems();
        this.setMode(ActiveMode.Design);
        let listener: () => boolean = () => { this.checkState(); return true; };
        $(this.editArea.editor).mouseup(listener).mouseup(listener).keydown(listener).keyup(listener).blur(() => this.resetToolbar());
    }

    renderItems(): void {
        $(this.buttonContainer).empty();
        let items: string[] = this.options === ToolbarOptions.Simple ? this.simpleOptions : this.fullOptions;
        for (let item of items) {
            if (item === "|") {
                $(this.buttonContainer).append($("<li/>").addClass("seperator"));
            } else {
                $(this.buttonContainer).append(this.toolbarItems[item].container);
            }
        }
        for (let item of this.bottomOptions) {
            if (item === "|") {
                $(this.bottomButtonContainer).append($("<li/>").addClass("seperator"));
            } else {
                $(this.bottomButtonContainer).append(this.toolbarItems[item].container);
            }
        }
        this.checkState();
    }

    setMode(mode:ActiveMode):boolean {
        if (this.mode === mode || mode === undefined) {
            return false;
        }
        this.mode = mode;
        this.updateVisibilityToolbar();
        this.editArea.updateMode(this.mode);
        return true;
    }
    updateVisibilityToolbar(): void {
        if (this.mode === ActiveMode.Design) {
            $(this.buttonContainer).show();
        } else {
            $(this.buttonContainer).hide();
        }
        this.toggleViewButtons();
    }

    toggleViewButtons():void {
        (<ToolbarButtonBase>this.toolbarItems.design).removeActive();
        (<ToolbarButtonBase>this.toolbarItems.html).removeActive();
        (<ToolbarButtonBase>this.toolbarItems.preview).removeActive();

        if (this.mode === ActiveMode.Design) {
            (<ToolbarButtonBase>this.toolbarItems.design).setActive();
        }
        if (this.mode === ActiveMode.Html) {
            (<ToolbarButtonBase>this.toolbarItems.html).setActive();
        }
        if (this.mode === ActiveMode.Preview) {
            (<ToolbarButtonBase>this.toolbarItems.preview).setActive();
        }
    }


    checkState(): void {
        for (let key of Object.keys(this.toolbarItems)) {
            let item: any = this.toolbarItems[key];
            if (item.checkState) {
                item.checkState();
            }
        }
    }

    resetToolbar(): void {
        for (let key of Object.keys(this.toolbarItems)) {
            if (this.toolbarItems[key] instanceof ToolbarButtonBase) {
                (<ToolbarButtonBase>this.toolbarItems[key]).removeActive();
            }
        }
    }

    initItems(): void {
        this.toolbarItems.undo = new ToolbarButtonExecCommand("undo", "Ongedaan maken", this);
        this.toolbarItems.redo = new ToolbarButtonExecCommand("redo", "Opnieuw", this);
        this.toolbarItems.removeformat = new ToolbarButtonExecCommand("removeformat", "Opmaak wissen", this);
        this.toolbarItems.cut = new ToolbarButtonExecCommand("cut", "Knippen", this);
        this.toolbarItems.copy = new ToolbarButtonExecCommand("copy", "Kopiëren", this);
        this.toolbarItems.paste = new ToolbarButtonExecCommand("paste", "Plakken", this);
        this.toolbarItems.pastetext = new ToolbarButtonExecCommand("pastetext", "Tekst plakken", this);
        this.toolbarItems.pasteword = new ToolbarButtonExecCommand("pasteword", "MS Word plakken", this);
        this.toolbarItems.outdent = new ToolbarButtonExecCommand("outdent", "Inspringen verkleinen", this);
        this.toolbarItems.indent = new ToolbarButtonExecCommand("indent", "Inspringen vergroten", this);
        this.toolbarItems.justifyleft = new ToolbarButtonExecCommandCheck("justifyleft", "Tekst links uitlijnen", this);
        this.toolbarItems.justifycenter = new ToolbarButtonExecCommandCheck("justifycenter", "Centreren", this);
        this.toolbarItems.justifyright = new ToolbarButtonExecCommandCheck("justifyright", "Tekst rechts uitlijnen", this);
        this.toolbarItems.justifyfull = new ToolbarButtonExecCommandCheck("justifyfull", "Uitvullen", this);
        this.toolbarItems.justifyreset = new ToolbarButtonExecCommandCheck("justifyreset", "Uitlijnen wissen",
                                                                            this);
        // this.toolbarItems.paragraph = new CustomButtonCheck("paragraph", "Paragraaf maken", this,
        // () => this.editArea.surroundRange("p"), () => this.editArea.checkParagraph());
        this.toolbarItems.paragraph = new ToolbarButtonExecCommandCheck("paragraph", "Paragraaf maken", this,"p");
        this.toolbarItems.orderedlist = new ToolbarButtonExecCommand("orderedlist", "Nummering", this, "insertorderedlist");
        this.toolbarItems.unorderedlist = new ToolbarButtonExecCommand("unorderedlist", "Opsommingstekens", this, "insertunorderedlist");
        this.toolbarItems.horizontalrule = new ToolbarButtonExecCommand("horizontalrule", "Horizontale lijn toevoegen",
                                                                        this, "insertHorizontalRule");
        this.toolbarItems.link = new CreateLink("link", "Link toevoegen", this);
        this.toolbarItems.unlink = new ToolbarButtonExecCommand("unlink", "Link verwijderen", this, "unlink");

        this.toolbarItems.resetbackcolor = new ToolbarButtonExecCommand("resetbackcolor", "Markering verwijderen",
            this, "removeformat", "backcolor");
        this.toolbarItems.resetforecolor = new ToolbarButtonExecCommand("resetforecolor", "Tekstkleur verwijderen",
            this, "removeformat", "backcolor");
        this.toolbarItems.bold = new ToolbarButtonExecCommandCheck("bold", "Vet", this);
        this.toolbarItems.italic = new ToolbarButtonExecCommandCheck("italic", "Cursief", this);
        this.toolbarItems.underline = new ToolbarButtonExecCommandCheck("underline", "Onderstrepen", this);
        this.toolbarItems.strikethrough = new ToolbarButtonExecCommandCheck("strikethrough", "Doorhalen", this);
        this.toolbarItems.subscript = new ToolbarButtonExecCommandCheck("subscript", "Subscript", this);
        this.toolbarItems.superscript = new ToolbarButtonExecCommandCheck("superscript", "SuperScript", this);
        this.toolbarItems.formatltr = new ToolbarButtonExecCommandCheck("formatltr", "Links naar rechts uitlijnen", this);
        this.toolbarItems.formatrtl = new ToolbarButtonExecCommandCheck("formatrtl", "Recht naar links uitlijnen", this);
        this.toolbarItems.forecolor = new ColorPickerItem("forecolor", "Tekstkleur", this, "#FF0000");
        this.toolbarItems.backcolor = new ColorPickerItem("backcolor", "Markeren", this, "#FFFF00");
        this.toolbarItems.html = new ToggleViewButton(ActiveMode.Html, "html", "HTML Opmaken", this);
        this.toolbarItems.design = new ToggleViewButton(ActiveMode.Design, "design", "Ontwerpen", this);
        this.toolbarItems.preview = new ToggleViewButton(ActiveMode.Preview, "preview", "Voorbeeld", this);

        let fontOptions :Dictionary<string|number> = new Dictionary();
        fontOptions.defualt = "default";
        fontOptions.Arial = "courier new,courier,monospace";
        fontOptions["Courier New"] = "georgia,times new roman,times,serif";
        fontOptions.Georgia = "georgia,times new roman,times,serif";
        fontOptions.Tahoma = "tahoma,arial,helvetica,sans-serif";
        fontOptions["Times New Roman"] = "times new roman,times,serif";
        fontOptions.Verdana = "verdana,arial,helvetica,sans-serif   ";
        fontOptions.Impact = "impact";
        fontOptions.WingDings = "wingdings";
        let sizeOptions :Dictionary<string|number> = new Dictionary();
        sizeOptions.default = "default";
        sizeOptions["1 (8pt)"] = 1;
        sizeOptions["2 (10pt)"] = 2;
        sizeOptions["3 (12pt)"] = 3;
        sizeOptions["4 (14pt)"] = 4;
        sizeOptions["5 (18pt)"] = 5;
        sizeOptions["6 (24pt)"] = 6;
        sizeOptions["7 (36pt)"] = 7;
        this.toolbarItems.font = new DropwdownItem("font", "Lettertype", this, fontOptions, "fontName");
        this.toolbarItems.size = new DropwdownItem("size", "Grootte", this, sizeOptions, "fontSize");
    }
}
