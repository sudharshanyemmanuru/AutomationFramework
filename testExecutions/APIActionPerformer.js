export default class APIActionPerformer{
    constructor(api){
        this.api=api
    }
    async makeGetCall(endPoint,headers,params=null,status){
        const response=await this.api
            .path(endPoint)
            .headers(headers)
            .getRequest(status)
    }
    
}