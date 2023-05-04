import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { Combinator, Operator, QueryExecutor, } from '../../QueryExecutor';

suite('QueryExecutor Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');
	const e = new QueryExecutor();
	e.addClause(['A', Operator.equal, 'a']);
	e.addCombinator(Combinator.and);
	e.addClause(['B', Operator.equal, 'b']);

	// e.execute()
	// test('Sample test', () => {
	// 	assert.strictEqual(-1, [1, 2, 3].indexOf(5));
	// 	assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	// });
});
