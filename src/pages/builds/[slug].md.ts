import type { APIRoute, GetStaticPaths } from 'astro';
import { getBuilds } from '../../lib/posts';

export const getStaticPaths: GetStaticPaths = async () => {
    const builds = await getBuilds();
    return builds.map((post) => ({ params: { slug: post.id }, props: post }));
};

export const GET: APIRoute = async ({ props }) => {
    const post = props as Awaited<ReturnType<typeof getBuilds>>[number];
    const fm = `---\ntitle: ${JSON.stringify(post.data.title)}\npubDate: ${post.data.pubDate.toISOString()}\nnumber: ${post.data.number}\ntags: ${JSON.stringify(post.data.tags)}\nurl: /builds/${post.id}/\n---\n\n`;
    return new Response(fm + (post.body ?? ''), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
};
