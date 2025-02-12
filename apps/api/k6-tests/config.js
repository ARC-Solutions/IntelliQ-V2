export const CONFIG = {
  BASE_URL: "http://localhost:8787/api/v1", // Adjust this to match your API URL
  STAGES: {
    smoke: [
      { duration: "30s", target: 1 },
      { duration: "30s", target: 0 },
    ],
    load: [
      { duration: "30s", target: 5 },
      { duration: "1m", target: 10 },
      { duration: "30s", target: 0 },
    ],
    stress: [
      { duration: "2m", target: 20 },
      { duration: "5m", target: 50 },
      { duration: "5m", target: 100 },
      { duration: "2m", target: 0 },
    ],
  },
  THRESHOLDS: {
    http_req_failed: ["rate<0.01"], // http errors should be less than 1%
    http_req_duration: ["p(95)<2000"], // 95% of requests should be below 2s
  },
};
