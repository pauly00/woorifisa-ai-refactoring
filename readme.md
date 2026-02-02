# 🛠️ AI-driven Legacy Code Refactoring

> **AI를 활용한 로직 손실 없는 레거시 코드 리팩토링**

<br>

FISA 프론트엔드 기술 세미나에서 진행한 **AI를 활용한 로직 손실 없는 레거시 코드 리팩토링**를 정리한 저장소입니다.

금융권 등에서 빈번히 마주하는 복잡한 레거시 코드를, **테스트 코드**와 **프롬프트 엔지니어링**을 결합하여 안정적으로 현대화하는 과정을 다룹니다.

<br>

## 📌 개요

**주제:** AI를 활용한 레거시 코드 (로직 손실 없는) 리팩토링 

**대상 라이브러리:** `accounting.js`
https://github.com/openexchangerates/accounting.js

**핵심 목표:**

- 비즈니스 로직 변경 없이 코드 구조 개선
- 기존 테스트 케이스(QUnit) 100% 통과 유지
- 최적의 AI 프롬프트 전략 도출

<br>

## 🧪 리팩토링 과정

### 1. 안전장치 확보: 테스트 코드

리팩토링의 대전제인 "동작 보존"을 검증하기 위해 기존 라이브러리의 **QUnit 테스트 슈트**를 활용했습니다.

AI가 코드를 수정한 후, 테스트를 통과하지 못하면 실패로 간주하고 재수정 프로세스를 거치며 진행하였습니다.

<br>

**문제점: 낮은 신뢰도 (Branch Coverage 77.22%)**
기존 테스트는 Happy Path(정상 케이스) 위주로 작성되어, 재귀 호출, 구형 브라우저 폴리필(Fallback), 예외 처리 등 핵심 분기의 절반 이상이 검증되지 않은 상태였습니다.

**개선 전략**<br>
단순 수치 달성이 아닌, 비즈니스 로직의 완결성을 목표로 커버리지를 확보했습니다.

- **재귀**: 다차원 배열(["$1", "$2"])을 주입하여 내부 재귀 호출 로직 검증

- **폴리필**: 유사 배열 객체(Array-like)를 활용해 최신 환경에서도 구형 브라우저용 반복문 강제 실행

- **방어 로직**: null 및 잘못된 옵션 값을 주입하여 Fail-safe 로직 작동 확인

결과: 환경 설정 코드를 제외한 실질적 비즈니스 로직 Line Coverage 94% 달성 (검증 사각지대 해소)

<br>

### 2. 프롬프트 엔지니어링 실험

단순 요청보다 정교한 프롬프트 기법이 리팩토링 품질에 미치는 영향을 비교 실험했습니다.

| 기법 | 설명 | 결과 |
| :--- | :--- | :--- |
| **CoT (Chain of Thought)** | **단일 프롬프트** 내에서 4단계(분석-계획-구현-검증) 사고 과정을 한 번에 수행하도록 요청 | 논리적 흐름은 갖추었으나, 한 번에 긴 코드를 생성하는 과정에서 세부 로직 누락 발생 |
| **Prompt Chaining** | **관심사 분리** 원칙에 따라 작업을 2단계로 쪼개어 순차적으로 요청 | **가장 안정적인 결과 도출.** 각 단계별로 명확한 목표에만 집중하게 하여 환각 감소 |

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

## 📊 결과 및 인사이트

* **안정성 확보:** Prompt Chaining 방식을 통해 안정적인 리팩토링 후 기존 기능의 100% 정상 동작을 검증했습니다.
  
* **개발자의 역할 변화:** AI가 코드를 작성하더라도, "무엇을(What) 리팩토링할 것인가"를 정의하고 "결과가 맞는지(Verification)" 판단하는 개발자의 역량이 더욱 중요함을 확인했습니다.

<br>

## Team
|<img src="https://github.com/jeeneep.png" width="80" height="80"/>|<img src="https://github.com/HeeYeon-Ko.png" width="80" height="80"/>|<img src="https://github.com/noiskk.png" width="80" height="80"/>|<img src="https://github.com/pauly00.png" width="80" height="80"/>|
|:-:|:-:|:-:|:-:|
|**박지은(팀장)**<br/>[@jeeneep](https://github.com/jeeneep)|**고희연**<br/>[@HeeYeon-Ko](https://github.com/HeeYeon-Ko)|**김시온**<br/>[@noiskk](https://github.com/noiskk)|**류경록**<br/>[@pauly00](https://github.com/pauly00)|

<br>

## 📂 자료 (Resources)

* **Presentation Slides:** https://www.canva.com/design/DAG_O9q7Kz0/qoN2PlApPhPXvzHQyFQjFQ/edit?utm_content=DA[…]m_campaign=designshare&utm_medium=link2&utm_source=sharebutton





