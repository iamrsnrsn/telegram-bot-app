// Cloudflare Pages Function: /api/ads/counts

export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const userId = url.searchParams.get('userId');
        const db = context.env.DB;
        
        const hourlyLimit = 10;
        const dailyLimit = 50;
        
        // Count hourly watches
        const hourlyResult = await db.prepare(`
            SELECT COUNT(*) as count FROM ad_watches 
            WHERE user_id = ? AND timestamp > datetime('now', '-1 hour')
        `).bind(userId).first();
        
        // Count daily watches
        const dailyResult = await db.prepare(`
            SELECT COUNT(*) as count FROM ad_watches 
            WHERE user_id = ? AND timestamp > datetime('now', '-1 day')
        `).bind(userId).first();
        
        return new Response(JSON.stringify({
            hourly: hourlyResult.count,
            daily: dailyResult.count,
            hourlyLimit,
            dailyLimit
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get ad counts error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get ad counts' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
