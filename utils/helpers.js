import { chromium } from "@playwright/test"
import { capability } from "../configs/cloud-capabilities-config"

export const openCloudContext=async ()=>{
    const cloudCapability=capability
    const cloudBrowser=await chromium.connect({
        wsEndpoint:`wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify(cloudCapability))}`
    })
    const cloudContext=await cloudBrowser.newContext()
    return {
        cloudContext,
        closeBrowser: ()=> cloudBrowser.close()
    }
}