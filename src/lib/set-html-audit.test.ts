import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SRC_ROOT = join(PROJECT_ROOT, 'src');

// Every place we deliberately emit raw HTML, and why it is safe.
// To add a new entry: confirm the value passed to set:html is escaped/sanitised
// at its source (and ideally has its own regression test there).
const ALLOWLIST: ReadonlyArray<{ file: string; match: string; reason: string }> = [
    {
        file: 'src/layouts/Post.astro',
        match: 'set:html={schemaJson}',
        reason: 'JSON-LD via serializeJsonLd — escapes < and / before injection (see schema.test.ts)',
    },
    {
        file: 'src/pages/about.astro',
        match: 'set:html={schemaJson}',
        reason: 'JSON-LD via serializeJsonLd — escapes < and / before injection (see schema.test.ts)',
    },
    {
        file: 'src/pages/index.astro',
        match: 'set:html={schemaJson}',
        reason: 'JSON-LD via serializeJsonLd — escapes < and / before injection (see schema.test.ts)',
    },
    {
        file: 'src/components/Dougal.astro',
        match: 'set:html={sized}',
        reason: 'In-repo dougal.svg imported via ?raw, regex-modified with author-controlled build-time props (size, className) — no runtime user input',
    },
];

function walkAstroFiles(root: string): string[] {
    const results: string[] = [];
    function walk(dir: string) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.name.endsWith('.astro')) {
                results.push(relative(root, fullPath));
            }
        }
    }
    walk(root);
    return results;
}

describe('set:html callsite audit', () => {
    test('every set:html occurrence in src/**/*.astro is on the allowlist', () => {
        const findings: { file: string; match: string }[] = [];

        for (const relativePath of walkAstroFiles(SRC_ROOT)) {
            const fullPath = join(SRC_ROOT, relativePath);
            const content = readFileSync(fullPath, 'utf-8');
            const matches = content.matchAll(/\bset:html=\{[^}]+\}/g);
            const filePath = `src/${relativePath.replace(/\\/g, '/')}`;

            for (const m of matches) {
                const isAllowed = ALLOWLIST.some(
                    (entry) => entry.file === filePath && entry.match === m[0],
                );
                if (!isAllowed) {
                    findings.push({ file: filePath, match: m[0] });
                }
            }
        }

        expect(findings).toEqual([]);
    });
});
