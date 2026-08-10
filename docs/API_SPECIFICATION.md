# Arogya Sahayak — REST & Cloud Functions API Specification

## 1. Symptom Triage Endpoint
- **URL**: `POST /api/triageSymptom`
- **Body**:
  ```json
  {
    "message": "Severe abdominal pain and vomiting blood",
    "userProfile": { "state": "Maharashtra", "district": "Pune Rural" },
    "sessionId": "session_123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "sessionId": "session_123",
    "userIdHash": "19ec93bc4a8b66c5...",
    "result": {
      "symptoms": ["severe abdominal pain", "vomiting blood"],
      "severity": "CRITICAL",
      "triage_advice": "Go to the nearest hospital or PHC immediately or call 108.",
      "escalate_immediately": true,
      "escalation_reason": "Vomiting blood indicates potential gastrointestinal hemorrhage."
    }
  }
  ```

## 2. ASHA Alerts Queue Endpoint
- **URL**: `GET /api/ashaAlerts`
- **Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "alerts": [
      {
        "id": "alert_1786339592044",
        "severity": "CRITICAL",
        "symptomTags": ["severe abdominal pain", "vomiting blood"],
        "status": "pending",
        "timestamp": "2026-08-10T05:26:32.044Z"
      }
    ]
  }
  ```

## 3. Scheme Matcher Endpoint
- **URL**: `POST /api/matchSchemes`
- **Body**:
  ```json
  {
    "incomeCategory": "BPL",
    "isPregnant": true,
    "hasSeniorCitizen": false
  }
  ```

## 4. Village Advisory Generator Endpoint
- **URL**: `POST /api/generateAdvisory`
- **Body**:
  ```json
  {
    "district": "Pune Rural (Khed Sector)",
    "language": "mr"
  }
  ```
