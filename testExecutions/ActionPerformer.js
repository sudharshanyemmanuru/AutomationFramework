import { expect, test } from "@playwright/test";
import ExcelUtils from "../utils/ExcelUtils";
import fs from "fs";
import path from "path";
import PdfValidationUtils from "../utils/PdfValidationUtils";


export default class ActionPerformer{
    constructor(page,pageManager){
        this.page=page;
        this.pageManager=pageManager
        this.excelUtils=new ExcelUtils();
        this.pdfValidationUtils=new PdfValidationUtils();
    }
    toggleContext(toggledContext){
        this.page=toggledContext;
    }
    async performInputAction(testData,locator){
        if(testData!==null){
            console.log(`Perform Input ${testData}`)
            await this.page.locator(locator).fill(testData)
        }
    }
    async performClickAction(testData,locator){
        if(testData!==null){
            await this.page.locator(locator).click();
        }
    }
    async performCheckOrUncheck(testData,locator){
        if(testData!==null && testData==="Check"){
            await this.page.locator(locator).check();
            await expect(this.page.locator(locator)).toBeChecked();
        }else if(testData!==null && testData==="Uncheck"){
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
        if(testData!==null){
            await this.page.locator(locator).selectOption(testData)
        }
    }
    async performIndexSelectionAction(testData,locator){
        if(testData!=null){
            if(/^[0-9]$/.test(testData))
                await this.page.locator(locator).selectOption({index:Number(testData)})
            else
                throw new Error("Provide valid INDEX Number, in Numeric format")
        }
    }
    async performSwitchToIFrameAction(testData,locator){
        let frame;
        if(testData!=null){
            frame=await this.page.frameLocator(locator);
            //this.page=frame;
        }
        return frame;
    }
    async performSwitchToWindowAction(testData,locator){
        let windowPage;
        if(testData!==null){
            windowPage=await this.pageManager.waitForNewPage(
                ()=>this.page.locator(locator).click()  //Trigger Action function.
            )
        }
        return windowPage
    }
    async performSwitchToMainWindowByTitleAction(testData,locator){
        let parentWindow;
        if(testData!==null){
            parentWindow=await this.pageManager.getPageByTitle(locator);
        }
        return parentWindow
    }
    async performDownloadAction(testData,locator){
        let downloadedFilePath;
        if(testData!==null){
            const downloadFolderPath=process.env.DOWNLOAD_FOLDER_PATH;
            if(!downloadFolderPath){
                throw new Error("Set DOWNLOAD_FOLDER_PATH in .env for download action");
            }
            await fs.promises.mkdir(downloadFolderPath,{recursive:true});
            const downloadPromise=this.page.waitForEvent("download");
            await this.page.locator(locator).click();
            const download=await downloadPromise;
            const fileName=testData.trim()!=="" ? testData.trim() : download.suggestedFilename();
            downloadedFilePath=path.resolve(downloadFolderPath,fileName);
            if(fs.existsSync(downloadedFilePath)){
                const archiveFolderPath=path.resolve(downloadFolderPath,"archive");
                await fs.promises.mkdir(archiveFolderPath,{recursive:true});
                const parsedFileName=path.parse(fileName);
                const timestamp=new Date().toISOString().replace(/[:.]/g,"-");
                const archivedFileName=`${parsedFileName.name}_${timestamp}${parsedFileName.ext}`;
                const archivedFilePath=path.resolve(archiveFolderPath,archivedFileName);
                await fs.promises.rename(downloadedFilePath,archivedFilePath);
            }
            await download.saveAs(downloadedFilePath);
        }
        return downloadedFilePath;
    }
    async performPdfValidationAction(testData,locator){
        if(testData!==null){
            if(!process.env.APPLICATION_URL){
                throw new Error("Set APPLICATION_URL in .env for PdfValidation flow");
            }
            const downloadFolderPath=process.env.DOWNLOAD_FOLDER_PATH;
            if(!downloadFolderPath){
                throw new Error("Set DOWNLOAD_FOLDER_PATH in .env for PdfValidation flow");
            }
            const providedFileName=String(testData).trim();
            if(providedFileName===""){
                throw new Error("Provide PDF file name in TestSuite data for PdfValidation flow");
            }
            const fileNameForValidation=providedFileName.toLowerCase().endsWith(".pdf")
                ? providedFileName
                : `${providedFileName}.pdf`;

            //await this.page.goto(`${process.env.APPLICATION_URL}`);
            const downloadedPdfPath=await this.performDownloadAction(fileNameForValidation,locator);

            const expectedFolderPath=path.resolve(downloadFolderPath,"expected");
            await fs.promises.mkdir(expectedFolderPath,{recursive:true});
            const expectedPdfPath=path.resolve(expectedFolderPath,fileNameForValidation);
            let resolvedExpectedPdfPath=expectedPdfPath;
            if(!fs.existsSync(resolvedExpectedPdfPath)){
                const expectedFiles=await fs.promises.readdir(expectedFolderPath);
                const matchedExpectedFile=expectedFiles.find((fileName)=>{
                    const parsedFileName=path.parse(fileName).name.toLowerCase();
                    return parsedFileName===providedFileName.toLowerCase();
                });
                if(matchedExpectedFile){
                    resolvedExpectedPdfPath=path.resolve(expectedFolderPath,matchedExpectedFile);
                }else{
                    throw new Error(`Expected PDF not found at path ${expectedPdfPath}`);
                }
            }

            const reportDirectoryPath=path.resolve(downloadFolderPath,"pdf-validation-reports");
            const reportResult=await this.pdfValidationUtils.comparePdfFilesAndCreateHtmlReport(
                resolvedExpectedPdfPath,
                downloadedPdfPath,
                reportDirectoryPath
            );

            await test.info().attach("pdf-validation-report",{
                path:reportResult.reportFilePath,
                contentType:"text/html"
            });
            await test.info().attach("actual-downloaded-pdf",{
                path:downloadedPdfPath,
                contentType:"application/pdf"
            });
            await test.info().attach("expected-pdf",{
                path:resolvedExpectedPdfPath,
                contentType:"application/pdf"
            });

            expect(reportResult.mismatchCount,`PDF content mismatches found. Refer attached report ${reportResult.reportFilePath}`).toBe(0);
        }
    }
    
    async saveDataToDynamicDataFile(testData,locator,testCaseID,colName){
        if(testData!=null){
            const extractedDataFromLocator=await this.page.locator(locator).textContent()
            await this.excelUtils.storeDataIntoDynamicDataFile(testCaseID,colName,extractedDataFromLocator)
        }
    }
}