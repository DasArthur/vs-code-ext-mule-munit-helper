// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


	// Register the view
    const config = vscode.workspace.getConfiguration();
        const munitAttributes = config.get('munit.attributes', '');
        console.log("attributes wtf",munitAttributes);

    if(munitAttributes != ""){
        const treeDataProvider = new YourTreeDataProvider();
        vscode.window.createTreeView('munitview', { treeDataProvider });
    }

	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vs-code-ext-mule-munit-helper" is now active!');

	let disposable = vscode.commands.registerCommand('extension.munit', async () => {
        const terminal = vscode.window.createTerminal('MUnit Terminal');
        terminal.show();

        // Retrieve the arguments from the configuration if needed
        const config = vscode.workspace.getConfiguration('munit');
        const args = config.get('arguments', '');

        // Construct the Maven command
        const mvnCommand = `mvn clean test ${args}`; // Replace 'test' with your specific Maven goal if needed

        // Execute the Maven command in the terminal
        terminal.sendText(mvnCommand);
    })

    let disposable2 = vscode.commands.registerCommand('extension.addMunitRunConfig', async () => {
        
        const config = vscode.workspace.getConfiguration();

        // Update the 'attributes' property within the 'munit' section
        config.update('munit.attributes', "123", vscode.ConfigurationTarget.Global)
            .then(() => {
                console.log('Updated munit.attributes to:', "123");
            }, (error) => {
                console.error('Failed to update munit.attributes:', error);
        });
    });


    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);

}

class YourTreeDataProvider implements vscode.TreeDataProvider<YourTreeItem> {
    getTreeItem(element: YourTreeItem): vscode.TreeItem {
        // Implement your logic to return the tree item
        return element;
    }

    getChildren(element?: YourTreeItem): Thenable<YourTreeItem[]> {



        if (element === undefined  ) {
            // Root level items
            return Promise.resolve([
                // new YourTreeItem('Dummy Item 1', vscode.TreeItemCollapsibleState.None),
                // new YourTreeItem('Dummy Item 2', vscode.TreeItemCollapsibleState.Collapsed),
                // new YourTreeItem('Dummy Item 3', vscode.TreeItemCollapsibleState.Collapsed),
				new YourTreeItem('Run all munits', vscode.TreeItemCollapsibleState.None, {
                    command: 'extension.munit',
                    title: 'Run all MUnits',
                    arguments: []
                }, new vscode.ThemeIcon('run'))
            ]);
        } else {
            // Child items for a given parent element
            // For this dummy example, let's assume no children
            return Promise.resolve([]);
        }
    }
}

class YourTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
		public readonly iconPath?: vscode.ThemeIcon
    ) {
        super(label, collapsibleState);
        this.command = command;
		this.iconPath = iconPath;
		this.contextValue = 'actionableItem';
    }

    // You can add additional properties and methods if needed
    contextValue = 'yourTreeItem';
}

// This method is called when your extension is deactivated
export function deactivate() {}
