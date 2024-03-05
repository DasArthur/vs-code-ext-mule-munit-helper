import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function getArguments(): Promise<{ args: string }> {
    // Default arguments value
    let args = '';

    // Get the path to the .vscode directory in the current workspace
    const configFolderPath = path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', '.vscode');
    const configFilePath = path.join(configFolderPath, 'munitconfig.json');

    try {
        // Check if the munitconfig.json file exists
        if (fs.existsSync(configFilePath)) {
            // Read the file's content
            const configFileContent = fs.readFileSync(configFilePath, 'utf-8');
            // Parse the JSON content
            const config = JSON.parse(configFileContent);

            // If the arguments field exists, use it
            if (config && config.arguments) {
                args = config.arguments;
            }
        }
    } catch (error) {
        // If there's an error (e.g., file not found, JSON parsing error), log it and return default args
        console.error('Error reading munitconfig.json:', error);
    }

    // Return the arguments
    return { args };
}