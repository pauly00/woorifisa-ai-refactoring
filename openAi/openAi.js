require('dotenv').config();
const fs = require('fs');
const path = require('path');

const OpenaiKey = process.env.OPENAI_API_KEY;

async function callOpenAI(messages, apiKey) {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };
    
    const body = JSON.stringify({
        model: 'gpt-4o', // 전체 코드 리팩토링에는 context window가 큰 4o 모델이 적합합니다.
        messages: messages,
        temperature: 0.1 // 코드 생성의 정확도를 위해 온도를 더 낮췄습니다.
    });

    const res = await fetch(endpoint, { method: 'POST', headers, body });
    if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`OpenAI API 오류 (${res.status}): ${errorBody}`);
    }
    const data = await res.json();
    return (data.choices?.[0]?.message?.content || '').trim();
}

async function runFullRefactorAndOverwrite() {
    if (!OpenaiKey) {
        throw new Error('필수 API 키가 환경변수에 설정되지 않았습니다.');
    }

    // 1. 원본 accounting.js 파일 경로 설정 및 읽기
    const sourcePath = path.join(__dirname, '../accounting.js');
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`파일을 찾을 수 없습니다: ${sourcePath}`);
    }
    const sourceCode = fs.readFileSync(sourcePath, 'utf8');

    // 2. 전체 리팩토링 프롬프트 구성
const refactorPrompt = `
명령: 제공된 'accounting.js'를 Node.js 환경에서 바로 'require'로 쓸 수 있게 리팩토링하라.

조건: 
1. 'export default'를 사용하지 말고 'module.exports = accounting;' 형식을 사용할 것.
2. 'Intl.NumberFormat'을 쓰더라도 사용자가 인자로 넘긴 'thousand'와 'decimal' 구분자가 적용되도록 로직을 짤 것. (매우 중요)
3. 코드 블록 기호(\`\`\`)나 "알겠습니다", "리팩토링 결과입니다" 같은 텍스트를 절대 포함하지 마라.
4. 오직 실행 가능한 순수 자바스크립트 코드만 출력하라.

소스 코드:
${sourceCode}
`.trim();

    const messages = [{ role: "user", content: refactorPrompt }];

    console.log("🚀 라이브러리 전체 리팩토링 요청 중...");
    
    const newCode = await callOpenAI(messages, OpenaiKey);

    // 3. 파일 덮어쓰기 (Overwrite)
    try {
        // 만약의 사태를 대비해 백업 파일을 만들고 싶다면 아래 주석을 해제하세요.
        // fs.writeFileSync(sourcePath + '.bak', sourceCode);
        
        fs.writeFileSync(sourcePath, newCode, 'utf8');
        console.log(`✅ 리팩토링 완료! 파일이 성공적으로 업데이트되었습니다: ${sourcePath}`);
    } catch (writeErr) {
        throw new Error(`파일 쓰기 중 오류 발생: ${writeErr.message}`);
    }
}

(async () => {
    try {
        await runFullRefactorAndOverwrite();
    } catch (err) {
        console.error('\n❌ 오류 발생:', err.message);
        process.exit(1);
    }
})();