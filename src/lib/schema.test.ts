import { describe, expect, test } from 'vitest';
import { blogPostingSchema, serializeJsonLd } from './schema';

describe('serializeJsonLd', () => {
    test('escapes < so an attacker-controlled title cannot break out of the <script> tag', () => {
        const schema = blogPostingSchema({
            title: 'Hostile </script><script>alert(1)</script>',
            description: 'irrelevant',
            url: 'https://example.test/post',
            pubDate: new Date('2026-01-01T00:00:00Z'),
            tags: [],
        });

        const output = serializeJsonLd(schema);

        // The literal closing-tag sequence must not survive — it would terminate the
        // surrounding <script type="application/ld+json"> early and make the rest of
        // the title parse as HTML. Escaping < (and / for belt-and-braces) is enough:
        // the > can stay as-is because the HTML parser looks for the contiguous
        // </script> sequence, not the > on its own.
        expect(output).not.toContain('</script>');
        expect(output).toContain('\\u003c\\/script>');

        // After JSON.parse, the original title round-trips unchanged.
        expect(JSON.parse(output).headline).toBe('Hostile </script><script>alert(1)</script>');
    });

    test('escapes / to avoid </script> sequences split across other JSON values', () => {
        const schema = blogPostingSchema({
            title: 'unrelated',
            description: 'irrelevant',
            url: 'https://example.test/post/with/slashes',
            pubDate: new Date('2026-01-01T00:00:00Z'),
            tags: [],
        });

        const output = serializeJsonLd(schema);

        // Every / in the URL is escaped to \/, defending against ingenious payloads
        // that engineer a </script> by spanning two JSON values.
        expect(output).not.toMatch(/[^\\]\//);
        expect(output).toContain('https:\\/\\/example.test\\/post\\/with\\/slashes');
    });
});
