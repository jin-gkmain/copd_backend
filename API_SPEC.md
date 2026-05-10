# COPD Care App API Specification

## Base URL
`http://localhost:3000` (Default)

## Authentication
Most endpoints require a JWT Bearer Token in the Authorization header.
**Header:** `Authorization: Bearer <your_jwt_token>`

---

## 1. Authentication (Auth)

### 1.1 User Registration
*   **Endpoint:** `POST /auth/register`
*   **Description:** Creates a new user account.
*   **Request Body:**
    ```json
    {
      "phoneNumber": "01012345678", // Must be 11 digits starting with 010
      "password": "password123",    // Min 8 chars, must include letters and numbers
      "name": "홍길동",
      "birthDate": "1990-01-01",    // YYYY-MM-DD
      "gender": "male",             // "male" | "female" | "other"
      "role": "patient"             // "patient" | "doctor"
    }
    ```
*   **Success Response (201):** Returns the created user object (excluding password).

### 1.2 User Login
*   **Endpoint:** `POST /auth/login`
*   **Description:** Authenticates user and returns a JWT token.
*   **Request Body:**
    ```json
    {
      "phoneNumber": "01012345678",
      "password": "password123"
    }
    ```
*   **Success Response (200):**
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
*   **Endpoint:** `GET /auth/profile`
*   **Auth Required:** Yes
*   **Success Response (200):** Current user object.

---

## 2. Breathing Data (호흡 측정)

### 2.1 Save Measurement
*   **Endpoint:** `POST /breathing`
*   **Auth Required:** Yes
*   **Request Body:**
    ```json
    {
      "fev1": 3.5,                // Forced Expiratory Volume (L)
      "fvc": 4.2,                 // Forced Vital Capacity (L)
      "pef": 450.0,               // Peak Flow (Optional)
      "oxygenSaturation": 98,     // SpO2 % (Optional)
      "heartRate": 72,            // bpm (Optional)
      "note": "After exercise"    // (Optional)
    }
    ```
*   **Success Response (201):** Created measurement with calculated `overallScore`.

### 2.2 Get All Measurements
*   **Endpoint:** `GET /breathing`
*   **Auth Required:** Yes
*   **Description:** Returns all measurements for the user, sorted by date (newest first).

### 2.3 Get Single Measurement
*   **Endpoint:** `GET /breathing/:id`
*   **Auth Required:** Yes

---

## 3. Assessments (평가 정보)

### 3.1 Save Generic Assessment
*   **Endpoint:** `POST /assessments`
*   **Auth Required:** Yes
*   **Description:** Saves Dyspnea, Depression, Anxiety, or QoL assessment.
*   **Request Body:**
    ```json
    {
      "type": "dyspnea", // "dyspnea" | "depression" | "anxiety" | "qol"
      "responses": {     // Any JSON object containing question/answer pairs
        "q1": 2,
        "q2": 1
      },
      "score": 3         // Calculated total score from frontend
    }
    ```

### 3.2 List Generic Assessments
*   **Endpoint:** `GET /assessments`
*   **Auth Required:** Yes
*   **Query Params:** `type` (Optional: "dyspnea", "depression", etc.)
*   **Example:** `GET /assessments?type=dyspnea`

### 3.3 Save 6-Minute Step Ability Record (6분 걸음 능력 측정)
*   **Endpoint:** `POST /assessments/six-minute-steps`
*   **Auth Required:** Yes
*   **Request Body:**
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
*   **Notes:** `estimatedDistanceMeters` and `interpretationLevel` are optional. Dates must be ISO-8601 strings.

### 3.4 List 6-Minute Step Ability Records
*   **Endpoint:** `GET /assessments/six-minute-steps`
*   **Auth Required:** Yes
*   **Response:** Array of saved records (newest `endedAt` first), each including `id`, `userId`, fields above, and `createdAt`.
