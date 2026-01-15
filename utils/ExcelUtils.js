import ExcelJS from "exceljs";
export default class ExcelUtils {
  async openTestSuite() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(process.env.TEST_SUITE_PATH);
    return workbook;
  }
  async openObjectRepository() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(process.env.OBJECT_REPOSITORY_PATH);
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
    for (let sheet = 1; sheet < testSuiteWorkBook.worksheets.length; sheet++) {
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
    if (
      transactionColNumber === 0 ||
      transactionSheetName === undefined ||
      (transaction !== undefined &&
        objectRepositoryWorkBook.getWorksheet(transactionSheetName) ===
          undefined)
    ) {
      throw new Error(
        `${transactionSheetName} not found in TestSuite or ObjectRepository`
      );
    }
    const testSuiteSheet = testSuiteWorkBook.getWorksheet(transactionSheetName);
    const objectRepositorySheet =
      objectRepositoryWorkBook.getWorksheet(transactionSheetName);

    testSuiteSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) {
        respons.testSuiteData.push({
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
}
