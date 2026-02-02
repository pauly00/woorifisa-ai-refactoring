# 🛠️ AI-driven Legacy Code Refactoring

> **AI를 활용한 로직 손실 없는 레거시 코드 리팩토링**

<br>

FISA 프론트엔드 기술 세미나에서 진행한 **AI를 활용한 로직 손실 없는 레거시 코드 리팩토링**를 정리한 저장소입니다.

금융권 등에서 빈번히 마주하는 복잡한 레거시 코드를, **테스트 코드**와 **프롬프트 엔지니어링**을 결합하여 안정적으로 현대화하는 과정을 다룹니다.

<br>

## 📌 Overview (개요)

**주제:** AI를 활용한 레거시 코드 (로직 손실 없는) 리팩토링 

### Team
|<img src="https://github.com/jeeneep.png" width="150" height="150"/>|<img src="https://github.com/HeeYeon-Ko.png" width="150" height="150"/>|<img src="https://github.com/noiskk.png" width="150" height="150"/>|<img src="https://github.com/pauly00.png" width="150" height="150"/>|
|:-:|:-:|:-:|:-:|
|**박지은(팀장)**<br/>[@jeeneep](https://github.com/jeeneep)|**고희연**<br/>[@HeeYeon-Ko](https://github.com/HeeYeon-Ko)|**김시온**<br/>[@noiskk](https://github.com/noiskk)|**류경록**<br/>[@pauly00](https://github.com/pauly00)|

**대상 라이브러리:** `accounting.js` (JavaScript)
https://github.com/openexchangerates/accounting.js

**핵심 목표:**

- 비즈니스 로직 변경 없이 코드 구조 개선
- 기존 테스트 케이스(QUnit) 100% 통과 유지
- 최적의 AI 프롬프트 전략 도출

<br>

## 🧪 방법론

### 1. 안전장치 확보: 테스트 코드

리팩토링의 대전제인 "동작 보존"을 검증하기 위해 기존 라이브러리의 **QUnit 테스트 슈트**를 활용했습니다.

AI가 코드를 수정한 후, 테스트를 통과하지 못하면 실패로 간주하고 재수정 프로세스를 거치며 진행하였습니다.

<br>

🔍 기존 문제점 분석

기존 methods.js 테스트는 Happy Path(정상적인 입력과 기대되는 출력) 위주로 작성되어 있어, 리팩토링 시 잠재적 결함을 잡아내기에 부족했습니다. 

* 낮은 커버리지: 핵심 로직의 **Branch Coverage가 약 49.5%**에 불과해 분기 절반이 검증되지 않음. 

* 재귀 로직 미검증: 배열 데이터 처리 시 작동하는 내부 재귀 호출(unformat, formatMoney 배열 입력) 분기가 실행되지 않음. 

* 환경 의존적 코드 방치: 최신 브라우저(Chrome Headless) 환경에서는 구형 브라우저용 폴리필(Fallback) 코드가 실행되지 않는 기술적 제약 존재. 

* 방어 로직 미비: 잘못된 옵션이나 null 값 입력 시의 예외 처리 로직(Fail-safe) 검증 부재. 

<br>

📈 커버리지 개선 기법 (Implementation)

단순한 수치 달성이 아닌, 실제 비즈니스 로직의 완결성을 목표로 다음과 같은 테크닉을 적용했습니다.

| 검증 영역 | 해결 전략 및 기법 (Technique) | 개선 효과 |
| :--- | :--- | :--- |
| **재귀 동작**<br>(Recursion) | **다차원 배열 주입**<br>`unformat(["$1", "$2"])`와 같이 배열을 인자로 넘겨 내부 재귀 호출을 강제 실행 | 대량 데이터 처리 로직의 **확장성 및 안정성** 검증 |
| **내부 폴리필**<br>(Fallback Loop) | **유사 배열 객체(Array-like) 활용**<br>네이티브 `.map`을 제거한 객체를 주입하여, 최신 환경에서도 구형 브라우저용 `for` 루프가 돌도록 유도 | 환경 제약을 뛰어넘는 **기술적 검증** 달성 |
| **방어 로직**<br>(Edge Cases) | **에러 유발(Error Injection)**<br>잘못된 포맷 옵션, `null` 데이터 등을 의도적으로 주입하여 기본값(Default) 복구 로직 확인 | 예상치 못한 장애 상황에 대한 **Fail-safe** 확보 |


Result: 환경 탐지 코드(Node.js/AMD)를 제외한 실질적 비즈니스 로직 100% 검증(Line Coverage ~94%) 달성

<br>


### 2. 프롬프트 엔지니어링 실험

단순 요청보다 정교한 프롬프트 기법이 리팩토링 품질에 미치는 영향을 비교 실험했습니다.

| 기법 | 설명 | 결과 |
| --- | --- | --- |
| **CoT (Chain of Thought)** | AI에게 생각의 과정을 단계별로 서술하게 한 뒤 코드 수정 | 논리적 흐름은 좋으나, 코드 구현 단계에서 종종 로직 누락 발생 |
| **Prompt Chaining** | 역할 부여 -> 분석 -> 계획 -> 구현 -> 검증 단계를 끊어서 대화형으로 진행 | **가장 안정적인 결과 도출.** 단계별 피드백이 가능하여 환각(Hallucination) 감소 |

<br>

### 3. 최종 프롬프트

```HCL

## 시스템 메시지
You are an expert Code Refactoring Agent.
Your objective is to modernize legacy ES5 code to professional ES6+ standards **without altering its behavior**.

The Golden Rules (Non-negotiable):
1. Black-box Equivalence: The external behavior (inputs, outputs, side effects, API surface) must remain mathematically identical to the original. Do not change any public API names, signatures, argument handling, defaults, or return values.
2. Context Preservation: Do not change the binding of 'this' in public methods or alter the UMD/Module wrapper structure. Preserve the behavior of 'noConflic' and global exports.
3. Output: Provide ONLY the raw JavaScript code string. Do not include explanations, comments, or markdown.

Hard Rules:
- Do not rename/remove any public API or change exports/global name.
- Do not change numeric logic, formatting, rounding, regex, or default settings values.
- No new dependencies should be introduced.



## 코드의 동작은 그대로 둔 채, 선언 방식만 현대화
Step 1: Apply modern variable declaration standards to the legacy code

Style Guidelines:
1. Enforce "One Variable Per Line":
- Declare each variable on its own line to improve readability and make git diffs clearer.
2. Block-Scoping:
- Replace `var` with `const` by default. Use `let` only if the variable is visibly reassigned later.
3. Scope Safety:
- Ensure these changes do not violate the original variable hoisting rules or closure behaviors.
- Avoid using let or const in ways that change how the code originally works with variable hoisting.



## 의미와 표현력 개선 (최신 메서드 사용)
Step 2: Modernize implementation patterns to improve semantics and readability

Refactoring Principles:
1. Enforce Type Semantics:
   - Look for places where one data type is instantiated solely to manipulate another.
   - Replace these patterns with direct Native Prototype Methods of the target type .
2. Declarative Signatures:
   - Move defensive logic (like checking for undefined arguments) out of the function body and into the function signature using default parameters.
   - This improves readability and clarity of the function's intent.
3. Arrow Functions:
   - limited arrows for direct inline callbacks ONLY when the callback does NOT use this, arguments, or any provided context binding

```

<br>

## 📊 결과 및 인사이트 (Results & Insights)

* **안정성 확보:** Iterative Prompting 방식을 통해 기존 기능의 100% 정상 동작을 검증했습니다.
  
* **개발자의 역할 변화:** AI가 코드를 작성하더라도, **"무엇을(What) 리팩토링할 것인가"**를 정의하고 **"결과가 맞는지(Verification)"** 판단하는 개발자의 역량이 더욱 중요함을 확인했습니다.
  
* **한계:** 매우 긴 의존성을 가진 스파게티 코드의 경우, AI의 컨텍스트 윈도우 한계로 인해 부분적 리팩토링만 가능한 경우가 있었습니다.

<br>

## 📂 자료 (Resources)

* **Presentation Slides:** https://www.canva.com/design/DAG_O9q7Kz0/qoN2PlApPhPXvzHQyFQjFQ/edit?utm_content=DA[…]m_campaign=designshare&utm_medium=link2&utm_source=sharebutton





