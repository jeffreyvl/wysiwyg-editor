import { Direction, ActiveMode } from "./util";
import { ToolbarItem, ItemToCheck } from "./toolbar-item";
import { Toolbar } from "./toolbar";

export abstract class ToolbarButtonBase extends ToolbarItem {

    button: HTMLElement;
    constructor(name: string, text: string, toolbar: Toolbar) {
        super(toolbar);
        this.button = $("<button/>").addClass(name).attr("title", text).click((e) => {
            e.preventDefault(); this.execute(); this.toolbar.checkState(); return false;
        })[0];
        $(this.container).append(this.button);
    }

    abstract execute(): boolean;

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
    execute(): boolean {
        this.toolbar.editArea.formatDoc(this.command, false, this.argument);
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
        return this.toolbar.setMode(this.activeMode);
    }
}

export class CreateLink extends ToolbarButtonBase {

    div: HTMLElement;
    select:HTMLElement;
    textBox:HTMLElement;
    prompt: any;
    constructor(name: string, text: string, toolbar: Toolbar) {
        super(name, text, toolbar);
        this.div = $("<div/>")[0];
        this.createDiv();
        this.createPrompt();
    }

    execute(): boolean {
        let url: string;
        let target: string;
        this.prompt.dialog("open");
        return true;
    }
    createPrompt(): void {
        let that:CreateLink = this;
        this.prompt = $("#dialog-form").dialog({
            autoOpen: false,
            height: 400,
            width: 350,
            modal: true,
            buttons: {
                "OK": that.createLink,
                Cancel: () => {
                    that.prompt.dialog("close");
                }
            },
            close: () => {
                form[0].reset();
            }
        });

        let form: any = this.prompt.find("form").on("submit", event => {
            event.preventDefault();
            this.createLink();
        });

    }

    createLink(): void {
        this.toolbar.editArea.createLink(<string>$(this.textBox).val(),<string>$(this.select).val());
    }
    createDiv(): void {
        this.textBox = $("<input/>").attr("input", "text").attr("id", "url").attr("maxLength", "225")
            .attr("value", "https://").css("width", "200px")[0];
        this.select = $("<select/>").attr("id", "target").css("width", "105px")
            .append("<option selected value=_blank>New window</option>")
            .append("<option value=_self>Current window</option>")
            .append("<option value=_parent>Parent window</option>")
            .append("<option value=_top>Top window</option>")[0];
        // let cancelButton: HTMLElement = $("<button/>").attr("type", "button").addClass("cancel").attr("id", "cancel").text("Cancel")[0];
        // let okButton: HTMLElement = $("<button/>").attr("type", "submit").addClass("submit").attr("id", "submit").text("OK")[0];
        $("<form/>").appendTo(this.div).append("URL:").append(this.textBox).append("Target:")
            .append(this.select);
    }
}