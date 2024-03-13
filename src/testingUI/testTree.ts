import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { parseYamlEncryption } from './parser';
import * as path from 'path';
import { exec } from 'child_process';
import { returnTestItemError } from './getErrorTestDetailsFromXML';
import { getArguments } from './readArgumentsFromFile';
import { setPercentage } from '../statusBar/showCoverage';


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


	public updateFromContents(controller: vscode.TestController, content: string, item: vscode.TestItem, context: vscode.ExtensionContext, encKey: string) {
		this.didResolve = true;

		if(!item.uri){
			return;
		}
		
		// Retrieve or create the file item as a child of the workspace folder
		const fileId = item.uri.toString();
		let fileItem = controller.items.get(fileId);
		if (!fileItem) {
			fileItem = controller.createTestItem(fileId, item.uri.path.split('/').pop()!, item.uri);
			controller.items.add(fileItem);
		}

		
		parseYamlEncryption(content, {
			onTest: (range, testName, rangeText, testSkipped, testDescription) => {
				const data = new TestCase(testName, testSkipped);
				const id = `${item.uri}/${testName}`;
	
				let tcase = fileItem?.children.get(id);
	
				if (!tcase) {
					tcase = controller.createTestItem(id, testName, item.uri);
					testData.set(tcase, data);
					tcase.range = range;
					tcase.description = testDescription;
					fileItem?.children.add(tcase);
				} else {
					testData.set(tcase, data); // Update the associated data
					tcase.label = testName; // Update the label
					tcase.description = testDescription;
					tcase.range = range; // Update the range
				}
			},
		});

		if (fileItem && fileItem.children.size === 0) {
			controller.items.delete(fileId);
		}

	}
}

export class TestHeading {
	constructor(public generation: number) { }
}


export class TestCase {
	constructor(
		private readonly testName: string,
		private readonly testSkipped: boolean
	) { }

	getLabel() {
		return `${this.testName}`;
	}

	async run(item: vscode.TestItem, options: vscode.TestRun, controller: vscode.TestController): Promise<void> {
		const start = Date.now();

		try {

			if(!item.uri){
				return;
			}

			let log = "";
			let success = true;
			const fileName = path.basename(item.uri!.fsPath); 
			const cmdlineargs = (await getArguments()).args;


			if(this.testSkipped){

			}else{
				await new Promise<boolean>((resolve) => {
					// Construct the command
					const isSingleTest = item.parent && item.parent !== item; // Assuming that if there's a parent, this is a single test
					// Usage
					const workspacePath = getWorkspacePath();
					if (!workspacePath) {
						success = false;
						resolve(false);
						return;
					}
					
					let command = `cd "${workspacePath}" && mvn clean test`;
	
					if (isSingleTest) {
						const testName = item.label; // Assuming the item's label is the test name						
						command += ` -Dmunit.test=${fileName}#${testName}`;
					} else {
						command += ` -Dmunit.test=${fileName}`;
					}

					command += ` ${cmdlineargs}`;
			
					const execProcess = exec(command,{ timeout: 600000, maxBuffer: 1024 * 1024 * 20 }); // 20MB buffer

		
					execProcess.stdout?.on('data', (data) => {
						options.appendOutput(data.replace(/\n/g, '\r\n'));
						log += data;
					  });
					  
					  execProcess.stderr?.on('data', (data) => {
						  options.appendOutput(data.replace(/\n/g, '\r\n'));
						  log += data;
					  });
					  
					  execProcess.on('close', (code) => {
						if (code === 0) {
						  	success = true;
							resolve(true);
							return;
						} else {	
							success = false;
							resolve(false);
							return;
						}
					  });
	
				});
			}			

			const coverageMatch = log.match(/Application Coverage: (\d+\.\d{2})%/);
			if(coverageMatch && coverageMatch[1]){
				setPercentage(coverageMatch[1]);
			}

			const duration = Date.now() - start;

			if(this.testSkipped){
				options.skipped(item);
			} else if (success) {
				options.passed(item, duration);
			} else {

				let errorMessage  = (await returnTestItemError(fileName, this.testName)).message;

				const message = new vscode.TestMessage(errorMessage);
				message.location = new vscode.Location(item.uri!, item.range!);
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
export function getWorkspacePath(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders && workspaceFolders.length > 0
        ? workspaceFolders[0].uri.fsPath
        : undefined;
}
