import { expect } from "@playwright/test";
import test from "node:test";

export default class ActionPerformer{
    constructor(page){
        this.page=page;
    }
    async performInputAction(testData,locator){
        await this.page.locator(locator).fill(testData)
    }
    async performClickAction(testData,locator){
        if(testData!==''){
            await this.page.locator(locator).click();
        }
    }
    async performCheckOrUncheck(testData,locator){
        if(testData!=='' && testData==="Check"){
            await this.page.locator(locator).check();
            await expect(this.page.locator(locator)).toBeChecked();
        }else if(testData!=='' && testData==="Uncheck"){
            await this.page.locator(locator).uncheck();
        }
        else{
            throw new Error("Unsupported value provided for field Checkbox. Provide Check or Uncheck as TestData in TestSuite")
        }
    }
    async performValidation(testData,locator){
        if(testData!==null){
            await expect(this.page.locator(locator)).toHaveText(testData)
        }
    }
    async performSelectAction(testData,locator){
        if(testData!=''){
            await this.page.locator(locator).selectOption(testData)
        }
    }
}