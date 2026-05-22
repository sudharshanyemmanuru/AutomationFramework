import ExcelUtils from "./ExcelUtils"

export default class ExecutorUtils{
    constructor(){
        this.excelUtils=new ExcelUtils();
    }
    async checkForDataFetching(testSuiteStep){
        const dataFetchPattern=/@\[(\w+)::(\w+)\]/;
        if(dataFetchPattern.test(testSuiteStep.data)){
            //fetch data using excelUtils.
            //Extract columnName and testCaseID from testSuiteStep
            const text=testSuiteStep.data;
            const matches=text.match(dataFetchPattern)
            const fetchedData=await this.excelUtils.fetchDataFromDyanamicDataFile(matches[2],matches[1])
            testSuiteStep.data=fetchedData
        }
    }
}