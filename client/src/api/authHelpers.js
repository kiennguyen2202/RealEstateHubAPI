// src/api/authHelpers.js
export function getToken() {
  return localStorage.getItem("token") || "";
}
