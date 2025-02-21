import app from './index';

export const onRequest: PagesFunction = async (context) => {
    const url = new URL(context.request.url);

    // If the path starts with /api, handle it with the Hono app
    if (url.pathname.startsWith('/api')) {
        return app.fetch(context.request, context.env);
    }

    // For all other routes, let Pages handle static files
    return context.next();
}; 