import { check } from "k6";
import { SharedArray } from "k6/data";
import { Rate } from "k6/metrics";
import http from "k6/http";

export const errorRate = new Rate("errors");

export const TEST_USER = {
  email: "admin@admin.com",
  password: "arcadmin",
};

export function login(baseUrl) {
  const loginUrl = `${baseUrl}/api/signin`;
  const payload = JSON.stringify(TEST_USER);

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const loginResponse = http.post(loginUrl, payload, params);

  const checks = check(loginResponse, {
    "Login successful": (r) => r.status === 200,
    "Has access token": (r) => JSON.parse(r.body).data?.session !== undefined,
  });

  if (!checks) {
    console.error(
      `Login failed: ${loginResponse.status} ${loginResponse.body}`
    );
    return null;
  }

  // Extract the session data from the response
  const responseData = JSON.parse(loginResponse.body).data;

  return {
    "sb-yrdpjeewqjuwhjjpniju-auth-token": responseData.session.access_token,
  };
}

export function checkResponse(response, checkName) {
  const checks = check(response, {
    [`${checkName} status was 200`]: (r) => r.status === 200,
    [`${checkName} response body was valid`]: (r) => r.body.length > 0,
  });
  errorRate.add(!checks);
}
