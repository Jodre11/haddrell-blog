import type { APIRoute } from 'astro';
import { getAllPosts, isBuild } from '../lib/posts';
import { SITE_URL, SITE_TITLE } from '../consts';

export const GET: APIRoute = async () => {
    const posts = await getAllPosts();
    const parts: string[] = [];
    parts.push(`# ${SITE_TITLE} — full archive`);
    parts.push('');
    for (const p of posts) {
        const path = isBuild(p) ? `/builds/${p.id}/` : `/essays/${p.id}/`;
        parts.push(`---`);
        parts.push(`title: ${JSON.stringify(p.data.title)}`);
        parts.push(`url: ${SITE_URL}${path}`);
        parts.push(`pubDate: ${p.data.pubDate.toISOString()}`);
        parts.push(`tags: ${JSON.stringify(p.data.tags)}`);
        parts.push(`---`);
        parts.push('');
        parts.push(p.body ?? '');
        parts.push('');
    }
    return new Response(parts.join('\n'), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
};
