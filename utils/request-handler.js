import {URL} from 'node:url'
import {expect} from '@playwright/test'
export default class RequestHandler{
    constructor(request,baseURL){
        this.request=request
        this.defuaultBaseUrl=baseURL
        this.baseUrl=undefined
        this.apiEndpoint=''
        this.requestBody={}
        this.queryParams={}
        this.headers={}
    }
    uri(uri){
        this.baseURL=uri
        return this
    }
    headers(headers){
        this.headers=headers
        return this
    }
    path(path){
        this.apiEndpoint=path
        return this
    }
    requestBody(requestBody){
        this.requestBody=requestBody
        return this;
    }
    params(params){
        this.queryParams=params
        return this;
    }
    async getRequest(statusCode){
        const uri=this.getUri()
        const response=await this.request.get(uri,{
            headers: this.headers
        })
        const responseBody=await response.json()
        expect(response.status()).toBe(statusCode)
        return responseBody
    }
    async postRequest(statusCode){
        const uri=this.getUri()
        const response=await this.request.post(uri,{
            data:this.requestBody,
            headers:this.headers
        })
        const responseBody=await response.json()
        expect(response.status()).toBe(statusCode)
        return responseBody
    }
    async putRequest(statusCode){
        const uri=this.getUri()
        const response=await this.request.put(uri,{
            data:this.requestBody,
            headers:this.headers
        })
        const responseBody=await response.json();
        expect(response.status()).toBe(statusCode)
        return responseBody
        
    }
    async deleteRequest(statusCode){
        const uri=this.getUri()
        const response=await this.request.delete(uri,{
            headers:this.headers
        })
        expect(response.status()).toBe(statusCode)
    }
    getUri(){
        const uri=new URL(`${this.baseURL ?? this.defuaultBaseUrl}${this.apiEndpoint}`)
        for(const [key,val] of Object.entries(this.params)){
            uri.searchParams.append(key,val)
        }
        return uri.toString()
    }
    
}