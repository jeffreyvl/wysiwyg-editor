
export function formatHtmlString(val: string): string {

    return val.replace(/<\/?br[^>]*>(?!\n)/ig, "$&\n")
        .replace(/<\/\s*(ul|ol|li)[^>]*>(?!\n)/ig, "$&\n")
        .replace(/<\/\s*(div|p)[^>]*>(?!\n)/ig, "\n$&\n")
        .replace(/<(ul|ol)[^>]*>(?!\n)/ig, "$&\n")
        .replace(/<(div|p)[^>]*>(?!\n)/ig, "\n$&\n");
}