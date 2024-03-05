import * as vscode from 'vscode';
import * as path from 'path';
import { getWorkspacePath } from './testTree';
import { exec } from 'child_process';
import { setPercentage } from '../statusBar/showCoverage';
import { parseString } from 'xml2js';
import * as fs from 'fs';
import { returnTestItemError } from './getErrorTestDetailsFromXML';
import { getArguments } from './readArgumentsFromFile';

interface TestSuite {
  testsuite: {
    $: {
      name: string;
      time: string;
      failures: string;
      errors: string;
      skipped: string;
      tests: string;
    };
    properties?: {
      property: Array<{
        $: {
          key: string;
          value: string;
        };
      }>;
    };
    testcase: Array<{
      $: {
        time: string;
        name: string;
        classname: string;
      };
      error?: Array<{
        _: string;
        $?: {
          message?: string;
          type?: string;
        };
      }>;
    }>;
  };
}

export async function runMunitTestSuiteForXMLFile(request: vscode.TestRunRequest, ctrl: vscode.TestController){


      let success = true;
      let log = "";
      const run = ctrl.createTestRun(request, "MUnit Test Run", false);

      const cmdlineargs = (await getArguments()).args;

      try {
            await new Promise<boolean>((resolve) => {
              // Construct the command
              // Usage
              const workspacePath = getWorkspacePath();
              if (!workspacePath) {
                success = false;
                resolve(false);
                return;
              }

              let fileName;
              let command = `cd "${workspacePath}" && mvn clean test`;
              if(request.include){
                fileName = path.basename(request.include[0].uri!.path.split('/').pop()!); // Assuming the item's URI is the file path
                command += ` -Dmunit.test="${fileName}"`;
              }

              command += ` ${cmdlineargs}`;          

              const execProcess = exec(command);
        
              execProcess.stdout?.on('data', (data) => {
                run.appendOutput(data.replace(/\n/g, '\r\n'));
                log += data;
              });
                
              execProcess.stderr?.on('data', (data) => {
                  run.appendOutput(data.replace(/\n/g, '\r\n'));
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


        // Assuming `log` is the string containing the output from the test run
        const testResultsRegex = /(ERROR|FAILURE|SUCCESS|IGNORED)\s+-\s+test:\s+([\w-]+).*?Time elapsed: (\d+\.\d{2}) sec/g;
        const testResults: { [key: string]: { status: string, time: string } } = {};

        const matches = [...log.matchAll(testResultsRegex)];
        matches.forEach((match) => {
          const testStatus = match[1].trim();
          const testName = match[2].trim();
          const time = match[3].trim();
          testResults[testName] = { status: testStatus, time: time };
        });
        
      


        
          // Assuming testItem.label is the parent project name
          for (const [, xmlItem] of ctrl.items) {
              for (const [, xmlTestItem] of xmlItem.children) {

                  // Assuming childTestItem.label matches the testName in the log
                  if (testResults[xmlTestItem.label]) {
                    const result = testResults[xmlTestItem.label];
                    if (result.status === 'ERROR') {
                      let errorMessage  = (await returnTestItemError(xmlItem.label, xmlTestItem.label)).message;
                      run.failed(xmlTestItem, new vscode.TestMessage(errorMessage), Number(result.time) );
                    } else if (result.status === 'FAILURE') {
                      let errorMessage  = (await returnTestItemError(xmlItem.label, xmlTestItem.label)).message;
                      run.failed(xmlTestItem, new vscode.TestMessage(errorMessage),  Number(result.time));
                    } else if (result.status === 'IGNORED') {
                      run.skipped(xmlTestItem);
                    } else {
                      run.passed(xmlTestItem,  Number(result.time));
                    }
                  }

              }
          }

        const coverageMatch = log.match(/Application Coverage: (\d+\.\d{2})%/);



        if (coverageMatch && coverageMatch[1]) {
          setPercentage(coverageMatch[1]);
        } else {
          setPercentage("Unknown"); // or any default message you want to show when coverage is not found
        }

        run.end();
      } catch (error) {
        setPercentage("Error");
        run.end();
      }
			
}