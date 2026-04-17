import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts.ts';
import { getAllPosts, isBuild } from '../lib/posts.ts';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';

const parser = new MarkdownIt({ html: true });

export async function GET(context) {
    const posts = await getAllPosts();
    return rss({
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        site: context.site,
        items: await Promise.all(posts.map(async (post) => {
            const link = isBuild(post) ? `/builds/${post.id}/` : `/essays/${post.id}/`;
            const body = post.body ? sanitizeHtml(parser.render(post.body), {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
                allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'title'] },
            }) : '';
            return {
                title: post.data.title,
                description: post.data.description,
                pubDate: post.data.pubDate,
                link,
                content: body,
                categories: post.data.tags,
            };
        })),
    });
}
