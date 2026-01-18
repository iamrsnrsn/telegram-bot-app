// Cloudflare Pages Function: /api/withdraw/history

export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const userId = url.searchParams.get('userId');
        const db = context.env.DB;
        
        const withdrawals = await db.prepare(`
            SELECT * FROM withdrawals 
            WHERE user_id = ? 
            ORDER BY requested_at DESC
        `).bind(userId).all();
        
        return new Response(JSON.stringify(withdrawals.results.map(w => ({
            reqId: w.req_id,
            userId: w.user_id,
            amount: w.amount,
            wallet: w.wallet,
            status: w.status,
            requestedAt: w.requested_at,
            processedAt: w.processed_at,
            processedBy: w.processed_by
        }))), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get withdrawal history error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get history' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
