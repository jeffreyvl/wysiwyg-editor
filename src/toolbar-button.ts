import { Direction, ActiveMode } from "./util";
import { ToolbarItem, ItemToCheck } from "./toolbar-item";
import { Toolbar } from "./toolbar";

export abstract class ToolbarButtonBase extends ToolbarItem {

    button: HTMLElement;
    constructor(name: string, text: string, toolbar: Toolbar) {
        super(toolbar);
        this.button = $("<button/>").addClass(name).attr("title", text).click(e => this.execute(e))[0];
        $(this.container).append(this.button);
    }

    abstract execute(e: JQuery.Event<HTMLElement, null>): boolean;

    setActive(): void {
        $(this.button).addClass("active");
    }

    removeActive(): void {
        $(this.button).removeClass("active");
    }
}

export class ToolbarButtonExecCommand extends ToolbarButtonBase {
    command: string;
    argument: any | undefined;
    check: boolean;
    button: HTMLElement;
    constructor(name: string, text: string, toolbar: Toolbar, command?: string, argument?: any) {
        super(name, text, toolbar);
        this.command = command ? command : name;
        this.argument = argument;
    }
    execute(e: JQuery.Event<HTMLElement, null>): boolean {
        e.preventDefault();
        this.toolbar.editArea.formatDoc(this.command, false, this.argument);
        this.toolbar.checkState();
        return true;

    }
}

export class ToolbarButtonExecCommandCheck extends ToolbarButtonExecCommand implements ItemToCheck {
    checkState(): void {
        this.toolbar.editArea.checkState(this.command) ? this.setActive() : this.removeActive();
    }
}

export class ToggleViewButton extends ToolbarButtonBase {

    activeMode: ActiveMode;
    constructor(activeMode: ActiveMode, name: string, text: string, toolbar: Toolbar) {
        super(name, text, toolbar);
        this.activeMode = activeMode;
    }
    execute(): boolean {
        if (this.toolbar.setMode(this.activeMode) && this.activeMode === ActiveMode.Design) {
            this.toolbar.checkState();
        }
        return false;
    }
}

export class CreateLink extends ToolbarButtonBase {

    popup: HTMLElement;
    select: HTMLElement;
    textBox: HTMLElement;
    cancelButton: HTMLElement;
    okButton: HTMLElement;
    urlPlaceHolder: string = "https://";
    constructor(name: string, text: string, toolbar: Toolbar) {
        super(name, text, toolbar);
        this.popup = $("<div/>").addClass("popup").addClass("group").hide().appendTo(this.container)[0];
        this.cancelButton = $("<button/>").text("Cancel").addClass("popup")[0];
        this.okButton = $("<button/>").text("OK").addClass("popup")[0];
        this.createForm();
        $(this.okButton).click((e) => this.okClick(this, e));
        $(this.cancelButton).click((e) => this.cancelClick(this, e));
    }

    execute(): boolean {
        this.toolbar.editArea.saveSelection();
        $(this.popup).show();
        this.textBox.focus();
        this.toolbar.editArea.editor.contentEditable = "false";
        return true;
    }

    okClick(that: CreateLink, e: JQuery.Event<HTMLElement, null>): boolean {
        e.preventDefault();
        let url: string = <string>$(that.textBox).val();
        let target: string = <string>$(that.select).val();
        if (url === that.urlPlaceHolder) {
            return false;
        }
        that.clearForm();
        this.toolbar.editArea.editor.contentEditable = "true";
        that.toolbar.editArea.createLink(url, target);
        return false;
    }

    cancelClick(that: CreateLink, e: JQuery.Event<HTMLElement, null>): boolean {
        e.preventDefault();
        that.clearForm();
        this.toolbar.editArea.editor.contentEditable = "true";
        that.toolbar.editArea.editor.focus();
        that.toolbar.editArea.restoreSelection();
        return false;
    }

    clearForm(): void {
        $(this.popup).hide();
        $(this.select).val("_blank");
        $(this.textBox).val(this.urlPlaceHolder);
    }

    createForm(): void {
        this.textBox = $("<input/>").attr("type", "text").attr("maxLength", "225").addClass("popup")
            .attr("value", this.urlPlaceHolder)[0];
        this.select = $("<select/>").addClass("popup")
            .append($("<option/>").val("_blank").text("New Window"))
            .append($("<option/>").val("_self").text("Current window"))
            .append($("<option/>").val("_parent").text("Parent window"))
            .append($("<option/>").val("_top").text("Top window"))[0];

        let divUrl: HTMLElement = $("<div/>").append($("<label/>").text("URL:")).append(this.textBox).addClass("inputdiv")[0];
        let divTarget: HTMLElement = $("<div/>").append($("<label/>").text("Target:")).append(this.select).addClass("inputdiv")[0];
        let divButtons: HTMLElement = $("<div/>").append(this.okButton).append(this.cancelButton).addClass("buttondiv")[0];
        $(this.popup).append(divUrl).append(divTarget).append(divButtons);
    }
}