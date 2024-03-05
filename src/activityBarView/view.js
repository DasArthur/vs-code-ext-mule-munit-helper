"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityBarViewListTree = void 0;
const vscode = __importStar(require("vscode"));
function activityBarViewListTree(context, outputChannel) {
    outputChannel.appendLine("get logged");
    const treeDataProvider = new YourTreeDataProvider();
    vscode.window.registerTreeDataProvider('munitview', treeDataProvider);
    vscode.window.createTreeView('munitview', { treeDataProvider });
    const config = vscode.workspace.getConfiguration();
    const munitAttributes = config.get('munit.attributes', '');
}
exports.activityBarViewListTree = activityBarViewListTree;
class YourTreeDataProvider {
    getTreeItem(element) {
        // Implement your logic to return the tree item
        return element;
    }
    getChildren(element) {
        if (element === undefined) {
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
        }
        else {
            // Child items for a given parent element
            // For this dummy example, let's assume no children
            return Promise.resolve([]);
        }
    }
}
class YourTreeItem extends vscode.TreeItem {
    label;
    collapsibleState;
    command;
    iconPath;
    constructor(label, collapsibleState, command, iconPath) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.iconPath = iconPath;
        this.command = command;
        this.iconPath = iconPath;
        this.contextValue = 'actionableItem';
    }
    // You can add additional properties and methods if needed
    contextValue = 'yourTreeItem';
}
//# sourceMappingURL=view.js.map