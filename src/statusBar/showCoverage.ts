import * as vscode from 'vscode';

let myStatusBarItem: vscode.StatusBarItem;
let percentage = "Unavailable"

export function showStatusBarCoverage(context: vscode.ExtensionContext) {

	// register a command that is invoked when the status bar
	// item is selected
	const myCommandId = 'ap.showCoverage';
	context.subscriptions.push(vscode.commands.registerCommand(myCommandId, async () => {	
        
        if(percentage != "Unavailable" ){
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    vscode.window.showErrorMessage('No workspace folder found.');
                    return;
                }
            
                // Construct the path to the summary.html file
                const summaryHtmlPath = vscode.Uri.joinPath(workspaceFolders[0].uri, '/target/site/munit/coverage/summary.html');
            
                // Check if the file exists
                try {
                    const htmlContent = await vscode.workspace.fs.readFile(summaryHtmlPath);
            
                    // Create and show a new webview
                    const panel = vscode.window.createWebviewPanel(
                        'munitCoverageSummary', // Identifies the type of the webview. Used internally
                        'MUnit Coverage Summary', // Title of the panel displayed to the user
                        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
                        {
                            // Enable scripts in the webview
                            enableScripts: true
                        }
                    );
            
                    // And set its HTML content
                    panel.webview.html = htmlContent.toString();
                } catch (error) {
                    vscode.window.showErrorMessage('Failed to read summary.html file.');
                }
        }
	}));

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	myStatusBarItem.command = myCommandId;
    myStatusBarItem.text = `MUnit Coverage: ${percentage}`;
    myStatusBarItem.show();
	context.subscriptions.push(myStatusBarItem);


}

export function setPercentage(percent: string): void {
	percentage = percent;
    myStatusBarItem.text = `MUnit Coverage: ${percent}`;
}
