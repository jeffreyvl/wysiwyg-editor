import { Direction, ActiveMode } from "./util";
import { ToolbarItem, ItemToCheck, ItemWithPopup } from "./toolbar-item";
import { Toolbar } from "./toolbar";

export abstract class ToolbarButtonBase extends ToolbarItem {

    button: HTMLElement;
    constructor(name: string, text: string, toolbar: Toolbar) {
        super(toolbar);
        this.button = $("<button/>").addClass(name).attr("title", text).click(e => {e.preventDefault();this.execute();return false;})[0];
        $(this.container).append(this.button);
    }

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
    execute(): void {
        this.toolbar.editArea.formatDoc(this.command, false, this.argument);
        this.toolbar.checkState();
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
    execute(): void {
        if (this.toolbar.setMode(this.activeMode) && this.activeMode === ActiveMode.Design) {
            this.toolbar.checkState();
        }
    }
}

export class CreateLink extends ToolbarButtonBase implements ItemWithPopup {

    popup: HTMLElement;
    select: HTMLElement;
    textBox: HTMLElement;
    cancelButton: HTMLElement;
    okButton: HTMLElement;
    urlPlaceHolder: string = "https://";
    popupShown: boolean = false;
    constructor(name: string, text: string, toolbar: Toolbar) {
        super(name, text, toolbar);
        this.popup = $("<div/>").addClass("popup").addClass("group").hide().appendTo(this.container)[0];
        this.cancelButton = $("<button/>").text("Cancel").addClass("popup")[0];
        this.okButton = $("<button/>").text("OK").addClass("popup")[0];
        this.createForm();
        this.addHandlers();
    }

    execute(): void {
        this.open();
    }

    addHandlers():void {
        $(this.okButton).click((e) => {e.preventDefault();this.okClick();return false;});
        $(this.cancelButton).click((e) => this.cancelClick(this, e));
    }

    okClick(): void {
        let url: string = <string>$(this.textBox).val();
        let target: string = <string>$(this.select).val();
        if (url === this.urlPlaceHolder) {
            alert("Geen link opgegeven.");
            return;
        }
        this.close();
        this.toolbar.editArea.createLink(url, target);
    }

    cancelClick(that: CreateLink, e: JQuery.Event<HTMLElement, null>): boolean {
        e.preventDefault();
        that.close();
        return false;
    }

    clearForm(): void {
        $(this.select).val("_blank");
        $(this.textBox).val(this.urlPlaceHolder);
    }

    close(): void {
        this.clearForm();
        $(this.popup).hide();
        this.toolbar.unRegisterPopup(this);
        this.toolbar.editArea.editor.contentEditable = "true";
        this.toolbar.editArea.restoreSelection();
    }

    open(): void {
        this.toolbar.registerPopup(this);
        this.toolbar.editArea.saveSelection();
        this.toolbar.editArea.editor.contentEditable = "false";
        $(this.popup).show();
        let length:number = $(this.textBox).val().toString().length;
        $(this.textBox).setSelection(length);
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