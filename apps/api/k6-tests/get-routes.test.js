import http from "k6/http";
import { sleep } from "k6";
import { check } from "k6";
import { group } from "k6";

// Replace config import with direct constant
// const BASE_URL = "https://app.intelliq.dev/api/v1";
const BASE_URL = "http://localhost:8787/api/v1";

export const options = {
  stages: [
    { duration: "1m", target: 20 },
    { duration: "3m", target: 20 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"], // http errors should be less than 2%
    http_req_duration: ["p(95)<200"], // 95% requests should be below 200ms
  },
  cloud: {
    distribution: {
      "amazon:us:ashburn": { loadZone: "amazon:us:ashburn", percent: 100 },
      projectID: 3746937,
      name: "IntelliQ API Tests US Ashburn",
    },
  },
};

// Store the token globally but initialize it as null
let token = null;

export default function () {
  // Only login if we don't have a token
  if (!token) {
    const loginUrl = "https://app.intelliq.dev/api/signin";
    const payload = JSON.stringify({
      email: "admin@admin.com",
      password: "arcadmin",
    });

    const params = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const loginResponse = http.post(loginUrl, payload, params);
    check(loginResponse, {
      "login successful": (r) => r.status === 200,
    });

    if (loginResponse.status !== 200) {
      throw new Error("Login failed");
    }

    token = loginResponse.json().data.session.access_token;
  }

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // Test Quiz History endpoint
  let response = http.get("https://app.intelliq.dev/api/v1/history", params);
  check(response, {
    "history status is 200": (r) => r.status === 200,
    "history response time OK": (r) => r.timings.duration < 2000,
  });
  sleep(1);

  // Test Singleplayer Quiz Questions endpoint
  const quizId = "1eb7a7d3-a798-456d-b033-f6a3591a155b";
  response = http.get(
    `https://app.intelliq.dev/api/v1/quiz-submissions/singleplayer/${quizId}/questions?filter=all`,
    params
  );
  check(response, {
    "questions status is 200": (r) => r.status === 200,
    "questions response time OK": (r) => r.timings.duration < 2000,
  });
  sleep(1);

  // Test Multiplayer Quiz Leaderboard endpoint
  const roomId = "c758d04c-1c33-45a6-bf0d-7e6040e27749";
  response = http.get(
    `https://app.intelliq.dev/api/v1/quiz-submissions/multiplayer/${roomId}/leaderboard`,
    params
  );
  check(response, {
    "leaderboard status is 200": (r) => r.status === 200,
    "leaderboard response time OK": (r) => r.timings.duration < 2000,
  });
  sleep(1);
}