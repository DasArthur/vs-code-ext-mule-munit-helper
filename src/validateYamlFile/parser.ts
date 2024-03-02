import * as vscode from 'vscode';

const munitTestRe = /<munit:test[^>]*>[\s\S]*?<\/munit:test>/;
const munitTestNameRe = /<munit:test\s+.*?name="([^"]+)"/;

export const parseYamlEncryption = (text: string, events: {
	onTest(range: vscode.Range, name: string, rangeText: string): void;
  }) => {
	const lines = text.split('\n');
	let match;
	let lineNumber = 0;
  
	// Use a single regex to capture the entire munit:test element and its name attribute
	const fullTestRe = /<munit:test\s+.*?name="([^"]+)"[^>]*>[\s\S]*?<\/munit:test>/g;
  
	while ((match = fullTestRe.exec(text)) !== null) {
	  // Calculate the line number based on the match index
	  const linesUpToMatch = text.slice(0, match.index).split('\n');
	  lineNumber = linesUpToMatch.length - 1;
  
	  // Calculate the range of the munit:test element
	  const startLinePos = match.index - linesUpToMatch.slice(0, -1).join('\n').length;
	  const endLinePos = startLinePos + match[0].split('\n')[0].length;
	  const range = new vscode.Range(
		new vscode.Position(lineNumber, startLinePos),
		new vscode.Position(lineNumber, endLinePos)
	  );
  
	  // Extract the name of the test
	  const testName = match[1];
  
	  // Send the test name and range back through the callback
	  events.onTest(range, testName, match[0]);
	}
  };