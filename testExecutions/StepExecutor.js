import ActionPerformer from "./ActionPerformer"

export default class StepExecutor{
    constructor(page){
        this.page=page
        this.actionPerformer=new ActionPerformer(page);
    }
    async executeStep(testSuiteStep,objectRepositoryStep){
        if(testSuiteStep.fieldName!==objectRepositoryStep.fieldName){
            throw new Error(`Field ${testSuiteStep.fieldName} Not present in either in TestSuite or ObjectRepository`)
        }
        if(objectRepositoryStep.xpath===undefined || objectRepositoryStep.xpath===''){
            throw new Error(`For Field ${testSuiteStep.fieldName} xpath is null in ObjectRepository`)
        }
        //perform action.
        if(objectRepositoryStep.fieldType==="Text Box" && objectRepositoryStep.action==="I"){
            await this.actionPerformer.performInputAction(testSuiteStep.data,objectRepositoryStep.xpath)
        }else if(objectRepositoryStep.fieldType==="Button" && objectRepositoryStep.action==="C"){
            await this.actionPerformer.performClickAction(testSuiteStep.data,objectRepositoryStep.xpath)
        }else if(objectRepositoryStep.fieldType==="Checkbox" && objectRepositoryStep.action==="C"){
            await this.actionPerformer.performCheckOrUncheck(testSuiteStep.data,objectRepositoryStep.xpath)
        }else if(objectRepositoryStep.fieldType==="Label" && objectRepositoryStep.action==="V"){
            await this.actionPerformer.performValidation(testSuiteStep.data,objectRepositoryStep.xpath);
        }else if(objectRepositoryStep.fieldType==="Dropdown" && objectRepositoryStep.action==="I"){
            await this.actionPerformer.performSelectAction(testSuiteStep.data,objectRepositoryStep.xpath);
        }
    }
}