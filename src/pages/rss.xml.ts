import type { APIRoute } from 'astro';
import rss, { type RSSFeedItem } from '@astrojs/rss';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../consts';
import { getAllPosts, postHref, type Post } from '../lib/posts';

const parser = new MarkdownIt({ html: true });

// Drop the src attribute from any <img> that isn't relative or same-origin, so
// posts cannot inadvertently pass third-party tracking pixels or hotlinks
// through the feed. Self-authored content shouldn't trip this; it's defence
// against future drift (e.g. pasted Markdown from elsewhere).
function isLocalImageSrc(src: string): boolean {
    if (src.startsWith('/') || src.startsWith('data:')) return true;
    return src.startsWith(`${SITE_URL}/`);
}

async function toRssItem(post: Post): Promise<RSSFeedItem> {
    const body = post.body ? sanitizeHtml(parser.render(post.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'title'] },
        transformTags: {
            img: (tagName, attribs) => {
                if (attribs.src && !isLocalImageSrc(attribs.src)) {
                    const safe = { ...attribs };
                    delete safe.src;
                    return { tagName, attribs: safe };
                }
                return { tagName, attribs };
            },
        },
    }) : '';
    return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: postHref(post),
        content: body,
        categories: post.data.tags,
    };
}

export const GET: APIRoute = async (context) => {
    const posts = await getAllPosts();
    return rss({
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        site: context.site!,
        items: await Promise.all(posts.map(toRssItem)),
    });
};
