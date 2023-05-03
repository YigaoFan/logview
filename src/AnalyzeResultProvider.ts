import * as vscode from 'vscode';
import * as path from 'path';
import { log } from './util';
import { IPattern } from './pattern';
import { Message } from './message';

export class AnalyzeResultItem extends vscode.TreeItem {
    private mLineNum: number|undefined;
    private mKind: string;

    public get lineNum() {
        return this.mLineNum;
    }

    public get kind() {
        return this.mKind;
    }

    constructor(collapsibleState: vscode.TreeItemCollapsibleState, kind: string, label: string, lineNum: number|undefined, tooltip: string|undefined) {
        super(label, collapsibleState);
        this.mKind = kind;
        this.mLineNum = lineNum;
        this.tooltip = tooltip;
        if (lineNum) {
            this.iconPath = path.join(__filename, '..', '..', 'resource', 'question_mark.svg');
            this.command = {
                command: 'logAnalyze.goHere',
                arguments: [this],
                title: 'go here',
            };
        }
    }
}

type ResultKind = string;

export class AnalyzeResultProvider implements vscode.TreeDataProvider<AnalyzeResultItem> {
    private readonly mResultSet: Map<ResultKind, AnalyzeResultItem[]>;
    private readonly mPatterns: IPattern[];
    private readonly mMessagesGetter: ()=> Generator<Message>;
    private _onDidChangeTreeData: vscode.EventEmitter<AnalyzeResultItem | undefined | void> = new vscode.EventEmitter();
    
    constructor(patterns: IPattern[], messagesGetter: ()=> Generator<Message>) {
        this.mResultSet = new Map();
        this.mPatterns = patterns;
        this.mMessagesGetter = messagesGetter;
    }

    onDidChangeTreeData: vscode.Event<void | AnalyzeResultItem | null | undefined> | undefined = this._onDidChangeTreeData.event;
    
    getTreeItem(element: AnalyzeResultItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: AnalyzeResultItem): Promise<AnalyzeResultItem[] | null | undefined> {
        // log('get children of', element);
        if (element) {
            const items = this.mResultSet.get(element.kind);
            return Promise.resolve(items);
        } else {
            // 开始工作
            this.mResultSet.clear();
            this.analyze(this.mMessagesGetter(), this.mPatterns);

            const kinds = this.mResultSet.keys();
            const items = [];
            // 需要显示一个类别下的数量
            for (const k of kinds) {
                items.push(new AnalyzeResultItem(vscode.TreeItemCollapsibleState.Collapsed, k, k, undefined, undefined));
            }
            return Promise.resolve(items);
        }
    }

    private add(result: AnalyzeResultItem): void {
        const k = result.kind;
        if (this.mResultSet.has(k)) {
            this.mResultSet.get(k)!.push(result);
        } else {
            this.mResultSet.set(k, [result]);
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    analyze(ms: Generator<Message>, patterns: IPattern[]) {
        patterns.forEach(x => x.resultPutter = this.add.bind(this));
        for (const m of ms) {
            patterns.forEach(p => p.check(m));
        }
	};
}

