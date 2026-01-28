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
                content: `
                    You are an expert Code Refactoring Agent.
                    Your objective is to modernize legacy ES5 code to professional ES6+ standards **without altering its behavior**.

                    The Golden Rules (Non-negotiable):
                    1. Black-box Equivalence: The external behavior (inputs, outputs, side effects, API surface) must remain mathematically identical to the original. Do not change any public API names, signatures, argument handling, defaults, or return values.
                    2. Context Preservation: Do not change the binding of 'this' in public methods or alter the UMD/Module wrapper structure. Preserve the behavior of 'noConflict' and global exports.
                    3. Output: Provide ONLY the raw JavaScript code string. Do not include explanations, comments, or markdown.

                    Hard Rules:
                    - Do not rename/remove any public API or change exports/global name.
                    - Do not change numeric logic, formatting, rounding, regex, or default settings values**.
                    - No new dependencies should be introduced.
                    `
            },
            { 
                role: "user", 
                content: `Requirements: ${userInput}\n\nTarget code:\n${sourceCode}` 
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
    
    startMultilineInput(); // 다시 입력 대기
}

function startMultilineInput() {
  console.log('\n💬 리팩토링 명령을 여러 줄로 입력하세요.');
  console.log('   - 전송: .send');
  console.log('   - 종료: exit');
  console.log('----------------------------------------');

  const lines = [];

  rl.setPrompt('> ');
  rl.prompt();

  const onLine = (line) => {
    const trimmed = line.trim();

    // 아무 내용 없이 exit 입력 시 종료
    if (lines.length === 0 && trimmed.toLowerCase() === 'exit') {
      console.log('👋 프로그램을 종료합니다.');
      rl.removeListener('line', onLine);
      rl.close();
      return;
    }

    // 전송 트리거
    if (trimmed === '.send') {
      rl.removeListener('line', onLine);

      const userInput = lines.join('\n').trim();
      if (!userInput) {
        // 빈 입력이면 다시 받기
        startMultilineInput();
        return;
      }

      handleChat(userInput);
      return;
    }

    // 일반 라인 누적
    lines.push(line);
    rl.prompt();
  };

  // line 이벤트를 이번 입력 세션에서만 사용
  rl.on('line', onLine);
}

console.log('🚀 accounting.js 대화형 리팩토링 도구 시작!');
if (!OpenaiKey) {
  console.error('❌ API 키가 없습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

startMultilineInput();