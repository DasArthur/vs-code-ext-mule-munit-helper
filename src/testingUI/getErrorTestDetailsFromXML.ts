import { parseString } from 'xml2js';
import * as fs from 'fs';
import { getWorkspacePath } from './testTree';
import path from 'path';

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
        failure?: Array<{
            _: string;
            $?: {
              message?: string;
              type?: string;
            };
          }>;
      }>;
    };
  }

export async function returnTestItemError(xmlName: string, testName: string): Promise<{ success: boolean; message: string }> {
    let errorMessage  = "Test Failed"

    const workspacePath = getWorkspacePath();
        if(!workspacePath){
            return{success: false, message: "No workspace was found"};
        }

    const sonarReportsPath = path.join(workspacePath, 'target', 'surefire-reports');

    try{
        const files = await fs.promises.readdir(sonarReportsPath);

        // Find the XML file that matches the test name
        const xmlFile = files.find(file => file.includes(xmlName));

        if (!xmlFile) {
            return{success: false, message: "No matching XML file found"};
        }

        // File found, proceed with reading and parsing
        const xmlFilePath = path.join(sonarReportsPath, xmlFile);
        const xmlContent = await fs.promises.readFile(xmlFilePath, 'utf-8');

        // Wrap parseString in a Promise
        const parseXmlPromise: Promise<TestSuite> = new Promise((resolve, reject) => {
        parseString(xmlContent, (error, result) => {
            if (error) {
            reject(error);
            } else {
            resolve(result);
            }
        });
        });

        const result = await parseXmlPromise;
        
        if (result.testsuite.testcase) {
            const matchingTest = result.testsuite.testcase.find(tc => tc.$.name === testName);
            if (matchingTest && matchingTest.error && matchingTest.error[0]) {
                const errorDetails = matchingTest.error[0];
                if (errorDetails) {
                    errorMessage += `: ${errorDetails}`;
                }
            } else if(matchingTest && matchingTest.failure && matchingTest.failure[0]){
                const errorDetails = matchingTest.failure[0];
                if (errorDetails) {
                    errorMessage += `: ${errorDetails}`;
                }
            }else {
            }
        } else {
        }


        
        }catch(e){

        }
        return{success: true, message: errorMessage};
}