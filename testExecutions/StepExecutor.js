import ExecutorUtils from "../utils/ExecutorUtils";
import ActionPerformer from "./ActionPerformer"
import XpathParser from "./XpathParser";

export default class StepExecutor{
    constructor(page,pageManager){
        this.page=page
        this.actionPerformer=new ActionPerformer(page,pageManager);
        this.xpathParser=new XpathParser();
        this.pageManager=pageManager
        this.executorUtils=new ExecutorUtils();
    }
    async executeStep(testSuiteStep,objectRepositoryStep){
        // parse the xpaths.
        //console.log(`objectRepositoryStep : ${objectRepositoryStep.xpath}`)
        objectRepositoryStep.xpath=this.xpathParser.parseXpath(testSuiteStep,objectRepositoryStep)
        await this.executorUtils.checkForDataFetching(testSuiteStep)
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
        }else if(objectRepositoryStep.fieldType==="PdfValidation" && objectRepositoryStep.action==="V"){
            await this.actionPerformer.performPdfValidationAction(testSuiteStep.data,objectRepositoryStep.xpath);
        }else if(objectRepositoryStep.fieldType==="Dropdown" && objectRepositoryStep.action==="I"){
            // check for DataExtraction keyword from DynamicData ExcelSheet.
            // @[columnName::testCaseId]

            await this.actionPerformer.performSelectAction(testSuiteStep.data,objectRepositoryStep.xpath);
        }else if(objectRepositoryStep.fieldType==="Dropdown" && objectRepositoryStep.action==="INDEX_SELECTION"){
            await this.actionPerformer.performIndexSelectionAction(testSuiteStep.data,objectRepositoryStep.xpath);
        }else if(objectRepositoryStep.fieldType==="SwitchToIFrame" && objectRepositoryStep.action==="SWITCH"){
            const frameCtx=await this.actionPerformer.performSwitchToIFrameAction(testSuiteStep.data,objectRepositoryStep.xpath)
            this.actionPerformer.toggleContext(frameCtx)
        }else if(objectRepositoryStep.fieldType==="SwitchToMainWindow" && objectRepositoryStep.action==="SWITCH"){
            this.actionPerformer.toggleContext(this.page);
        }else if(objectRepositoryStep.fieldType==="SwitchToWindow" && objectRepositoryStep.action==="SWITCH_WINDOW"){
            const windowCtx=await this.actionPerformer.performSwitchToWindowAction(testSuiteStep.data,objectRepositoryStep.xpath)
            this.actionPerformer.toggleContext(windowCtx)
        }else if(objectRepositoryStep.fieldType==="SwitchToMainWindow" && objectRepositoryStep.action==="SWITCH_BY_TITLE"){
            const parentWindowCtx=await this.actionPerformer.performSwitchToMainWindowByTitleAction(testSuiteStep.data,objectRepositoryStep.xpath)
            this.actionPerformer.toggleContext(parentWindowCtx)
        }else if(objectRepositoryStep.fieldType==="DynamicDataHandler" && objectRepositoryStep.action.includes("W;;")){
            const testCaseID=testSuiteStep.testCaseID;
            const colName=objectRepositoryStep.action.split(";;")[1].toUpperCase();
            await this.actionPerformer.saveDataToDynamicDataFile(testSuiteStep.data,objectRepositoryStep.xpath,testCaseID,colName)
        }else if(objectRepositoryStep.fieldType==="API" && objectRepositoryStep.action==="GET"){
            // handle API
        }else if(objectRepositoryStep.fieldType==="OCR"){
            
        }
    }
}