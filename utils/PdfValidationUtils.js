import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

export default class PdfValidationUtils {
    async extractPdfText(pdfFilePath){
        const fileBuffer=await fs.promises.readFile(pdfFilePath);
        const parser=new PDFParse({data:fileBuffer});
        const parsedPdf=await parser.getText();
        await parser.destroy();
        return (parsedPdf.text || "").replace(/\r\n/g,"\n");
    }
    async comparePdfFilesAndCreateHtmlReport(expectedPdfPath,actualPdfPath,reportDirectoryPath){
        const excludeDsl=process.env.EXCLUDE_CONTENT || "";
        const exclusionRules=this.parseExcludeDsl(excludeDsl);
        const expectedContentRaw=await this.extractPdfText(expectedPdfPath);
        const actualContentRaw=await this.extractPdfText(actualPdfPath);
        const expectedContent=this.applyExclusions(expectedContentRaw,exclusionRules);
        const actualContent=this.applyExclusions(actualContentRaw,exclusionRules);

        const expectedLines=expectedContent.split("\n");
        const actualLines=actualContent.split("\n");
        const maxLines=Math.max(expectedLines.length,actualLines.length);

        let mismatchCount=0;
        const diffRows=[];
        for(let i=0;i<maxLines;i++){
            const expectedLine=expectedLines[i] ?? "";
            const actualLine=actualLines[i] ?? "";
            const isMismatch=expectedLine!==actualLine;
            if(isMismatch){
                mismatchCount++;
            }
            diffRows.push({
                lineNumber:i+1,
                expectedLine:this.escapeHtml(expectedLine),
                actualLine:this.escapeHtml(actualLine),
                isMismatch
            });
        }

        await fs.promises.mkdir(reportDirectoryPath,{recursive:true});
        const reportFilePath=path.resolve(reportDirectoryPath,`pdf-validation-${Date.now()}.html`);
        const htmlReport=this.buildHtmlReport(expectedPdfPath,actualPdfPath,diffRows,mismatchCount,exclusionRules);
        await fs.promises.writeFile(reportFilePath,htmlReport,"utf-8");

        return {
            reportFilePath,
            mismatchCount
        };
    }
    parseExcludeDsl(excludeDsl){
        if(!excludeDsl || excludeDsl.trim()===""){
            return [];
        }

        const tokens=excludeDsl
            .split(";;")
            .map((token)=>token.trim())
            .filter((token)=>token!=="");

        const rules=tokens.map((token,idx)=>{
            const separatorIndex=token.indexOf(":");
            if(separatorIndex===-1){
                throw new Error(`Invalid EXCLUDE_CONTENT DSL token "${token}". Use type:value format`);
            }
            const ruleType=token.slice(0,separatorIndex).trim().toUpperCase();
            const ruleValue=token.slice(separatorIndex+1).trim();
            if(ruleValue===""){
                throw new Error(`Invalid EXCLUDE_CONTENT DSL token "${token}". Value is required`);
            }

            if(ruleType==="TEXT"){
                return {
                    source:token,
                    regex:new RegExp(this.escapeRegExp(ruleValue),"g")
                };
            }
            if(ruleType==="WORD"){
                return {
                    source:token,
                    regex:new RegExp(`\\b${this.escapeRegExp(ruleValue)}\\b`,"g")
                };
            }
            if(ruleType==="REGEX"){
                const {pattern,flags}=this.extractRegexPatternAndFlags(ruleValue);
                return {
                    source:token,
                    regex:new RegExp(pattern,flags.includes("g") ? flags : `${flags}g`)
                };
            }
            if(ruleType==="DATE"){
                const datePresets={
                    ANY:`\\b(?:\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4}|\\d{4}[\\/-]\\d{1,2}[\\/-]\\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)\\s+\\d{1,2},?\\s+\\d{2,4})\\b`,
                    DDMMYYYY:`\\b\\d{2}[\\/-]\\d{2}[\\/-]\\d{4}\\b`,
                    MMDDYYYY:`\\b\\d{2}[\\/-]\\d{2}[\\/-]\\d{4}\\b`,
                    YYYYMMDD:`\\b\\d{4}[\\/-]\\d{2}[\\/-]\\d{2}\\b`
                };
                const preset=datePresets[ruleValue.toUpperCase()];
                if(!preset){
                    throw new Error(`Unsupported DATE preset "${ruleValue}" in EXCLUDE_CONTENT DSL`);
                }
                return {
                    source:token,
                    regex:new RegExp(preset,"gi")
                };
            }
            throw new Error(`Unsupported EXCLUDE_CONTENT DSL type "${ruleType}"`);
        });

        return rules.map((rule,idx)=>({
            ...rule,
            id:idx+1
        }));
    }
    extractRegexPatternAndFlags(rawRegexValue){
        if(rawRegexValue.startsWith("/") && rawRegexValue.lastIndexOf("/")>0){
            const lastSlashIndex=rawRegexValue.lastIndexOf("/");
            const pattern=rawRegexValue.slice(1,lastSlashIndex);
            const flags=rawRegexValue.slice(lastSlashIndex+1);
            return {pattern,flags};
        }
        return {pattern:rawRegexValue,flags:""};
    }
    applyExclusions(content,exclusionRules){
        let transformedContent=content;
        for(let i=0;i<exclusionRules.length;i++){
            transformedContent=transformedContent.replace(exclusionRules[i].regex,"");
        }
        return transformedContent
            .split("\n")
            .map((line)=>line.replace(/[ \t]+/g," ").trimEnd())
            .join("\n");
    }
    buildHtmlReport(expectedPdfPath,actualPdfPath,diffRows,mismatchCount,exclusionRules=[]){
        const totalLines=diffRows.length; 
        const matchedLines=totalLines-mismatchCount;
        const matchPercentage=totalLines===0 ? 100 : ((matchedLines/totalLines)*100).toFixed(2);
        const generatedAt=new Date().toLocaleString();
        const exclusionRulesMarkup=exclusionRules.length===0
            ? `<span class="pill neutral">No exclusions configured</span>`
            : exclusionRules.map((rule)=>`<span class="pill">${this.escapeHtml(rule.source)}</span>`).join("");
        const rowsMarkup=diffRows.map((row)=>{
            const rowClass=row.isMismatch ? "mismatch-row" : "match-row";
            const expectedClass=row.isMismatch ? "mismatch-cell" : "match-cell";
            const actualClass=row.isMismatch ? "mismatch-cell" : "match-cell";
            return `<tr class="${rowClass}">
                <td class="line-col">${row.lineNumber}</td>
                <td class="${expectedClass}">${row.expectedLine || "&nbsp;"}</td>
                <td class="${actualClass}">${row.actualLine || "&nbsp;"}</td>
            </tr>`;
        }).join("\n");

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PDF Validation Report</title>
    <style>
        :root {
            --bg: #f4f7fb;
            --card: #ffffff;
            --text: #1f2937;
            --muted: #6b7280;
            --border: #e5e7eb;
            --primary: #2563eb;
            --success: #15803d;
            --success-soft: #f0fdf4;
            --danger: #b91c1c;
            --danger-soft: #fef2f2;
            --shadow: 0 8px 24px rgba(2, 6, 23, 0.08);
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 24px;
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            background: linear-gradient(180deg, #f8fbff 0%, var(--bg) 100%);
            color: var(--text);
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 20px 24px;
            box-shadow: var(--shadow);
            margin-bottom: 16px;
        }
        .title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
        }
        h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.2px;
        }
        .status-badge {
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .status-pass {
            color: var(--success);
            background: var(--success-soft);
            border: 1px solid #bbf7d0;
        }
        .status-fail {
            color: var(--danger);
            background: var(--danger-soft);
            border: 1px solid #fecaca;
        }
        .subtext {
            margin-top: 8px;
            color: var(--muted);
            font-size: 13px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin: 16px 0;
        }
        .metric {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 14px 16px;
            box-shadow: var(--shadow);
        }
        .metric-label {
            margin: 0;
            color: var(--muted);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.35px;
        }
        .metric-value {
            margin: 6px 0 0;
            font-size: 22px;
            font-weight: 700;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }
        .meta-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 14px 16px;
            box-shadow: var(--shadow);
        }
        .meta-title {
            margin: 0 0 6px;
            color: var(--muted);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.35px;
        }
        .meta-value {
            margin: 0;
            font-size: 13px;
            white-space: pre-wrap;
            word-break: break-word;
        }
        .pill-wrap {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .pill {
            font-size: 12px;
            padding: 5px 10px;
            border-radius: 999px;
            border: 1px solid #bfdbfe;
            background: #eff6ff;
            color: #1d4ed8;
            font-weight: 600;
        }
        .pill.neutral {
            border-color: #d1d5db;
            background: #f3f4f6;
            color: #4b5563;
        }
        .table-wrap {
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: var(--shadow);
            background: var(--card);
        }
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            table-layout: fixed;
        }
        thead th {
            position: sticky;
            top: 0;
            z-index: 2;
            background: #f8fafc;
            color: #111827;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.35px;
            border-bottom: 1px solid var(--border);
            padding: 12px 14px;
        }
        td {
            border-bottom: 1px solid var(--border);
            border-right: 1px solid var(--border);
            padding: 10px 12px;
            vertical-align: top;
            white-space: pre-wrap;
            word-break: break-word;
            font-size: 13px;
            line-height: 1.45;
        }
        td:last-child, th:last-child { border-right: none; }
        tbody tr:last-child td { border-bottom: none; }
        .line-col {
            width: 8%;
            text-align: center;
            font-weight: 600;
            color: var(--muted);
            background: #fcfdff;
        }
        .match-row:hover td {
            background: #f9fbff;
        }
        .mismatch-row:hover td {
            background: #fff1f1;
        }
        .match-cell {
            background: #ffffff;
            color: var(--text);
        }
        .mismatch-cell {
            background: #fff1f1;
            color: #7f1d1d;
            font-weight: 600;
        }
        .footer {
            margin-top: 14px;
            color: var(--muted);
            font-size: 12px;
            text-align: right;
        }
        @media (max-width: 860px) {
            body { padding: 14px; }
            h1 { font-size: 20px; }
            .metric-value { font-size: 18px; }
            td, thead th { font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title-row">
                <h1>PDF Validation Report</h1>
                <span class="status-badge ${mismatchCount===0 ? "status-pass" : "status-fail"}">
                    ${mismatchCount===0 ? "Passed" : "Failed"}
                </span>
            </div>
            <p class="subtext">Generated on ${this.escapeHtml(generatedAt)}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric">
                <p class="metric-label">Total Lines Compared</p>
                <p class="metric-value">${totalLines}</p>
            </div>
            <div class="metric">
                <p class="metric-label">Matched Lines</p>
                <p class="metric-value">${matchedLines}</p>
            </div>
            <div class="metric">
                <p class="metric-label">Mismatched Lines</p>
                <p class="metric-value" style="color:${mismatchCount===0 ? "var(--success)" : "var(--danger)"};">${mismatchCount}</p>
            </div>
            <div class="metric">
                <p class="metric-label">Match Percentage</p>
                <p class="metric-value">${matchPercentage}%</p>
            </div>
        </div>

        <div class="meta-grid">
            <div class="meta-card">
                <p class="meta-title">Expected PDF</p>
                <p class="meta-value">${this.escapeHtml(expectedPdfPath)}</p>
            </div>
            <div class="meta-card">
                <p class="meta-title">Actual PDF</p>
                <p class="meta-value">${this.escapeHtml(actualPdfPath)}</p>
            </div>
            <div class="meta-card">
                <p class="meta-title">Applied Exclusion Rules (EXCLUDE_CONTENT DSL)</p>
                <div class="pill-wrap">${exclusionRulesMarkup}</div>
            </div>
        </div>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th style="width: 8%;">Line</th>
                        <th style="width: 46%;">Expected Content</th>
                        <th style="width: 46%;">Actual Content</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsMarkup}
                </tbody>
            </table>
        </div>
        <p class="footer">Automation Framework PDF Validator</p>
    </div>
</body>
</html>`;
    }
    escapeRegExp(content){
        return content.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    }
    escapeHtml(content){
        return content
            .replaceAll("&","&amp;")
            .replaceAll("<","&lt;")
            .replaceAll(">","&gt;")
            .replaceAll("\"","&quot;")
            .replaceAll("'","&#39;");
    }
}
