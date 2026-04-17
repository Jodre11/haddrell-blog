import { getCollection, type CollectionEntry } from 'astro:content';

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

export function postHref(p: Post): string {
    return isBuild(p) ? `/builds/${p.id}/` : `/essays/${p.id}/`;
}

export function isBuild(p: Post): p is Build {
    return 'number' in p.data;
}

function byPubDateDesc(a: Post, b: Post): number {
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}

export async function getAllTags(): Promise<string[]> {
    const posts = await getAllPosts();
    const set = new Set<string>();
    for (const p of posts) for (const t of p.data.tags) set.add(t);
    return [...set].sort();
}
