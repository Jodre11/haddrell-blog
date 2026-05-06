import { beforeAll, describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HEADERS_PATH = fileURLToPath(new URL('../../public/_headers', import.meta.url));
const ROUTE_INDENT = /^\s+\S/;

// Parse a Cloudflare _headers file and return the headers applied to a given route.
// Routes are unindented lines; headers are indented lines until the next blank line
// or the next unindented line. Returned keys are lowercased. If the same header name
// appears more than once within a route block, the last value wins (today's _headers
// file has no duplicates; revisit the parser if that ever changes).
function headersForRoute(content: string, route: string): Map<string, string> {
    const headers = new Map<string, string>();
    const lines = content.split(/\r?\n/);
    let inRoute = false;

    for (const line of lines) {
        const trimmed = line.trim();
        const isIndented = ROUTE_INDENT.test(line);
        const isBlank = trimmed.length === 0;

        if (!isIndented && !isBlank) {
            inRoute = trimmed === route;
            continue;
        }
        if (!inRoute) continue;
        if (isBlank) {
            inRoute = false; // blank line terminates the current route block
            continue;
        }

        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) continue;
        const name = trimmed.slice(0, colonIndex).trim().toLowerCase();
        const value = trimmed.slice(colonIndex + 1).trim();
        headers.set(name, value);
    }

    return headers;
}

describe('public/_headers — security invariants for /*', () => {
    let headers: Map<string, string>;

    beforeAll(() => {
        const content = readFileSync(HEADERS_PATH, 'utf-8');
        headers = headersForRoute(content, '/*');
    });

    test('Content-Security-Policy is set', () => {
        expect(headers.get('content-security-policy')).toBeTruthy();
    });

    test('X-Frame-Options is DENY or SAMEORIGIN', () => {
        const value = headers.get('x-frame-options');
        expect(value).toBeTruthy();
        expect(value!.toUpperCase()).toMatch(/^(DENY|SAMEORIGIN)$/);
    });

    test('X-Content-Type-Options is nosniff', () => {
        expect(headers.get('x-content-type-options')?.toLowerCase()).toBe('nosniff');
    });

    test('Referrer-Policy is set and not unsafe-url', () => {
        const value = headers.get('referrer-policy');
        expect(value).toBeTruthy();
        expect(value!.toLowerCase()).not.toBe('unsafe-url');
    });

    test('Permissions-Policy is non-empty', () => {
        expect(headers.get('permissions-policy')).toBeTruthy();
    });
});
