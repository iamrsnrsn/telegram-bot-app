// Cloudflare Pages Function: /api/withdraw/pending

export async function onRequestGet(context) {
    try {
        const db = context.env.DB;
        
        const withdrawals = await db.prepare(`
            SELECT * FROM withdrawals 
            WHERE status = 'pending' 
            ORDER BY requested_at DESC
        `).all();
        
        return new Response(JSON.stringify(withdrawals.results.map(w => ({
            reqId: w.req_id,
            userId: w.user_id,
            amount: w.amount,
            wallet: w.wallet,
            status: w.status,
            requestedAt: w.requested_at
        }))), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get pending withdrawals error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get pending withdrawals' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
