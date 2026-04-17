import type { APIRoute, GetStaticPaths } from 'astro';
import { getEssays } from '../../lib/posts';

export const getStaticPaths: GetStaticPaths = async () => {
    const essays = await getEssays();
    return essays.map((post) => ({ params: { slug: post.id }, props: post }));
};

export const GET: APIRoute = async ({ props }) => {
    const post = props as Awaited<ReturnType<typeof getEssays>>[number];
    const fm = `---\ntitle: ${JSON.stringify(post.data.title)}\npubDate: ${post.data.pubDate.toISOString()}\ntags: ${JSON.stringify(post.data.tags)}\nurl: /essays/${post.id}/\n---\n\n`;
    return new Response(fm + (post.body ?? ''), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
};
