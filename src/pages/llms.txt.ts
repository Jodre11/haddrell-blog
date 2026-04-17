import type { APIRoute } from 'astro';
import { getAllPosts, isBuild } from '../lib/posts';
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export const GET: APIRoute = async () => {
    const posts = await getAllPosts();
    const lines: string[] = [];
    lines.push(`# ${SITE_TITLE}`);
    lines.push('');
    lines.push(`> ${SITE_DESCRIPTION}`);
    lines.push('');
    lines.push('This site publishes essays on product engineering and write-ups of personal builds.');
    lines.push('No client work appears here.');
    lines.push('');
    lines.push('## Posts');
    for (const p of posts) {
        const slug = p.id;
        const path = isBuild(p) ? `/builds/${slug}/` : `/essays/${slug}/`;
        const md = `${path.replace(/\/$/, '')}.md`;
        lines.push(`- [${p.data.title}](${SITE_URL}${path}) — ${p.data.description} ([markdown](${SITE_URL}${md}))`);
    }
    lines.push('');
    lines.push('## Full content');
    lines.push(`- [llms-full.txt](${SITE_URL}/llms-full.txt) — every post concatenated as Markdown`);
    lines.push('');
    return new Response(lines.join('\n'), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
};
