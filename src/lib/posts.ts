import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE_URL } from '../consts';

export type Essay = CollectionEntry<'essays'>;
export type Build = CollectionEntry<'builds'>;
export type Post = Essay | Build;

const notDraft = (p: Post) => import.meta.env.DEV || !p.data.draft;

export async function getEssays(): Promise<Essay[]> {
    const items = await getCollection('essays');
    return items.filter(notDraft).sort(byPubDateDesc);
}

export async function getBuilds(): Promise<Build[]> {
    const items = await getCollection('builds');
    return items.filter(notDraft).sort(byPubDateDesc);
}

export async function getAllPosts(): Promise<Post[]> {
    const [e, b] = await Promise.all([getEssays(), getBuilds()]);
    return [...e, ...b].sort(byPubDateDesc);
}

export function isBuild(p: Post): p is Build {
    return p.collection === 'builds';
}

export function postHref(p: Post): string {
    return `/${p.collection}/${p.id}/`;
}

export function absolutePostHref(p: Post): string {
    return `${SITE_URL}${postHref(p)}`;
}

export function markdownHref(p: Post): string {
    return `/${p.collection}/${p.id}.md`;
}

export function formatBuildNumber(n: number): string {
    return String(n).padStart(3, '0');
}

export function getTagsFromPosts(posts: Post[]): string[] {
    const set = new Set<string>();
    for (const p of posts) for (const t of p.data.tags) set.add(t);
    return [...set].sort();
}

export async function getPostStaticPaths(collection: 'essays' | 'builds') {
    const posts = collection === 'essays' ? await getEssays() : await getBuilds();
    return posts.map((post) => ({ params: { slug: post.id }, props: post }));
}

export function buildMarkdownResponse(post: Post): Response {
    const extra = isBuild(post) ? `\nnumber: ${post.data.number}` : '';
    const fm =
        `---\n` +
        `title: ${JSON.stringify(post.data.title)}\n` +
        `pubDate: ${post.data.pubDate.toISOString()}${extra}\n` +
        `tags: ${JSON.stringify(post.data.tags)}\n` +
        `url: ${postHref(post)}\n` +
        `---\n\n`;
    return new Response(fm + (post.body ?? ''), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}

function byPubDateDesc(a: Post, b: Post): number {
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}
