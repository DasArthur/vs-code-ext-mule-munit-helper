import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { parseYamlEncryption } from './parser';
import * as path from 'path';
import { exec as cpExec } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';


const textDecoder = new TextDecoder('utf-8');

export type MarkdownTestData = TestFile | TestHeading | TestCase;

export const testData = new WeakMap<vscode.TestItem, MarkdownTestData>();

let generationCounter = 0;

export const getContentFromFilesystem = async (uri: vscode.Uri) => {
	try {
		const rawContent = await vscode.workspace.fs.readFile(uri);
		return textDecoder.decode(rawContent);
	} catch (e) {
		console.warn(`Error providing tests for ${uri.fsPath}`, e);
		return '';
	}
};

export class TestFile {
	public didResolve = false;

	public async updateFromDisk(controller: vscode.TestController, item: vscode.TestItem, context: vscode.ExtensionContext, encKey: string) {
		try {
			const content = await getContentFromFilesystem(item.uri!);
			item.error = undefined;
			this.updateFromContents(controller, content, item, context, encKey);
		} catch (e) {
			item.error = (e as Error).stack;
		}
	}

	/**
	 * Parses the tests from the input text, and updates the tests contained
	 * by this file to be those from the text,
	 */
	public updateFromContents(controller: vscode.TestController, content: string, item: vscode.TestItem, context: vscode.ExtensionContext, encKey: string) {
		const thisGeneration = generationCounter++;
		this.didResolve = true;

		if(!item.uri){
			return;
		}

		const parentId = `${item.uri}`;
		let parent = controller.items.get(parentId);
		if (!parent) {
			parent = controller.createTestItem(parentId, item.uri.path.split('/').pop()!, item.uri);
			controller.items.add(parent);
		}
		
		parseYamlEncryption(content, {
			onTest: (range, testName, rangeText) => {
				const data = new TestCase(testName);
				const id = `${item.uri}/${range.start.line}`;
	
				let tcase = parent?.children.get(id);
	
				if (!tcase) {
					tcase = controller.createTestItem(id, testName, item.uri);
					testData.set(tcase, data);
					tcase.range = range;
					parent?.children.add(tcase);
				} else {
					testData.set(tcase, data); // Update the associated data
					tcase.label = testName; // Update the label
					tcase.range = range; // Update the range
				}
			},
			// The onHeading event can be handled similarly if needed
		});

		if (parent && parent.children.size === 0) {
			controller.items.delete(parentId);
		}
		// Other logic...
	}
}

export class TestHeading {
	constructor(public generation: number) { }
}


export class TestCase {
	constructor(
		private readonly testName: string
	) { }

	getLabel() {
		return `${this.testName}`;
	}

	async run(item: vscode.TestItem, options: vscode.TestRun): Promise<void> {
		const start = Date.now();

		try {



			const success = await new Promise<boolean>((resolve) => {
				// Construct the command
				const isSingleTest = item.parent && item.parent !== item; // Assuming that if there's a parent, this is a single test
				// Usage
				const workspacePath = getWorkspacePath();
				if (!workspacePath) {
					resolve(true);
					return;
				}
				
				let command = `cd "${workspacePath}" && mvn clean test`;

				if (isSingleTest) {
					const testName = item.label; // Assuming the item's label is the test name
					const fileName = path.basename(item.uri!.fsPath); // Assuming the item's URI is the file path
					command += ` -Dmunit.test=${fileName}#${testName}`;
				} else {
					// If it's not a single test, run all tests in the file
					const fileName = path.basename(item.uri!.fsPath);
					command += ` -Dmunit.test=${fileName}`;
				}
		
				const execProcess = exec(command);

				let log = "";

				execProcess.stdout?.on('data', (data) => {
					console.log(`stdout: ${data}`);
					options.appendOutput(data.replace(/\n/g, '\r\n'));
					log += data;
				  });
				  
				  execProcess.stderr?.on('data', (data) => {
					console.error(`stderr: ${data}`);
					options.appendOutput(data.replace(/\n/g, '\r\n'));
				  });
				  
				  execProcess.on('close', (code) => {
					if (code === 0) {
					  vscode.window.showInformationMessage('Command executed successfully');
					  resolve(true);
					  return;
					} else {


					
					 

					  vscode.window.showErrorMessage('Command failed to execute');

					  vscode.window.showInformationMessage(`Error:`);
						resolve(false);
						return false;
					}
				  });

			});

			const duration = Date.now() - start;
			// const testResults = await this.parseTestResults(stdout + stderr);

			if (success) {
				options.passed(item, duration);
			} else {
				const message = new vscode.TestMessage(`kaka`);
				// const message.location = new vscode.Location(item.uri!, item.range!);
				options.failed(item, message , duration);
			}
		} catch (error) {
			const duration = Date.now() - start;
			const message = new vscode.TestMessage(`Error while testing ${this.testName}: ${error}`);
			message.location = new vscode.Location(item.uri!, item.range!);
			options.failed(item, message, duration);
		}
	}
}



// This method returns the path of the first workspace folder
function getWorkspacePath(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders && workspaceFolders.length > 0
        ? workspaceFolders[0].uri.fsPath
        : undefined;
}
