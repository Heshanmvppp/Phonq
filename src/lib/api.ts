import { NextResponse } from "next/server";

export function jsonResponse(data: unknown, init?: { status?: number }): NextResponse {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export function ok(data: unknown): NextResponse {
  return jsonResponse(data, { status: 200 });
}

export function created(data: unknown): NextResponse {
  return jsonResponse(data, { status: 201 });
}

export function badRequest(message = "Bad request"): NextResponse {
  return jsonResponse({ error: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized"): NextResponse {
  return jsonResponse({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden"): NextResponse {
  return jsonResponse({ error: message }, { status: 403 });
}

export function notFound(message = "Not found"): NextResponse {
  return jsonResponse({ error: message }, { status: 404 });
}

export function conflict(message = "Conflict"): NextResponse {
  return jsonResponse({ error: message }, { status: 409 });
}

export function tooManyRequests(message = "Too many requests, slow down"): NextResponse {
  return jsonResponse({ error: message }, { status: 429 });
}

export function serverError(message = "Internal server error"): NextResponse {
  return jsonResponse({ error: message }, { status: 500 });
}
