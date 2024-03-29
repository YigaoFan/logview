import * as vscode from 'vscode';
import { log } from './util';
import { AnalyzeResultProvider, AnalyzeResultItem as AnalyzeResultItem } from './AnalyzeResultProvider';
import { patterns } from './pattern';
import { Message, MessageType } from './message';
import { QueryPanel } from './QueryPanel';
import path = require('path');
import { QueryExecutor } from './QueryExecutor';
import { from } from './linq';

const myScheme = 'logMessage';

// TODO fix: invoke by .log file extension only triggered at first time
// config and open log folder
export function activate(context: vscode.ExtensionContext) {
	// 加一个配置时长的选项
	log('Congratulations, your extension "logview" is now active!');
	setupQueryPanel(context.extensionPath);
	setupAnalyzePanel();
	setupClickContent();
	setupHoverTip();
}

const setupAnalyzePanel = function () {
	const p = new AnalyzeResultProvider(patterns, getCurrentFileMessages);
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
		const workspace = vscode.window.activeTextEditor?.document.uri; // 这个其实应该 result item 携带
		const p = new vscode.Position(item.lineNum, 0);
		vscode.commands.executeCommand('editor.action.goToLocations', workspace, p, [], 'goto');
	};
	vscode.commands.registerCommand(refreshCmd, refresh);
	vscode.commands.registerCommand(gotoCmd, goto);
};

// 这个要某个动作触发最好，不然一开始就显示在那不好
const setupQueryPanel = function (extensionPath: string) {
	const templatePath = path.join(extensionPath, 'resource', 'panel.html');
	const styleUris = {
		main: path.join(extensionPath, 'resource', 'media', 'main.css'),
		vscode: path.join(extensionPath, 'resource', 'media', 'vscode.css'),
		reset: path.join(extensionPath, 'resource', 'media', 'reset.css'),
	};
	const dataBindingPath = path.join(extensionPath, 'resource', 'dataBinding.js');

	const showFilteredMessage = async function(messages: Generator<Message>) {
		var logs = '';
		for (const m of messages) {
			logs += (m.fullLog + '\n');
		}
		// log('filtered msg', logs);
		const uri = vscode.Uri.from({ scheme: myScheme, path: 'QueryResult', fragment: logs, });
		const doc = await vscode.workspace.openTextDocument(uri);
		await vscode.languages.setTextDocumentLanguage(doc, 'log');
		const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.Active);
	};
	vscode.window.registerWebviewViewProvider('logQueryWebView',
		new QueryPanel(templatePath, styleUris, dataBindingPath, new QueryExecutor(), getCurrentFileMessages, showFilteredMessage),
		{
			webviewOptions: {
				retainContextWhenHidden: true,
			}
		}
	);
};

const setupHoverTip = function () {
	const hoverCache: Record<number, vscode.ProviderResult<vscode.Hover>> = {};
	const empty = {
		contents: [],
	};
	vscode.languages.registerHoverProvider('log', {
		provideHover(document, position, token) {
			// log('position', position.character, position.line);
			var l = document.lineAt(position.line);
			if (position.line in hoverCache) {
				return hoverCache[position.line];
			}
			let hoverInfo: vscode.ProviderResult<vscode.Hover> = empty;
			if (Message.valid(l.text)) {
				const m = Message.newFrom(l);
				// format code in MarkdownString
				hoverInfo = {
					contents: [`**${m.typeString}**\n` + '```json\n ' + JSON.stringify(JSON.parse(Message.splitOutJsonFrom(l.text)), null, 3) + '\n```',],
				};
			} else if (Message.containsJsonObject(l.text)) {
				hoverInfo = {
					contents: ['```json\n ' + JSON.stringify(JSON.parse(Message.splitOutJsonFrom(l.text)), null, 3) + '\n```',],
				};
			}
			hoverCache[position.line] = hoverInfo;
			return hoverInfo;
		}
	});
};

const setupClickContent = function () {
	var docContentProvider = new class implements vscode.TextDocumentContentProvider {
		onDidChange?: vscode.Event<vscode.Uri> | undefined;
		provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
			return uri.fragment;
		}
	};
	vscode.workspace.registerTextDocumentContentProvider(myScheme, docContentProvider);
	const messagesToText = (...ms: Message[]): string => {
		var strs: string[] = [];
		for (const m of ms) {
			strs.push(`/*[${m.typeString}]*/`); // // is special char in path

			// 有些 content 不是完整的 JSON，这里会有问题 TODO
			strs.push(`${JSON.stringify(JSON.parse(m.content.toString()), null, 3)}`);
		}
		// log('text', strs);
		return strs.join('\n');
	};
	// 用 ctrl + alt + click打开
	vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'log' }, {
		provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
			var l1 = document.lineAt(position.line);
			if (Message.valid(l1.text)) {
				const ms: Message[] = [];
				var m1 = Message.newFrom(l1);
				ms.push(m1);
				if (m1.type === MessageType.request) {
					// 下面这里的逻辑还处理得不完全，最好把本文档所有的 message 都缓存起来，然后从那里挑选
					var nextLineNum = position.line + 1;
					if (nextLineNum < document.lineCount) {
						var l2 = document.lineAt(nextLineNum);
						if (Message.valid(l2.text)) {
							var m2 = Message.newFrom(l2);
							ms.push(m2);
						}
					}
				}
				const uri = vscode.Uri.from({ scheme: myScheme, path: 'request&response', fragment: messagesToText(...ms), });
				return new vscode.Location(uri, new vscode.Position(0, 0));
			}
			return null;
		}
	});
	vscode.workspace.onDidOpenTextDocument(async (doc) => {
		if (doc.isClosed) {
			return;
		}
		if (doc.fileName.startsWith('request&response')) {
			if (doc.languageId !== 'jsonc') {
				await vscode.languages.setTextDocumentLanguage(doc, 'jsonc');
			}
		}
	});
};

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

function getCurrentFileMessages(): Generator<Message> {
	const g = getCurrentFileContent();
	const ms = from(g).filter(x => Message.valid(x.text)).map(x => Message.newFrom(x));
	return ms.raw;
}

// this method is called when your extension is deactivated
export function deactivate() { }

