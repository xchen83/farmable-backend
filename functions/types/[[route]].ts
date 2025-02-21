export async function onRequest({ request }: { request: Request }) {
    return new Response("404 - Page not found", { status: 404 });
} 