import { test } from "@playwright/test";

import ExecutionManager from "../testExecutions/TestExecutionManager";
import ExcelUtils from "../utils/ExcelUtils";


const execeUtils=new ExcelUtils();
const testCasesResponse = await execeUtils.getFilledRows("TestSuite");

for (let r = 1; r <= testCasesResponse.totalTestCases; r++) {
  const scenarioName = testCasesResponse.testCases[r - 1].testCaseName;
  const categeoryName = testCasesResponse.testCases[r - 1].categeory;
  const toExecute = testCasesResponse.testCases[r - 1].execute;
  const transactionArray=testCasesResponse.testCases[r-1].transactions;
  const shouldSkip = toExecute !== "Y";
  test(
    `${scenarioName}`,
    {
      tag: `@${categeoryName}`,
    },
    async ({ page }) => {
      test.skip(shouldSkip, "skiiping test");
      await test.step("Open browser with URL", async () => {
        await page.goto("/");
      });
      let executionManager=new ExecutionManager(page)
      console.log(`Transactions Array : ${transactionArray}`)
      for(let tr=0;tr<transactionArray.length;tr++){
        await test.step(`${transactionArray[tr]}`,async ()=>{
          await executionManager.executeTransaction(scenarioName,transactionArray[tr])
        })
      }
    }
  );
}
