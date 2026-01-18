// Cloudflare Pages Function: /api/auth/verify

export async function onRequestPost(context) {
    try {
        const { initData } = await context.request.json();
        
        if (!initData) {
            return new Response(JSON.stringify({ error: 'No initData provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get BOT_TOKEN from environment
        const BOT_TOKEN = context.env.BOT_TOKEN;
        
        if (!BOT_TOKEN) {
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Verify HMAC signature
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');
        
        // Sort parameters
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        // Create secret key using Web Crypto API
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode('WebAppData'),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const secretKeyBuffer = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(BOT_TOKEN)
        );
        
        // Calculate hash
        const dataKey = await crypto.subtle.importKey(
            'raw',
            secretKeyBuffer,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const hashBuffer = await crypto.subtle.sign(
            'HMAC',
            dataKey,
            encoder.encode(dataCheckString)
        );
        
        // Convert to hex
        const calculatedHash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        // Verify hash
        if (calculatedHash !== hash) {
            return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Parse user data
        const userParam = urlParams.get('user');
        if (!userParam) {
            return new Response(JSON.stringify({ error: 'No user data' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const user = JSON.parse(userParam);
        const userId = user.id.toString();
        
        // Check if admin (from environment or hardcoded)
        const ADMIN_IDS = (context.env.ADMIN_IDS || '').split(',').map(id => id.trim());
        const isAdmin = ADMIN_IDS.includes(userId);
        
        return new Response(JSON.stringify({
            userId,
            firstName: user.first_name,
            username: user.username,
            isAdmin
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Verify error:', error);
        return new Response(JSON.stringify({ error: 'Verification failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
