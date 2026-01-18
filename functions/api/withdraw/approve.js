// Cloudflare Pages Function: /api/withdraw/approve

export async function onRequestPost(context) {
    try {
        const { userId, reqId } = await context.request.json();
        const db = context.env.DB;
        
        // Verify admin
        const ADMIN_IDS = (context.env.ADMIN_IDS || '').split(',').map(id => id.trim());
        if (!ADMIN_IDS.includes(userId)) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Update withdrawal status
        await db.prepare(`
            UPDATE withdrawals SET 
                status = 'approved',
                processed_at = CURRENT_TIMESTAMP,
                processed_by = ?
            WHERE req_id = ?
        `).bind(userId, reqId).run();
        
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Approve withdrawal error:', error);
        return new Response(JSON.stringify({ error: 'Failed to approve withdrawal' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
