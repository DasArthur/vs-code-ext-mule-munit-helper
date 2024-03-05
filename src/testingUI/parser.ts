import * as vscode from 'vscode';

export const parseYamlEncryption = (text: string, events: {
	onTest(range: vscode.Range, name: string, rangeText: string, testSkipped: boolean, testDescription: string): void;
  }) => {
	const lines = text.split('\n');
	let match;
	let lineNumber = 0;
  
	// Use a single regex to capture the entire munit:test element and its name attribute
	const fullTestRe = /<munit:test\s+.*?name="([^"]+)"(?:[^>]*ignore="([^"]+)")?(?:[^>]*description="([^"]+)")?[^>]*>/g;

	while ((match = fullTestRe.exec(text)) !== null) {
	  // Calculate the line number based on the match index
	  const linesUpToMatch = text.slice(0, match.index).split('\n');
	  lineNumber = linesUpToMatch.length - 1;

	  // Calculate the start position of the munit:test element
  const startLinePos = linesUpToMatch[linesUpToMatch.length - 1].length;

  // The end position is the start position plus the length of the match
  const endLinePos = startLinePos + match[0].length;
  
	  const range = new vscode.Range(
		new vscode.Position(lineNumber, startLinePos),
		new vscode.Position(lineNumber, endLinePos)
	  );
  
	  // Extract the name of the test
	  const testName = match[1];
	  const testSkipped = match[2] ? match[2] === 'true' : false;
	  const testDescription = match[3] || ''; 
  
	  // Send the test name and range back through the callback
	  events.onTest(range, testName, match[0], testSkipped, testDescription);
	}
  };