import * as vscode from 'vscode';
import * as path from 'path';
import { Template } from './template';
import { log } from './utils';
import {AnalyzeResultProvider, Item as AnalyzeResultItem} from './AnalyzeResultProvider';

// TODO change cmd to log view
// TODO fix: invoke by .log file extension only triggered at first time
// mouse hover open details
// request, response 匹配和超时检测
// 搜索功能很重要
export function activate(context: vscode.ExtensionContext) {
	// This line of code will only be executed once when your extension is activated
	log('Congratulations, your extension "logview" is now active!');

	const p = new AnalyzeResultProvider('Hello Tree view');
	vscode.window.registerTreeDataProvider(
		'logAnalyze',
		p,
	);
	log('tree view create');
	const refreshCmd = 'logAnalyze.refresh';
	const refresh = () => {
		log('start refresh');
	};
	const gotoCmd = 'logAnalyze.goHere';
	const goto = (item: AnalyzeResultItem) => {
		log('offset', item);
	};
	vscode.commands.registerCommand(refreshCmd, refresh);
	vscode.commands.registerCommand(gotoCmd, goto);
	const cmd = 'logview.dogCoding.start';
	const openLogWebview = () => {
		// const panel = vscode.window.createWebviewPanel(
		// 	'logView',
		// 	'Log View',
		// 	vscode.ViewColumn.Two,
		// 	{
		// 		enableScripts: true,
		// 	}
		// );
		// const filePath: vscode.Uri = vscode.Uri.file(path.join(context.extensionPath, 'src', 'view.html'));
		// const template = new Template(filePath);
		// const g = getCurrentFileContent();
		// panel.webview.html = template.generateWith(g);
		// log('webview set done');
	};
	let disp = vscode.commands.registerCommand(cmd, openLogWebview);
	// const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	// bar.command = cmd;
	// bar.text = 'Log view';
	// bar.show();
	// openLogWebview();
	// context.subscriptions.push(bar);
	context.subscriptions.push(disp);

	// let disp1 = vscode.commands.registerCommand('logview.myFormatJson', formatJson);
	// context.subscriptions.push(disp1);
}

function* getCurrentFileContent() {
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

// add log
async function formatJson() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		log('format start');
		const uri = editor.document.uri;
		// editor.document.languageId
		const r = new vscode.Range(editor.selection.start, editor.selection.end);
		const options: Object = {
		};
		await vscode.languages.setTextDocumentLanguage(editor.document, 'json');
		vscode.commands.executeCommand<vscode.TextEdit[]>('vscode.executeFormatRangeProvider', uri, r, options).then((edits) => {
			if (!edits || !edits.length) {
				log('format failed');
				return;
			}
			const formattingEdit = new vscode.WorkspaceEdit();
			formattingEdit.set(uri, edits);
			vscode.workspace.applyEdit(formattingEdit);
			log('format applied');
		}, 
		(reason) => {
			log('format fail', reason);
		});
		
	}
}