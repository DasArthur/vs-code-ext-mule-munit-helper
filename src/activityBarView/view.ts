import * as vscode from 'vscode';

class SimpleWebviewProvider implements vscode.WebviewViewProvider {
    public resolveWebviewView(webviewView: vscode.WebviewView): void {
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getSimpleWebviewContent();
    }

    private getSimpleWebviewContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Simple Webview</title>
            </head>
            <body>
                <h1>Hello, Webview!</h1>
            </body>
            </html>
        `;
    }
}

export function activityBarViewListTree(context: vscode.ExtensionContext){

    const provider = new SimpleWebviewProvider();
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('munitview', provider)
    );

    

}