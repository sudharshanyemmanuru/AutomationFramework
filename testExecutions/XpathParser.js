export default class XpathParser{
    /*
        1. FIELD_ARG replace with actaul FieldName in ObjectRepository.
        2. _ARG_ replace with data from TestSuite.
        3. _ARG1_,_ARG2_ replace with data passed from TestSuite.
        
        one single method to parse the xpaths.
        STEPS: 
        ->Has to check If Xpath contains _FIELDNAME_
        ->Has to check If Xpath contains any _ARG_
        ->Has to check If Xpath conatins any _ARG1_,_ARG2_ etc.
        ->Modify InputTestData If Necessary.
    */ 
   constructor(){
    
   }
   parseXpath(testSuiteStep,objectRepositoryStep){
        let xpath=objectRepositoryStep?.xpath?? '';
        let dataFromTestSuite=testSuiteStep?.data ?? '';
        let objectRepositoryFieldName=objectRepositoryStep?.fieldName ?? ''
        
        // Replacing FIELD_ARG
        xpath=xpath.replace("FIELD_ARG",objectRepositoryFieldName);

        // Replacing _VALUE with TestSuiteData
        xpath=xpath.replace("_ARG_",dataFromTestSuite)
    
        // Check for Multi-value placeholders, and replacing with TestSuite Data.
        if(/_ARG\d_/.test(xpath)){
            // Extract Input Data from TestSuite Data
            const [inputData,placeHolderPart]=dataFromTestSuite.split(":");

            if(!placeHolderPart)
                throw new Error("Placeholders are in Invalid format. Please check documentation for correct format.")
            // Extracting placeholderList values from TestSuite Data
            const placeHoldersList=placeHolderPart.split("|");
            //Replacing all _ARG1_,_ARG2_ with their respective placeholder values
            for(let i=1;i<=placeHoldersList.length;i++){
                xpath=xpath.replace(`_ARG${i}_`,placeHoldersList[i-1])
            }
            // resetting the input data back to TestSuiet data again. This can be usefull for perfroming actions.
            testSuiteStep.data=inputData;
        }
        return xpath;
   }
}