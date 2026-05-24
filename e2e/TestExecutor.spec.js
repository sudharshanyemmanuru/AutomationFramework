import { test } from "../fixtures/PageManagerFixture";

import ExecutionManager from "../testExecutions/TestExecutionManager";
import ExcelUtils from "../utils/ExcelUtils";


const execeUtils=new ExcelUtils();
const testCasesResponse = await execeUtils.getFilledRows("TestSuite");



//
test.beforeAll(async ({})=>{
    await execeUtils.createDynamicDataSheetIfNotExists(process.env.DYNAMIC_DATA_SHEET)
});

for (let r = 1; r <= testCasesResponse.totalTestCases; r++) {
  const scenarioName = testCasesResponse.testCases[r - 1].testCaseName;
  const categeoryName = testCasesResponse.testCases[r - 1].categeory;
  const toExecute = testCasesResponse.testCases[r - 1].execute;
  const transactionArray=testCasesResponse.testCases[r-1].transactions;
  const shouldSkip = toExecute !== "Y";
  if(shouldSkip)
        continue;
  test(
    `${scenarioName}`,
    {
      tag: `@${categeoryName}`,
    },
    async ({ pageManager }) => {
      const page=await pageManager.getNewPage();
    
      await test.step(`Open browser with URL ${process.env.APPLICATION_URL}`, async () => {
        await page.goto(`${process.env.APPLICATION_URL}`);
      });
      let executionManager=new ExecutionManager(page,pageManager)
      console.log(`Transactions Array : ${transactionArray}`)
      for(let tr=0;tr<transactionArray.length;tr++){
        await test.step(`Executing Transaction : ${transactionArray[tr]}`,async ()=>{
          await executionManager.executeTransaction(scenarioName,transactionArray[tr])
        })
      }
    }
  );
}
