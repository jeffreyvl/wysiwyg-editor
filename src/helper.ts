export class Helper {

    static FormatHtmlString(val: string): string {

        return val.replace(/<\s*br\s*\/?>(?!\n)/ig, "$&\n")
                    .replace(/<\s*\/\s*(ul|ol|li)\s*>(?!\n)/ig,"$&\n")
                    .replace(/<\s*(ul|ol)\s*>(?!\n)/ig,"$&\n");
    }
}