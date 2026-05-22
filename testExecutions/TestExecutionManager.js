// This will accept transaction name as input.

import ExcelUtils from "../utils/ExcelUtils";
import StepExecutor from "./StepExecutor";
import test from "@playwright/test";
// searches transaction in testsuite and objectrepository and execute accordingly.
export default class ExecutionManager{
    constructor(page,pageManager){
        this.page=page;
        this.execeUtils=new ExcelUtils();
        this.stepExecutor=new StepExecutor(page,pageManager);
        this.pageManager=pageManager
    }
   async  executeTransaction(testCaseId,transaction){
        const response=await this.execeUtils.searchTransaction(testCaseId,transaction)
        console.log(response)
        const testSuiteData=response.testSuiteData
        const objectRepositoryData=response.objects;
        for(let i=0;i<testSuiteData.length;i++){
             await test.step(`performing action ${objectRepositoryData[i].action} on Field ${objectRepositoryData[i].fieldType} with locator ${objectRepositoryData[i].xpath} and TestData : ${testSuiteData[i].data}`,async ()=>{
                    await this.stepExecutor.executeStep(testSuiteData[i],objectRepositoryData[i])
             }) 
        }
    }
}