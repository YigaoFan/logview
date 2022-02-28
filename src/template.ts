import { Uri, TextLine } from "vscode";
import * as fs from 'fs';
import { log } from "./utils";
import { patterns } from "./pattern";

export class Template {
    private htmlTemplatePath : Uri;

    constructor(htmlTemplatePath: Uri) {
        this.htmlTemplatePath = htmlTemplatePath;
    }

    private getWebviewTemplate() {
        return fs.readFileSync(this.htmlTemplatePath.fsPath, 'utf8');
    }

    generateWith(lines: Iterable<TextLine>) {
        const messages: string[][] = [];
        const itemTemplate = 
        `<div class="couple">
		<details close class="request">
			<summary class="request-header">request</summary>
			<div class="content">
				<pre class="json request-json">{{request-json}}</pre>
			</div>
		</details>
		<details close class="response">
			<summary class="response-header">response</summary>
			<div class="content">
				<pre class="json response-json">{{response-json}}</pre>
			</div>
		</details>
        </div>
        <br>`;
        
        for (const l of lines) {
			// log(l.lineNumber);
            if (Template.isRequest(l.text)) {
                const request:string = Template.splitOutJsonFrom(l.text);
                const time = Template.splitOutTime(l.text);
                if (messages.length === 0 || messages[messages.length-1].length === 2) {
                    messages[messages.length] = [
                        request,
                    ];
                } else {
                    // has wrong request and response match
                    log('request not match');
                }
                // item = item.replace('{{request-json}}', request);
            } else if (Template.isResponse(l.text)) {
                const response:string = Template.splitOutJsonFrom(l.text);
                const time = Template.splitOutTime(l.text);
                if (messages[messages.length-1].length === 1) {
                    messages[messages.length-1].push(response);
                } else {
                    // has wrong request and response match
                    log('response not match');
                }
            }
		}
        
        // for (const m of messages) {
        //     for (const p of patterns) {
        //         const [request, response] = m;

        //         if (p(request, response)) {

        //         }
        //     }
        // }
        return this.getWebviewTemplate().replace('{{data}}', messages.map<string>((m: string[]) => {
            const request = m[0];
            const response = m[1];
            return itemTemplate.replace('{{request-json}}', request).replace('{{response-json}}', response);
        }).join(''));
    }

    private static isRequest(line: string) {
        return line.includes('[request]');
    }

    private static isResponse(line: string) {
        return line.includes('[response]');
    }

    private static splitOutJsonFrom(line: string) {
        const start = line.indexOf('{');
        const end = line.lastIndexOf('Func=');
        var s = line.substring(start, end);
        // log('raw', s);
        s = s.replaceAll('<', '&lt').replaceAll('>', '&gt').replaceAll('"', '&quot');
        // log('processed', s);
        return s;
    }

    private static splitOutTime(line: string): Date {
        const start = 0;
        const end = line.indexOf(',');
        const s = line.substring(start, end);
        const d = new Date(s);
        var miSecStr = line.substring(end + 1);
        miSecStr = miSecStr.substring(0, miSecStr.indexOf(' '));
        d.setMilliseconds(Number.parseInt(miSecStr));
        return d;
    }
}