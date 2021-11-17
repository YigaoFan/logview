// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path'
import * as fs from 'fs'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "logview" is now active!');

	const cmd = 'logview.dogCoding.start';
	let disp2 = vscode.commands.registerCommand(cmd, () => {
		const panel = vscode.window.createWebviewPanel(
			'logView',
			'Log View',
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
			}
		);

		panel.webview.html = getWebviewContent(context.extensionPath, 'codingCat');
	});
	const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	bar.command = cmd;
	bar.text = 'Hello bar';
	bar.show();
	context.subscriptions.push(bar);
	context.subscriptions.push(disp2);
	context.extensionPath
}

const cats = {
	'codingCat': 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
	'compilingCat': 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
	'testingCat': 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif',
};

function getWebviewContent(extensionPath : string, cat: keyof typeof cats) {
	const filePath: vscode.Uri = vscode.Uri.file(path.join(extensionPath, 'src', 'view.html'));
	return fs.readFileSync(filePath.fsPath, 'utf8');
}

// this method is called when your extension is deactivated
export function deactivate() { }
