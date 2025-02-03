export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
};

export function handleOptions() {
    return new Response(null, {
        headers: corsHeaders,
        status: 204,
    });
}

export function createResponse<T>(data: T, status: number = 200) {
    return Response.json(data, {
        status,
        headers: corsHeaders,
    });
}
