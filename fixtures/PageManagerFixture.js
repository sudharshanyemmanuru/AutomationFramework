import {test as base, request} from '@playwright/test'
import PageManager from '../pages/PageManager';
import RequestHandler from '../utils/request-handler';
import { openCloudContext } from '../utils/helpers';

export const test=base.extend({
    pageManager: async({context},use)=>{
        let activeContext=context
        let cleanUpFunction
        if(process.env.CLOUD_EXECUTION==='true'){
            const{cloudContext,closeBrowser}=await openCloudContext()
            activeContext=cloudContext
            cleanUpFunction=closeBrowser
        }
        const pageManager=new PageManager(activeContext);

        await use(pageManager);
        await context.close();
        if(cleanUpFunction!==undefined)
            await cleanUpFunction()
    },
    api:async({request},use)=>{
        const baseURL=process.env.APP_URL
        const api=new RequestHandler(request,baseURL)
        await use(api)
    }
})


/**
 * Object Repository:
 * FieldName FieldType Action Xpath Id smartLocator ---> UI Automation.
 * TestSuite
 * FiledName Txn Data--> Same UI Automation.
 * 
 * API Automation TestSuite and ObjectRepository structure.
 * -----------------------------------------------------------
 * Object Repository:
 * FieldName FieldType Action endPoint ---> API Automation.
 * 
 * TestSuite
 * FieldName txn Data[]
 * 
 * FieldType: API-> map to API Automation.
 * Actions: POST,PUT,DELETE,GET
 * 
 * 
 */