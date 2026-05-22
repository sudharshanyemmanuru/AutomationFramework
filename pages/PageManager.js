export default class PageManager{
    /**
     *  This class is responsible for managing pages.
     * -> Get all pages.
     * -> Get Page by URL
     * -> Get Page By Title
     * -> Wait for new Page
     */
    constructor(context){
        this.context=context
    }
    
    async getNewPage(){
        return this.context.newPage();
    }
    getAllPages(){
        return this.context.pages()
    }
    async getPageByUrl(pageUrl){
        return await this.context.pages().find(
            page=>page.url().includes(pageUrl)
        )
    }
    async getPageByTitle(pageTitle){
        for(let page of this.context.pages()){
            const title=await page.title();
            if(title.includes(pageTitle))
                return page;
        }
    }
    async waitForNewPage(triggerAction){
        const [newPage]=await Promise.all([
            this.context.waitForEvent('page'),
            triggerAction()
        ])
        await newPage.waitForLoadState('domcontentloaded')
        return newPage;
    }

}