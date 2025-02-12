import { sleep } from "k6";
import http from "k6/http";
import { check } from "k6";

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
      distributionLabel1: { loadZone: "amazon:us:ashburn", percent: 100 },
    },
  },
};

function login() {
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
  if (loginResponse.status !== 200) {
    throw new Error("Login failed");
  }

  // Extract the access token from the nested response structure
  return loginResponse.json().data.session.access_token;
}

export default function () {
  const token = login();
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
