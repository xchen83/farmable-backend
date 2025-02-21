import app from './index';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
    const url = new URL(context.request.url);

    // Debug logging
    console.log('Request path:', url.pathname);
    console.log('DB binding exists:', !!context.env.DB);

    // If the path starts with /api, handle it with the Hono app
    if (url.pathname.startsWith('/api')) {
        try {
            // Test database connection
            if (context.env.DB) {
                const testQuery = await context.env.DB.prepare('SELECT 1').first();
                console.log('Database test query result:', testQuery);
            }

            return app.fetch(context.request, {
                ...context.env,
                DB: context.env.DB
            });
        } catch (error) {
            console.error('Error in API route:', error);
            return new Response(JSON.stringify({
                success: false,
                error: 'Internal Server Error',
                details: error instanceof Error ? error.message : 'Unknown error'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // For the root path /, serve index.html
    if (url.pathname === '/') {
        return new Response(await context.env.ASSETS.fetch(context.request).then(res => res.text()), {
            headers: {
                'content-type': 'text/html;charset=UTF-8',
            },
        });
    }

    // For all other routes, let Pages handle static files
    return context.next();
}; 