// Cloudflare Pages Function: /api/config/update

export async function onRequestPost(context) {
    try {
        const { userId, config } = await context.request.json();
        const db = context.env.DB;
        
        // Verify admin
        const ADMIN_IDS = (context.env.ADMIN_IDS || '').split(',').map(id => id.trim());
        if (!ADMIN_IDS.includes(userId)) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Update config
        await db.prepare(`
            UPDATE config SET 
                ad_reward = ?,
                daily_login_reward = ?,
                referral_bonus = ?,
                new_user_bonus = ?,
                min_withdraw = ?
            WHERE id = 1
        `).bind(
            config.adReward,
            config.dailyLoginReward,
            config.referralBonus,
            config.newUserBonus,
            config.minWithdraw
        ).run();
        
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Update config error:', error);
        return new Response(JSON.stringify({ error: 'Failed to update config' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
