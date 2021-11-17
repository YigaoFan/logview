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

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('logview.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});

	context.subscriptions.push(disposable);

	let disposable1 = vscode.commands.registerCommand('logview.currentDate', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		let d = new Date();
		vscode.window.showInformationMessage(d.toDateString());
	});

	context.subscriptions.push(disposable1);

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
		// let i = 0;
		// const updateWebview = () => {
		// 	const cat = i++ % 2 ? 'compilingCat' : 'codingCat';
		// 	panel.title = cat;
		// 	panel.webview.html = getWebviewContent(cat);
		// };

		panel.webview.html = getWebviewContent(context.extensionPath, 'codingCat');
		// panel.onDidChangeViewState(
		// 	e => {
		// 		const p = e.webviewPanel;
		// 		switch (p.viewColumn) {
		// 			case vscode.ViewColumn.One:
		// 				updateWebviewFrom(p, 'codingCat');
		// 				return;
		// 			case vscode.ViewColumn.Two:
		// 				updateWebviewFrom(p, 'compilingCat');
		// 				return;
		// 			case vscode.ViewColumn.Three:
		// 				updateWebviewFrom(p, 'testingCat');
		// 				return;
		// 		}
		// 	},
		// 	null,
		// 	context.subscriptions
		// );
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
	// 为一组 request, response 加一个边框 TODO
	// JSON.stringify({a:1,b:2,c:{d:1,e:[1,2]}}, null, 4); // Indented with 4 spaces
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<link href="https://cdn.bootcss.com/highlight.js/9.12.0/styles/default.min.css" rel="stylesheet">
	<script src="https://cdn.bootcss.com/highlight.js/9.12.0/highlight.min.js"></script>
	<script>
		hljs.initHighlightingOnLoad();
		console.log('js highlight done');
	</script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
	<style>
		.couple {
			border: 1px black solid; 
		}
		.request-header {
			text-align: left;
			background-color: green;
		}
		.response-header {
			text-align: right;
			background-color: yellow;
		}
		.content {
			width: 100%;
			height: auto;
			overflow: auto; 
		}
		.request-json {
			float: left;
		}
		.response-json {
			float: right;
		}
	</style>
</head>
<body>
	<div class="couple">
		<details close class="request">
			<summary class="request-header">request</summary>
			<div class="content">
				<code class="request-json">{ "a" : 1 }</code>
			</div>
		</details>
		<details close class="response">
			<summary class="response-header">response</summary>
			<div class="content">
				<code class="response-json">{ "a" : 1 }</code>
			</div>
		</details>
	</div>
	<script>
		var codes = document.getElementsByTagName('code');
		for (var i = 0; i < codes.length; ++i) {
			var b = codes[i];
			b.innerText = JSON.stringify(JSON.parse(b.innerText), null, 4)
			hljs.highlightBlock(b);
		}
		console.log('highlight done', codes.length);
	</script>
</body>
</html>`;
}

// function updateWebviewFrom(panel: vscode.WebviewPanel, catName: keyof typeof cats) {
// 	panel.title = catName;
// 	panel.webview.html = getWebviewContent(catName);
// }
// this method is called when your extension is deactivated
export function deactivate() { }
