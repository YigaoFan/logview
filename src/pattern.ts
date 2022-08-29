import { AnalyzeResultItem } from './AnalyzeResultProvider';
import { Message, MessageType } from './message';
import * as vscode from 'vscode';

// pattern to analyze log correctness
export const patterns: IPattern[] = [];

export interface IPattern {
    set resultPutter(putter: (i: AnalyzeResultItem)=> void);
    check(message: Message): void;
}

class TimeoutCheckPattern implements IPattern {
    private mResultPutter!: (i: AnalyzeResultItem) => void;
    private mLastRequestTime: number|undefined;

    set resultPutter(putter: (i: AnalyzeResultItem) => void) {
        this.mResultPutter = putter;
    }
    
    check(message: Message): void {
        switch (message.type) {
            case MessageType.request:
                // maybe warning here if mLastRequestTime not undefined, not must
                this.mLastRequestTime = message.time.getTime();
                break;
            case MessageType.response:
                if (this.mLastRequestTime) {
                    const t1 = this.mLastRequestTime;
                    const t2 = message.time.getTime();
                    if ((t2 - t1) / 1000 > 10) {
                        // cons AnalyzeResultItem
                        const l = message.lineNum;
                        const r = new AnalyzeResultItem(vscode.TreeItemCollapsibleState.None, 'Timeout', message.content.toString(), l, `timeout on line: ${l + 1}`);
                        this.mResultPutter(r);
                    }
                    this.mLastRequestTime = undefined;
                    break;
                } else {
                    // normally request log exist if request exist, so not process this branch
                }
        }
    }
}

class PairCheckPattern implements IPattern {
    private mLastRequest: Message|undefined;
    private mResultPutter!: (i: AnalyzeResultItem) => void;

    set resultPutter(putter: (i: AnalyzeResultItem) => void) {
        this.mResultPutter = putter;
    }
    
    check(message: Message): void {
        const l = message.lineNum;

        switch (message.type) {
            case MessageType.request:
                if (this.mLastRequest) {
                    // not match
                    const r = new AnalyzeResultItem(vscode.TreeItemCollapsibleState.None, 'not pair', message.content.toString(), l, `not pair on line: ${l + 1}, two requests are in succession`);
                    this.mResultPutter(r);
                }
                this.mLastRequest = message;
                break;
            case MessageType.response:
                if (!this.mLastRequest) {
                    // not match
                    const r = new AnalyzeResultItem(vscode.TreeItemCollapsibleState.None, 'not pair', message.content.toString(), l, `not pair on line: ${l + 1}, no request corresponding response`);
                    this.mResultPutter(r);
                }
                this.mLastRequest = undefined;
                break;
        }
    }
}
// TODO json 解析有问题的时候提示可能出错

patterns.push(new TimeoutCheckPattern(), new PairCheckPattern());

