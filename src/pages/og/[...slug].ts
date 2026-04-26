import { OGImageRoute } from 'astro-og-canvas';
import { getAllPosts } from '../../lib/posts';

const posts = await getAllPosts();

const pages = Object.fromEntries(
    posts.map((post) => [
        `${post.collection}/${post.id}`,
        {
            title: post.data.title,
            description: post.data.description,
            tags: post.data.tags,
        },
    ]),
);

export const { getStaticPaths, GET } = await OGImageRoute({
    pages,
    param: 'slug',
    getImageOptions: (_path, page) => ({
        title: page.title,
        description: page.description,
        // No `logo:` — astro-og-canvas's CanvasKit cannot decode SVG; favicon.svg silently fails.
        // Add a raster favicon (e.g. /public/favicon.png) and reinstate `logo: { path, size }` if needed.
        border: { color: [255, 107, 0], width: 6, side: 'inline-start' },
        bgGradient: [[15, 15, 15], [30, 30, 30]],
        padding: 64,
        font: {
            title: { families: ['IBM Plex Sans'], weight: 'SemiBold', size: 64, color: [255, 255, 255] },
            description: { families: ['IBM Plex Sans'], weight: 'Normal', size: 28, color: [200, 200, 200] },
        },
        fonts: [
            './src/assets/fonts/IBMPlexSans-Regular.ttf',
            './src/assets/fonts/IBMPlexSans-SemiBold.ttf',
        ],
    }),
});
