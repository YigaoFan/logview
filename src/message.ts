import { TextLine } from "vscode";
import { log, JSONValue } from "./utils";

export enum MessageType {
    request,
    response,
}

/** 
 * represent request or response in log file
 */
export class Message {
    private mTime: Date;
    private mLineNum: number;
    private mMessageType: MessageType;
    private mContent: JSONValue;

    private static isRequest(message: string) {
        return message.includes('[request]');
    }

    private static isResponse(message: string) {
        return message.includes('[response]');
    }

    public static valid(message: string) {
        return this.isRequest(message) || this.isResponse(message);
    }

    public static newFrom(line: TextLine): Message {
        const l = line;
        if (Message.isRequest(l.text)) {
            const request:string = Message.splitOutJsonFrom(l.text);
            const time = Message.splitOutTime(l.text);
            return new Message(time, l.lineNumber, MessageType.request, request);
        } else if (Message.isResponse(l.text)) {
            const response:string = Message.splitOutJsonFrom(l.text);
            const time = Message.splitOutTime(l.text);
            return new Message(time, l.lineNumber, MessageType.response, response);
        }

        throw new Error(`Not support message ${line}`);
    }

    public get time() {
        return this.mTime;
    }

    public get lineNum() {
        return this.mLineNum;
    }

    public get type() {
        return this.mMessageType;
    }

    public get typeString() {
        switch (this.mMessageType) {
            case MessageType.request: return 'request';
            case MessageType.response: return 'response';
            default: throw new Error(`Not handle ${this.mMessageType} in MessageType`);
        }
    }

    public get content() {
        return this.mContent;
    }
    
    // private isRequest() {
    //     return this.mMessageType === MessageType.request;
    // }

    // private isResponse() {
    //     return this.mMessageType === MessageType.response;
    // }

    constructor(time: Date, line: number, type: MessageType, content: JSONValue) {
        this.mTime = time;
        this.mLineNum = line;
        this.mMessageType = type;
        this.mContent = content;
    }

    private static splitOutJsonFrom(line: string) {
        const start = line.indexOf('{');
        const end = line.lastIndexOf('}');
        if (end === -1) {
            return '';
        }
        var s = line.substring(start, end + 1);
        // log('raw', s);
        // s = s.replaceAll('<', '&lt').replaceAll('>', '&gt').replaceAll('"', '&quot'); // for generate HTML
        // log('processed', s);
        return s;
    }

    private static splitOutTime(line: string): Date {
        const start = 0;
        const end = line.indexOf(',');
        const s = line.substring(start, end);
        const d = new Date(s);
        var miSecStr = line.substring(end + 1);
        miSecStr = miSecStr.substring(0, miSecStr.indexOf(' '));
        d.setMilliseconds(Number.parseInt(miSecStr));
        return d;
    }
}