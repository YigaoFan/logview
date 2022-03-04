import * as vscode from 'vscode';
import { log } from './utils';
import {AnalyzeResultProvider, AnalyzeResultItem as AnalyzeResultItem} from './AnalyzeResultProvider';
import { patterns } from './pattern';

// TODO change cmd to log view
// TODO fix: invoke by .log file extension only triggered at first time
// request, response 匹配和超时检测
export function activate(context: vscode.ExtensionContext) {
	log('Congratulations, your extension "logview" is now active!');
	const p = new AnalyzeResultProvider(patterns, getCurrentFileContent);
	vscode.window.registerTreeDataProvider('logAnalyze', p);
	const refreshCmd = 'logAnalyze.refresh';
	const refresh = () => {
		log('start refresh');
		p.refresh();
	};
	const gotoCmd = 'logAnalyze.goHere';
	const goto = (item: AnalyzeResultItem) => {
		if (!item.lineNum) {
			return;
		}
		log('goto', item.lineNum);
		const workspace = vscode.window.activeTextEditor?.document.uri;// 这个其实应该 result item 携带
		const p = new vscode.Position(item.lineNum, 0);
		vscode.commands.executeCommand('editor.action.goToLocations', workspace, p, [], 'goto');
	};
	vscode.commands.registerCommand(refreshCmd, refresh);
	vscode.commands.registerCommand(gotoCmd, goto);
}

function* getCurrentFileContent(): Generator<vscode.TextLine> {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const n = editor.document.lineCount;
		for (let i = 0; i < n; i++) {
			const line = editor.document.lineAt(i);
			yield line;
		}
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

