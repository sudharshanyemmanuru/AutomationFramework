import ExcelJS from "exceljs";
import fs from 'fs'
import path from "path";
import dotenv from 'dotenv'
dotenv.config()
export default class ExcelUtils {

  async openTestSuite() {
    const workbook = new ExcelJS.Workbook();
    console.log(`path : ${process.env.TEST_SUITE_PATH}`)
    await workbook.xlsx.readFile(process.env.TEST_SUITE_PATH);
    return workbook;
  }
  async openObjectRepository() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(process.env.OBJECT_REPOSITORY_PATH);
    return workbook;
  }
  async openDynamicDataFile(){
    const workbook=new ExcelJS.Workbook();
    await workbook.xlsx.readFile(process.env.DYNAMIC_DATA_SHEET)
    return workbook;
  }

  async getFilledRows(sheetName) {
    const workbook = await this.openTestSuite();
    const sheet = workbook.getWorksheet(sheetName);
    let count = 0;
    const suiteResponse = {
      totalTestCases: 0,
      testCases: [],
    };

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && row.actualCellCount > 1) {
        suiteResponse.testCases.push({
          testCaseName: row.getCell("A").value,
          categeory: row.getCell("B").value,
          execute: row.getCell("C").value,
          transactions: row.values.slice(4, row.actualCellCount + 1),
        });
        count++;
      }
    });
    suiteResponse.totalTestCases = count;
    return suiteResponse;
  }
  async searchTransaction(currentTestCaseId, transaction) {
    console.log(`Test Case Id : ${currentTestCaseId}`);
    const testSuiteWorkBook = await this.openTestSuite();
    const objectRepositoryWorkBook = await this.openObjectRepository();
    let transactionColNumber = 0;
    let transactionSheetName;
    let respons = {
      testSuiteData: [],
      objects: [],
    };

    //populating TestCaseID
    // respons.testCaseID=currentTestCaseId;


    // Handling global transactions transaction #@gbl and TestCase = Common
    if (transaction.endsWith("#@gbl")) {
      // handle global Transactions here.
      const globalTransactionSheetResponse = this.getGlobalTransactionSheet(
        testSuiteWorkBook,
        transaction,
      );
      transactionColNumber = globalTransactionSheetResponse?.columnNumber ?? 0;
      transactionSheetName =
        globalTransactionSheetResponse?.sheetName ?? undefined;
      console.log(`transaction Sheet Name ${transactionSheetName}`);
    } else {
      for (
        let sheet = 1;
        sheet < testSuiteWorkBook.worksheets.length;
        sheet++
      ) {
        const currentSheet = testSuiteWorkBook.worksheets[sheet];
        for (let col = 0; col < currentSheet.columns.length; col++) {
          const currentTestCase = currentSheet.getCell(1, col + 1).value;
          const currentTxn = currentSheet.getCell(2, col + 1).value;

          if (
            currentTestCase === currentTestCaseId &&
            currentTxn === transaction
          ) {
            transactionColNumber = col + 1;
            transactionSheetName = currentSheet.name;
            console.log(`current Sheet Name : ${currentSheet.name}`);
          }
        }
      }
    }
    if (
      transactionColNumber === 0 ||
      transactionSheetName === undefined ||
      (transaction !== undefined &&
        objectRepositoryWorkBook.getWorksheet(transactionSheetName) ===
          undefined)
    ) {
      throw new Error(
        `${transaction} not found in TestSuite or ObjectRepository`,
      );
    }
    const testSuiteSheet = testSuiteWorkBook.getWorksheet(transactionSheetName);
    const objectRepositorySheet =
      objectRepositoryWorkBook.getWorksheet(transactionSheetName);

    testSuiteSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) {
        respons.testSuiteData.push({
          testCaseID:currentTestCaseId,
          fieldName: row.getCell("A").value,
          data: row.getCell(transactionColNumber).value,
        });
      }
    });
    objectRepositorySheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        respons.objects.push({
          fieldName: row.getCell("A").value,
          fieldType: row.getCell("B").value,
          action: row.getCell("C").value,
          xpath: row.getCell("D").value,
        });
      }
    });
    return respons;
  }
  getGlobalTransactionSheet(wb, globalTransaction) {
    const globalTxnSheetResponse = {};
    for (let i = 0; i < wb.worksheets.length; i++) {
      const sheet = wb.worksheets[i];
      for (let col = 0; col < sheet.columns.length; col++) {
        if (
          globalTransaction === sheet.getCell(2, col + 1).value &&
          sheet.getCell(1, col + 1).value === "Common"
        ) {
          globalTxnSheetResponse.columnNumber = col+1;
          globalTxnSheetResponse.sheetName = sheet.name;
          break;
        }
      }
    }
    return globalTxnSheetResponse;
  }
  async createDynamicDataSheetIfNotExists(filePath){
    // filePath = ./project/test/DynamicData.xlsx

  const dirPath = path.dirname(filePath);

  //  Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  //  If file already exists, don't override
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  //  Create workbook & sheet
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Data');

  //  Write file
  await workbook.xlsx.writeFile(filePath);

  return filePath;
  }

  async storeDataIntoDynamicDataFile(testCaseId,columnName,dataToStore){
    const dynamicDataFile=await this.openDynamicDataFile();
    const dataSheet=dynamicDataFile.worksheets[0]
    
    // Check If TestCaseID and colName is present
    const cordinate=this.getRowAndColByTestCaseIdAndColName(dataSheet,testCaseId,columnName);
    if(cordinate.rowNumber===-1 || cordinate.colNumber===-1){
      // create entry of new TestCaseID and colName and Then store data.
      let dataSheetRow;
      // If It is a First Entry to DataSheet.
      if(cordinate.rowNumber===-1 && cordinate.colNumber===-1){
        const row=this.nextEmptyRow(dataSheet)
        const col=this.nextEmptyCellInArow(dataSheet,1)
        dataSheetRow=dataSheet.getRow(row);
        dataSheetRow.getCell(1).value=testCaseId
        //dataSheet.getRow(1).getCell(col).value='TestCaseId'
        dataSheet.getRow(1).getCell(col).value=columnName; //
        dataSheetRow.getCell(col).value=dataToStore
      }else if(cordinate.colNumber==-1&&cordinate.rowNumber!==-1){
        // add new column of existing testcaseId
        dataSheetRow=dataSheet.getRow(cordinate.rowNumber)
        const nextColumnNumber=this.nextEmptyCellInArow(dataSheet,cordinate.rowNumber)
        dataSheet.getRow(1).getCell(nextColumnNumber).value=columnName
        dataSheetRow.getCell(nextColumnNumber).value=dataToStore
      }else{ //More than one entries are there in DataSheet.
        dataSheetRow=dataSheet.getRow(row);
        dataSheetRow.getCell(1).value=testCaseId
        dataSheet.getRow(1).getCell(col).value=columnName;
        dataSheetRow.getCell(col).value=dataToStore
      }
    }else{
      const dataSheetRow=dataSheet.getRow(cordinate.rowNumber);
      dataSheetRow.getCell(cordinate.colNumber).value=dataToStore
    }
    // Save Excel File.
    await dynamicDataFile.xlsx.writeFile(process.env.DYNAMIC_DATA_SHEET)
  }
  async fetchDataFromDyanamicDataFile(testCaseId,colName){
    let data=''
    const dynamicDataFile=await this.openDynamicDataFile();
    const dataSheet=dynamicDataFile.worksheets[0]
    const dataCordinates=this.getRowAndColByTestCaseIdAndColName(dataSheet,testCaseId,colName)
    if(dataCordinates.rowNumber!==-1 && dataCordinates.colNumber!==-1){
      const dataRow=dataSheet.getRow(dataCordinates.rowNumber)
      data=dataRow.getCell(dataCordinates.colNumber).value
    }
    return data;
  }
  getRowAndColByTestCaseIdAndColName(sheet,testCaseID,colName){
    const cordinate={
      rowNumber:-1,
      colNumber:-1
    }
    sheet.eachRow((row,rowNum)=>{
      if(row.getCell(1).value===testCaseID)
        cordinate.rowNumber=rowNum
    })
    const dataSheetRow=sheet.getRow(1);
    for(let i=1;i<=sheet.columns?.length;i++){
      if(!dataSheetRow)
        break;
      const dataSheetColName=dataSheetRow.getCell(i).value;
      if(dataSheetColName===colName){
        cordinate.colNumber=i;
        break;
      }
    }
    return cordinate
  }
  nextEmptyRow(sheet){
    return (sheet.lastRow?.number || 0)+1
  }
  nextEmptyCellInArow(sheet,rowNumber){
    let col=1;
    const row=sheet.getRow(rowNumber)
    while(row.getCell(col).value!==null)
      col++;
    return col;
  }
}
