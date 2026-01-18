// Cloudflare Pages Function: /api/referrals/list

export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const userId = url.searchParams.get('userId');
        const db = context.env.DB;
        
        const referrals = await db.prepare(`
            SELECT first_name, username, created_at 
            FROM users 
            WHERE referrer_id = ? 
            ORDER BY created_at DESC
        `).bind(userId).all();
        
        return new Response(JSON.stringify(referrals.results.map(ref => ({
            firstName: ref.first_name,
            username: ref.username,
            createdAt: ref.created_at
        }))), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('List referrals error:', error);
        return new Response(JSON.stringify({ error: 'Failed to list referrals' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
