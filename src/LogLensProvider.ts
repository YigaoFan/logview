import * as vscode from 'vscode';
import { from } from './linq';
import { Message } from './message';

export class LogLensProvider implements vscode.CodeLensProvider {
    private readonly mLinesGetter: ()=> Generator<vscode.TextLine>;
    onDidChangeCodeLenses?: vscode.Event<void> | undefined;

    public constructor(linesGetter: ()=> Generator<vscode.TextLine>) {
        this.mLinesGetter = linesGetter;
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> | Thenable<vscode.CodeLens[]> {
        var g = this.mLinesGetter();
        const ms = from(g).filter(x => Message.valid(x.text)).map(x => ({range: x.range, message: Message.newFrom(x)}));
		var ls = ms.map(x => new vscode.CodeLens(x.range, {
            title: 'expand in new document',
            command: 'logAnalyze.show2Messages',
            arguments: [x.message], // add 2 message here todo
        }));
        return ls.toArray();
    }    
}