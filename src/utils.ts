export const log = console.log.bind(console);

const generateIndent = function(countOfItem: number) {
    var indent = '';
    var space = '&nbsp&nbsp&nbsp&nbsp';
    for (var i = 0; i < countOfItem; i++) {
        indent += space; // with replace html space TODO
    }
    return indent;
};

// attention: { and [ in string also add the indent
export const formatBorkenJson = function(json: string) {
    var formatted = '';
    var indent = 0;
    var isNewline = true;

    // indent must be generated after <br>
    for (var i = 0; i < json.length; i++) {
        if (isNewline) {
            formatted += generateIndent(indent);
            isNewline = false;
        }
        const c = json[i];
        switch (c) {
            case '{':
            case '[':
                formatted += c;
                formatted += '<br>';
                indent += 1;
                isNewline = true;
                break;
            case '}':
            case ']':
                formatted += '<br>';
                indent -= 1;
                formatted += generateIndent(indent);
                formatted += c;
                formatted += '<br>';
                isNewline = true;
                break;
            case ',':
                formatted += c;
                formatted += '<br>';
                isNewline = true; 
                break;
            default:
                formatted += c;
                break;
        }
    }

    return formatted;
};

export type JSONValue = 
            | string
            | number
            | boolean
            | { [x: string]: JSONValue}
            | Array<JSONValue>;
