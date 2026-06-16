# COPD Care App API Specification

## Base URL

`http://localhost:3002` (Docker/default)

## Authentication

Most endpoints require a JWT Bearer Token in the Authorization header.
**Header:** `Authorization: Bearer <your_jwt_token>`

---

## 0. Operations

### 0.1 Process Health

- **Endpoint:** `GET /health`
- **Auth Required:** No
- **Description:** Confirms that the API process is running.

### 0.2 Deployment Version

- **Endpoint:** `GET /version`
- **Auth Required:** No
- **Description:** Returns the deployed app version and git SHA when provided by Docker build args.

---

## 1. Authentication (Auth)

### 1.1 User Registration

- **Endpoint:** `POST /auth/register`
- **Description:** Creates a new user account.
- **Request Body:**
  ```json
  {
    "phoneNumber": "01012345678", // Must be 11 digits starting with 010
    "password": "password123", // Min 8 chars, must include letters and numbers
    "name": "홍길동",
    "birthDate": "1990-01-01", // YYYY-MM-DD
    "gender": "male", // "male" | "female" | "other"
    "role": "patient" // "patient" | "doctor"
  }
  ```
- **Success Response (201):** Returns the created user object (excluding password).

### 1.2 User Login

- **Endpoint:** `POST /auth/login`
- **Description:** Authenticates user and returns a JWT token.
- **Request Body:**
  ```json
  {
    "phoneNumber": "01012345678",
    "password": "password123"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "access_token": "eyJhbG...",
    "user": {
      "id": "uuid",
      "phoneNumber": "01012345678",
      "name": "홍길동",
      "role": "patient"
    }
  }
  ```

### 1.3 Get My Profile

- **Endpoint:** `GET /auth/profile`
- **Auth Required:** Yes
- **Success Response (200):** Current user object.

---

## 2. Breathing Data (호흡 측정)

### 2.1 Save Measurement

- **Endpoint:** `POST /breathing`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "fev1": 3.5, // Forced Expiratory Volume (L)
    "fvc": 4.2, // Forced Vital Capacity (L)
    "pef": 450.0, // Peak Flow (Optional)
    "fev1PercentPredicted": 62, // FEV1 % predicted from device (Optional)
    "deviceSource": "spiro_q", // Measurement device identifier (Optional)
    "rawSpiro240": "base64...", // Raw SPIRO Q packet for audit/debug (Optional)
    "oxygenSaturation": 98, // SpO2 % (Optional)
    "heartRate": 72, // bpm (Optional)
    "note": "After exercise" // (Optional)
  }
  ```
- **Success Response (201):** Created measurement with calculated `overallScore`.
  Response also includes derived `fev1FvcRatio`, `goldAirflowGrade`, and `source` when available.

### 2.2 Get All Measurements

- **Endpoint:** `GET /breathing`
- **Auth Required:** Yes
- **Description:** Returns all measurements for the user, sorted by date (newest first).

### 2.3 Get Single Measurement

- **Endpoint:** `GET /breathing/:id`
- **Auth Required:** Yes

---

## 3. Assessments (평가 정보)

### 3.1 Save Generic Assessment

- **Endpoint:** `POST /assessments`
- **Auth Required:** Yes
- **Description:** Saves Dyspnea, Depression, Anxiety, or QoL assessment.
- **Request Body:**
  ```json
  {
    "type": "dyspnea", // "dyspnea" | "depression" | "anxiety" | "qol"
    "responses": {
      // Any JSON object containing question/answer pairs
      "q1": 2,
      "q2": 1
    },
    "score": 3 // Calculated total score from frontend
  }
  ```

### 3.2 List Generic Assessments

- **Endpoint:** `GET /assessments`
- **Auth Required:** Yes
- **Query Params:** `type` (Optional: "dyspnea", "depression", etc.)
- **Example:** `GET /assessments?type=dyspnea`

### 3.3 Save 6-Minute Step Ability Record (6분 걸음 능력 측정)

- **Endpoint:** `POST /assessments/six-minute-steps`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "steps": 412,
    "durationSeconds": 360,
    "estimatedDistanceMeters": 268.0,
    "startedAt": "2026-04-20T10:00:00.000Z",
    "endedAt": "2026-04-20T10:06:00.000Z",
    "interpretationLevel": "양호"
  }
  ```
- **Notes:** `estimatedDistanceMeters` and `interpretationLevel` are optional. Dates must be ISO-8601 strings.

### 3.4 List 6-Minute Step Ability Records

- **Endpoint:** `GET /assessments/six-minute-steps`
- **Auth Required:** Yes
- **Response:** Array of saved records (newest `endedAt` first), each including `id`, `userId`, fields above, and `createdAt`.

---

## 4. Clinical Profile / GOLD Summary

### 4.1 Get Clinical Profile

- **Endpoint:** `GET /clinical-profile`
- **Auth Required:** Yes
- **Description:** Returns editable clinical profile inputs used for GOLD and adaptive risk summary.

### 4.2 Update Clinical Profile

- **Endpoint:** `PATCH /clinical-profile`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "fev1PercentPredicted": 62,
    "mmrcScore": 2,
    "caatScore": 14,
    "exacerbationsLast12Months": 1,
    "smokingStatus": "former",
    "smokingCessation": {
      "lastDailyCheckDate": "2026-06-01",
      "smokedToday": false,
      "quitIntentionWithinMonth": true,
      "smokesWithin30MinutesOfWaking": false,
      "dailyCigarettes": 8,
      "smokeFreeSince": "2026-06-01"
    },
    "vaccinationHistory": {
      "influenza": true,
      "pneumococcal": false,
      "rsv": false,
      "zoster": true,
      "covid19": true,
      "tdap": false
    }
  }
  ```
- **Notes:** `goldAirflowGrade` is derived from `fev1PercentPredicted`; `reviewStatus` is read-only for patient-facing clients. Clinical text remains review-pending unless explicitly reviewed.

### 4.3 Get Clinical Summary

- **Endpoint:** `GET /clinical-summary`
- **Auth Required:** Yes
- **Description:** Returns GOLD 1-4, A/B/E group, LOW/MED/HIGH adaptive risk, disease activity, evidence dates, missing inputs, and PDF-aligned content plans for exercise/education, smoking cessation, vaccination, and badges.
- **Response Example:**
  ```json
  {
    "goldAirflowGrade": "GOLD 2",
    "goldAbeGroup": "B",
    "adaptiveRiskLevel": "MED",
    "diseaseActivity": "monitoring_needed",
    "dailyRisk": "yellow",
    "missingInputs": {
      "fev1PercentPredicted": false,
      "exacerbationsLast12Months": false,
      "symptomScore": false
    },
    "managementPlan": {
      "level": "MED",
      "exerciseIntensity": "유산소 10-15분, 의자 운동 중심",
      "frequency": "주 3-4회, 하루 2회 증상 체크",
      "monitoring": "호흡곤란, 기침, 가래, 활동량 변화를 추적",
      "systemActions": [
        "운동 강도 자동 조절",
        "증상 악화 알림",
        "지속 시 HIGH 전환 검토"
      ],
      "educationContentIds": ["5", "6", "3"]
    },
    "smokingCessationPlan": {
      "status": "former",
      "fiveAStage": "maintenance",
      "message": "금연 유지 상태입니다. 재흡연 위험을 정기 확인하고 성공 배지를 추적합니다.",
      "assessmentQuestions": ["최근 7일 동안 흡연한 날이 있었나요?"],
      "arrangeAfterDays": 30,
      "dailyCheckRequired": false,
      "actionStrategies": [
        "흡연 유혹이 강했던 상황을 기록하고 회피 전략을 유지하세요."
      ],
      "nextCheckDate": "2026-07-01",
      "smokeFreeDays": 31
    },
    "vaccinationRecommendations": [
      {
        "key": "pneumococcal",
        "label": "폐렴구균",
        "priority": "due",
        "reason": "COPD 환자는 폐렴구균 접종 이력 확인이 필요합니다.",
        "reminderDate": null
      }
    ],
    "badgePlan": {
      "earned": ["gold_stability_3mo"],
      "trackable": [
        "smoke_free_24h",
        "smoke_free_3d",
        "smoke_free_7d",
        "gold_stability_3mo",
        "walk_improvement_6mo"
      ],
      "criteria": {
        "gold_stability_3mo": "3개월 동안 중등도/중증 악화 0회"
      }
    },
    "safetyNotice": "기록 기반 참고 정보입니다..."
  }
  ```
