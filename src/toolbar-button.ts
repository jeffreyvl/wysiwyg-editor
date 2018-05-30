
import { Direction, ActiveMode } from "./util";
import { ToolbarItem, ItemToCheck } from "./toolbar-item";
import { Toolbar } from "./toolbar";

export abstract class ToolbarButtonBase extends ToolbarItem {

    button: HTMLElement;
    constructor(name: string, text: string, toolbar: Toolbar) {
        super(toolbar);
        this.button = $("<button/>").addClass(name).attr("title", text).click((e) => {
            e.preventDefault();this.execute();this.toolbar.checkState();return false;})[0];
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

export class CustomButton extends ToolbarButtonBase {
    exec: ()=> void;
    constructor(name: string, text:string, toolbar: Toolbar, exec: ()=>void) {
        super(name,text,toolbar);
        this.exec = exec;
    }
    execute():boolean {
        this.exec();
        return true;
    }
}

export class CustomButtonCheck extends CustomButton implements ItemToCheck {
    check: () => boolean;
    constructor(name:string, text:string, toolbar: Toolbar, exec:()=>void, check:()=>boolean) {
        super(name,text,toolbar,exec);
        this.check = check;
    }

    checkState():void {
        this.check() ? this.setActive() : this.removeActive();
    }
}
export class ChangeDirectionButton extends ToolbarButtonBase implements ItemToCheck {

    direction: Direction;
    constructor(name: string, text: string, toolbar: Toolbar, direction: Direction) {
        super(name, text, toolbar);
        this.direction = direction;
    }

    execute(): boolean {
        return this.toolbar.editArea.changeDirection(this.direction);
    }

    checkState(): void {
        this.toolbar.editArea.getDirection() === this.direction ? this.setActive() : this.removeActive();
    }
}

export class ToggleViewButton extends ToolbarButtonBase {

    activeMode:ActiveMode;
    constructor(activeMode:ActiveMode, name:string, text:string, toolbar:Toolbar) {
        super(name,text, toolbar);
        this.activeMode = activeMode;
    }
    execute():boolean {
        return this.toolbar.setMode(this.activeMode);
    }
}