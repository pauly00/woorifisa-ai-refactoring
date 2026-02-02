
# AI를 활용한 레거시 코드 리팩토링

본 리포지토리는 **우리FISA 기술 세미나** 를 위한 데모 프로젝트입니다.
오픈소스 JavaScript 라이브러리 **[accounting.js](https://github.com/openexchangerates/accounting.js)** 를 대상으로, **AI(OpenAI API)를 활용해 로직 손실 없이 안전하게 리팩토링하는 과정**을 다룹니다.

레거시 코드(ES5)를 현대적인 문법(ES6+)으로 개선하면서도, 기존 동작이 완전히 동일함을 **Jasmine과 QUnit 하이브리드 테스트**를 통해 검증합니다.

---

## 프로젝트 개요

### 주제

**AI를 활용한 레거시 JavaScript 코드 리팩토링** (기능 손실 없는 구조 개선)

### 대상 라이브러리

* **원본**: accounting.js (by Open Exchange Rates)
* **특징**: ES5 기반의 레거시 코드, jQuery 의존성 존재
* **목표**: 테스트 커버리지(Baseline)를 유지하며 ES6+ 문법으로 전환

---

## 시작하기 (Getting Started)

### 1. 설치 및 환경 설정

본 프로젝트는 테스트 러너(Karma)와 AI 도구(OpenAI)를 모두 사용합니다.

```bash
# 1. 프로젝트 의존성 설치 (Karma, Jasmine, QUnit, OpenAI 등 포함)
npm install

# 2. 환경 변수 설정
# 루트 디렉토리에 .env 파일을 생성하고 API Key를 입력합니다.
# OPENAI_API_KEY=your_api_key_here

```

### 2. 핵심 명령어

```bash
# AI 대화형 리팩토링 도구 실행
# 터미널에서 AI에게 "변수명을 const/let으로 변경해줘" 등의 명령을 내릴 수 있습니다.
npm run chat

# 테스트 실행 (Karma)
# Jasmine과 QUnit 테스트를 동시에 실행하고 커버리지를 측정합니다.
npm test

```

---

## 테스트 환경 및 커버리지 (Test Environment)

이 프로젝트는 레거시 코드의 안전한 리팩토링을 위해 엄격한 테스트 환경을 구축했습니다.

### 1. 하이브리드 테스트 구성 (Karma Runner)

기존 라이브러리에 혼재된 테스트 프레임워크를 통합하기 위해 Karma를 설정했습니다.

* **Jasmine**: 최신 테스트 스펙 (`tests/jasmine/core/*.js`)
* **QUnit**: 레거시 테스트 스펙 (`tests/qunit/methods.js`)
* **QUnit Shim 적용**: QUnit v2.x 환경에서 v1.x 문법(`module`, `test`)이 작동하도록 호환성 코드가 적용되었습니다.

### 2. 테스트 커버리지 기준점 (Baseline)

리팩토링 전, 기존 레거시 코드의 테스트 커버리지는 다음과 같습니다. 리팩토링 과정에서 이 수치가 하락하지 않도록 관리합니다.

| Metric | Coverage | 비고 |
| --- | --- | --- |
| **Statements** | **64.76%** | 브라우저 환경에서 실행되지 않는 모듈 감지 코드 제외 |
| **Branches** | **49.50%** | **주의:** 분기문의 약 50%가 테스트되지 않음 (Risk Factor) |
| **Functions** | **71.42%** | 주요 핵심 함수 커버 |

> **Note:** 낮은 Branch 커버리지는 수동 리팩토링 시 기능 파손(Regression) 위험이 높음을 시사하며, 이는 AI 기반의 문맥 인식 리팩토링이 필요한 기술적 배경이 됩니다.

---

## 리팩토링 워크플로우

1. **Baseline 측정**: `npm test`를 실행하여 현재 커버리지 상태와 테스트 통과 여부(Total 19 Success)를 확인합니다.
2. **AI 리팩토링**: `npm run chat`을 통해 AI에게 리팩토링을 지시합니다.
* *Example*: "var를 const/let으로 변경하고, 함수 표현식을 화살표 함수로 바꿔줘."


3. **무결성 검증**: 코드가 변경될 때마다 즉시 `npm test`를 재실행합니다.
* 기존 테스트(19개)가 모두 통과하는지 확인
* Statement 커버리지가 64% 수준을 유지하는지 확인



---

## 기술 스택

* **Refactoring**: OpenAI API (GPT-4o), Node.js
* **Test Runner**: Karma (with Chrome Launcher)
* **Test Frameworks**:
* Jasmine (Core)
* QUnit (Legacy Support with Shim)


* **Coverage**: Karma-Coverage (Istanbul)

---

## 라이선스

본 프로젝트는 **MIT License** 하에 배포됩니다.
원본 코드의 저작권은 **[Open Exchange Rates](https://github.com/openexchangerates)** 에 있으며, 원본 라이선스 정책을 준수합니다.

자세한 내용은 `LICENSE` 파일을 참고하시기 바랍니다.
