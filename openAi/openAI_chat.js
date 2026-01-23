require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline'); // 터미널 입력을 위한 모듈

const OpenaiKey = process.env.OPENAI_API_KEY;

// 터미널 입력 인터페이스 설정
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function callOpenAI(messages, apiKey) {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };
    
    const body = JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.1
    });

    const res = await fetch(endpoint, { method: 'POST', headers, body });
    const data = await res.json();
    return (data.choices?.[0]?.message?.content || '').trim();
}

const sourcePath = path.join(__dirname, '../accounting.js');

async function handleChat(userInput) {
    try {
        const sourceCode = fs.readFileSync(sourcePath, 'utf8');
        
        const messages = [
            { 
                role: "system", 
                content: `너는 자바스크립트 리팩토링 전문가다. 
                최우선 목표: 외부 공개 API/동작/출력/UMD 로딩(CommonJS/AMD/전역 window.accounting) 100% 동일 유지. 
                금지: 공개 API 제거/이름 변경, UMD export/noConflict 로직 변경, 출력 문자열 변경.
                출력: 설명 없이 순수 JS 코드만."`
                
            },
            { 
                role: "user", 
                content: `요구사항: ${userInput}\n\n대상 코드:\n${sourceCode}` 
            }
        ];

        console.log("🤖 AI가 고민 중입니다...");
        const newCode = await callOpenAI(messages, OpenaiKey);

        // 마크다운 코드 블록(```js)이 포함될 경우를 대비해 정제
        const cleanCode = newCode.replace(/```javascript|```js|```/g, "").trim();

        fs.writeFileSync(sourcePath, cleanCode, 'utf8');
        console.log(`✅ 반영 완료! (파일: ${sourcePath})`);
        
    } catch (err) {
        console.error('❌ 오류 발생:', err.message);
    }
    
    askQuestion(); // 다시 입력 대기
}

function askQuestion() {
    rl.question('\n💬 리팩토링 명령을 입력하세요 (종료: exit): ', (input) => {
        if (input.toLowerCase() === 'exit') {
            console.log('👋 프로그램을 종료합니다.');
            rl.close();
            return;
        }
        handleChat(input);
    });
}

console.log('🚀 accounting.js 대화형 리팩토링 도구 시작!');
if (!OpenaiKey) {
    console.error('❌ API 키가 없습니다. .env 파일을 확인하세요.');
    process.exit(1);
}
askQuestion();