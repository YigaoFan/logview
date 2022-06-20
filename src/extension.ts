import * as vscode from 'vscode';
import { log } from './utils';
import {AnalyzeResultProvider, AnalyzeResultItem as AnalyzeResultItem} from './AnalyzeResultProvider';
import { patterns } from './pattern';
import { Message, MessageType } from './message';
import { LogLensProvider } from './LogLensProvider';

// TODO change cmd to log view
// TODO fix: invoke by .log file extension only triggered at first time
// request, response 匹配和超时检测
// config and open log folder
export function activate(context: vscode.ExtensionContext) {
	// const file = '';
	// vscode.workspace.openTextDocument(file).then(doc => {
	// 	vscode.window.showTextDocument(doc);
	// });
	// save file uri
	// 加一个配置时长的选项
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

	const myScheme = 'logMessage';
	var docContentProvider = new class implements vscode.TextDocumentContentProvider {
		onDidChange?: vscode.Event<vscode.Uri> | undefined;
		provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
			return uri.path;
		}
	};
	vscode.workspace.registerTextDocumentContentProvider(myScheme, docContentProvider);
	const show2Messages = 'logAnalyze.show2Messages';
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
	// const showMessages = async (...ms: Message[]) => {
		// 	const uri = vscode.Uri.parse(`${myScheme}:${messagesToText(...ms)}`);
		// 	log('uri', uri.path);
		// 	const doc = await vscode.workspace.openTextDocument(uri);
		
		// 	vscode.languages.setTextDocumentLanguage(doc, 'jsonc');
		// 	// const formatted = vscode.commands.executeCommand('vscode.executeFormatDocumentProvider', uri, { insertSpaces: true, tabSize: 2, });
		// 	// log('formatted', formatted);
		// 	const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
		// 	// editor.edit(builder => builder.insert());
		// };
		// vscode.commands.registerCommand(show2Messages, showMessages);
		
		// var logLensProvider = new LogLensProvider(getCurrentFileContent);
		// vscode.languages.registerCodeLensProvider({ scheme: 'file', language: 'log' }, logLensProvider);
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
				const uri = vscode.Uri.parse(`${myScheme}:${messagesToText(...ms)}`);
				return new vscode.Location(uri, new vscode.Position(0, 0));
			}
			return null;
		}
	});
	vscode.workspace.onDidOpenTextDocument(doc => {
		// log('open new doc', doc.fileName, doc.languageId);
		// todo 下面这些多少有点 hardcode 了
		// 因为好像是路径，/*[request]*/被变成 \
		if (doc.fileName.startsWith('\\*[request]*\\') || doc.fileName.startsWith('\\*[response]*\\')) {
			if (doc.languageId !== 'jsonc') {
				vscode.languages.setTextDocumentLanguage(doc, 'jsonc');
			}
		}
	});

	vscode.languages.registerHoverProvider('log', {
		provideHover(document, position, token) {
			log('position', position.character, position.line);
			var l = document.lineAt(position.line);
			if (Message.valid(l.text)) {
				var m = Message.newFrom(l);
				
				return {
					// format code in MarkdownString
					contents: [`**${m.typeString}**\n` + '```json\n ' + JSON.stringify(JSON.parse(m.content.toString()), null, 3) + '\n```',],
				};
			}
			return {
				contents: [],
			};
		}
	});
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

