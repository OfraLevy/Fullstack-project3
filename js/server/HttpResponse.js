// js/server/HttpResponse.js
function makeResponse(status, bodyObj) {
  return {
    status: status,
    ok: status >= 200 && status < 300,
    headers: { "Content-Type": "application/json" },
    body: bodyObj || null
  };
}