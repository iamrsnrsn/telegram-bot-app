// Cloudflare Pages Function: /api/auth/verify
import crypto from 'crypto';

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
        
        // Create secret key
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
        
        // Calculate hash
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        
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
  
