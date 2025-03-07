// functions/utils/cors.ts
// Update to make the CORS headers more flexible

// Function to check if the origin is allowed
export function isAllowedOrigin(origin: string): boolean {
    const allowedOrigins = [
      'http://localhost:4200',
      'https://farmable.pages.dev',
      'https://bc839dba.farmable.pages.dev'
    ];
    
    // Also allow any farmable.pages.dev subdomain
    if (origin.match(/^https:\/\/[a-zA-Z0-9-]+\.farmable\.pages\.dev$/)) {
      return true;
    }
    
    return allowedOrigins.includes(origin);
  }
  
  // Dynamic CORS headers that check the request origin
  export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
    // Default headers
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    };
    
    // If origin is allowed, set it in the response
    if (requestOrigin && isAllowedOrigin(requestOrigin)) {
      headers['Access-Control-Allow-Origin'] = requestOrigin;
    } else {
      // Fallback to the main site
      headers['Access-Control-Allow-Origin'] = 'https://farmable.pages.dev';
    }
    
    return headers;
  }
  
  // Handle OPTIONS preflight requests
  export function handleOptions(request: Request): Response {
    // Get the Origin header from the request
    const origin = request.headers.get('Origin');
    
    // Return response with appropriate CORS headers
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin)
    });
  }
  
  // Create a response with proper CORS headers
  export function createResponse<T>(data: T, status = 200): Response {
    // This would be used in context where you have access to the request
    // Since we don't have access to the request here, we'll use a wildcard
    // Note: In production, you'd want to pass the origin from the request context
    
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // This should ideally be dynamic based on request
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
    });
  }