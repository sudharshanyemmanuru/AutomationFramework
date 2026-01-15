// This will accept transaction name as input.

import ExcelUtils from "../utils/ExcelUtils";
import StepExecutor from "./StepExecutor";

// searches transaction in testsuite and objectrepository and execute accordingly.
export default class ExecutionManager{
    constructor(page){
        this.page=page;
        this.execeUtils=new ExcelUtils();
        this.stepExecutor=new StepExecutor(page);
    }
   async  executeTransaction(testCaseId,transaction){
        const response=await this.execeUtils.searchTransaction(testCaseId,transaction)
        console.log(response)
        const testSuiteData=response.testSuiteData
        const objectRepositoryData=response.objects;
        for(let i=0;i<testSuiteData.length;i++){
            await this.stepExecutor.executeStep(testSuiteData[i],objectRepositoryData[i])
        }
    }
}