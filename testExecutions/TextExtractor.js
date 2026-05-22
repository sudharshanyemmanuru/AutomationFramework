import Tesseract from "tesseract.js";
export default class TextExtractor{
    async extractText(imageFilePath){
        const textResult=await Tesseract.recognize(
            imageFilePath,
            'eng',{
                logger:m=>console.log(m)
            }
        )
        console.log(textResult)
    }
}