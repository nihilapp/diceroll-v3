# Product Requirements Document (PRD)

## 1. Project Overview
* **Goal**: [프로젝트의 핵심 목표와 비전]
* **Target User**: [구체적인 사용자 페르소나 및 니즈]
* **Key Value**: [사용자가 얻게 되는 핵심 가치 및 차별점]

## 2. Tech Stack & Environment (Specific Versions)
* **Language**: TypeScript v5.0+
* **Runtime**: Node.js v20+ (LTS)
* **Package Manager**: pnpm
* **Linter/Formatter**: ESLint (Flat Config) + Prettier
* **Main Libraries**:
    *   `uuid` (ID Generation)
    *   `lodash` (Utility)
    *   `luxon` (Date/Time)

## 3. System Architecture & Features
### 3.1. User Flow (Core Scenarios)
* **Flow 1**: [사용자 진입 -> 행동 -> 결과 흐름 기술]
* **Flow 2**: [... 흐름 기술]

### 3.2. Core Features (Detailed)
* **Feature A**:
    - **Logic**: [구체적인 비즈니스 로직]
    - **Validation**: [입력 검증 규칙]
* **Feature B**:
    - **Logic**: ...

## 4. Data Structure (Schema)
*(JSON 포맷 또는 ERD 텍스트로 표현)*
```json
// Example User Model
{
  "id": "uuid",
  "email": "string (unique)",
  "role": "enum('USER', 'ADMIN')",
  "createdAt": "date-time (ISO 8601)",
  "updatedAt": "date-time (ISO 8601)"
}
```

## 5. Non-Functional Requirements & Risks
* **Performance**: [예: API 응답속도 200ms 이내]
* **Security**: [예: Input Validation 철저, 민감 데이터 암호화]
* **Risks**: [잠재적 위험요소 및 대응 방안]
