import * as vscode from 'vscode';
import { CancellationToken, Uri, WebviewView, WebviewViewProvider, WebviewViewResolveContext } from "vscode";
import * as fs from 'fs';
import { log } from "./utils";
import { Clause, Combinator, getCombinatorMap as getCombinators, getOperators as getOperators, QueryExecutor, toCombinatorEnum, toOperatorEnum } from "./QueryExecutor";
import { Message } from './message';
import { from } from './linq';

// sample
// {
//     combinator: ['and', 'or'],
//     clause: {
//         messageType: {
//             '=': ['A', 'B'],
//             '!=': ['A', 'B'],
//             'contains': []
//         },
//         messageContent: {
//             '=': ['A', 'B'],
//             '!=': ['A', 'B'],
//             'contains': []
//         },
//     }
// }
const generateSelectMetadata = function(messages: Generator<Message>) {
    const c = getCombinators();
    const o = getOperators();
    const f = Message.getQueryableFieldNames();
    // { [field: string]: { [operator: string]: string[] }}
    const metadata: { combinator: string[], clause: Record<string, Record<string, string[]>> } =  {
        combinator: c,
        clause: {},
    };

    // 这个 Record 构造挺神奇的，可以把右边的 object 直接构造成 Record，不用调用 Record 的构造函数
    for (const x of f) {
        metadata.clause[x] = {};
        for (const y of o) {
            metadata.clause[x][y] = [];
        }
    }
    const msgTypes = new Set<string>();
    for (const m of messages) {
        const t = m.queryMessageType();
        if (t) {
            msgTypes.add(t);
        }
    }
    metadata.clause.messageType['='] = [...msgTypes];
    metadata.clause.messageType['!='] = [...msgTypes];
    return metadata;
};

export type StyleUris = { main: string, vscode: string, reset: string, };
export class QueryPanel implements WebviewViewProvider {
    private mHtmlTemplatePath: string;
    private mDataBindingFilePath: string;
    private mQueryExecutor: QueryExecutor;
    private mMessagesGetter: ()=> Generator<Message>;
    private mContinuation: (msgs: Generator<Message>) => void;
    private mStyleUris: StyleUris;

    public constructor(htmlTemplatePath: string, styleUris: StyleUris, dataBindingFilePath: string, queryExecutor: QueryExecutor, messagesGetter: ()=> Generator<Message>, continuation: (msgs: Generator<Message>) => void) {
        this.mHtmlTemplatePath = htmlTemplatePath;
        this.mStyleUris = styleUris;
        this.mDataBindingFilePath = dataBindingFilePath;
        this.mQueryExecutor = queryExecutor;
        this.mMessagesGetter = messagesGetter;
        this.mContinuation = continuation;
    }

    public resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext<unknown>, token: CancellationToken): void | Thenable<void> {
        webviewView.webview.options = {
            enableScripts: true,
        };
        webviewView.webview.onDidReceiveMessage(message => {
            log('got message from webview', message);
            switch (message.command) {
                case 'runQuery':
                    (message.combinators as string[])
                        .map(toCombinatorEnum)
                        .forEach(x => this.mQueryExecutor.addCombinator(x));
                    (message.clauses as [string, string, string][])
                        .map(x => [x[0], toOperatorEnum(x[1]), x[2]] as const)
                        .forEach(x => this.mQueryExecutor.addClause(x));
                    const filteredMessages = this.mQueryExecutor.execute(this.mMessagesGetter());
                    this.mContinuation(filteredMessages);
                    this.mQueryExecutor.clearData();
                    break;
            }
        });
        // log('metadata', JSON.stringify(generateSelectMetadata()));
        const d = generateSelectMetadata(this.mMessagesGetter());
        const webview = webviewView.webview;
        webview.html = fs.readFileSync(this.mHtmlTemplatePath, 'utf8')
            .replace('{styleResetUri}', webview.asWebviewUri(vscode.Uri.file(this.mStyleUris.reset)).toString())
            .replace('{styleVSCodeUri}', webview.asWebviewUri(vscode.Uri.file(this.mStyleUris.vscode)).toString())
            .replace('{styleMainUri}', webview.asWebviewUri(vscode.Uri.file(this.mStyleUris.main)).toString())
            .replace('{selectMetadata}', JSON.stringify(d))
            .replace('{dataBindingFilePath}', webview.asWebviewUri(vscode.Uri.file(this.mDataBindingFilePath)).toString());
    }
}
// 由此可见，下面这些是来自 vscode 的样式文件
// / Do the same for the stylesheet.
// 		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
// 		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
// 		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));