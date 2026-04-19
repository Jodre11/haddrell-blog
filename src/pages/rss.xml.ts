import type { APIRoute } from 'astro';
import rss, { type RSSFeedItem } from '@astrojs/rss';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getAllPosts, postHref, type Post } from '../lib/posts';

const parser = new MarkdownIt({ html: true });

async function toRssItem(post: Post): Promise<RSSFeedItem> {
    const body = post.body ? sanitizeHtml(parser.render(post.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'title'] },
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
