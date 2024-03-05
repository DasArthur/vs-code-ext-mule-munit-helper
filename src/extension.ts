// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { activityBarViewListTree } from './activityBarView/view';
import { testRunner } from './testingUI/testRunner';
import { showStatusBarCoverage } from './statusBar/showCoverage';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed


export function activate(context: vscode.ExtensionContext) {

    // activityBarViewListTree(context);

    testRunner(context);

    showStatusBarCoverage(context);

}


// This method is called when your extension is deactivated
export function deactivate() {}
