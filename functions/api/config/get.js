// Cloudflare Pages Function: /api/config/get

export async function onRequestGet(context) {
    try {
        const db = context.env.DB;
        
        const config = await db.prepare('SELECT * FROM config WHERE id = 1').first();
        
        if (!config) {
            // Return defaults if no config exists
            return new Response(JSON.stringify({
                adReward: 0.10,
                dailyLoginReward: 0.50,
                referralBonus: 1.00,
                newUserBonus: 0.50,
                minWithdraw: 5.00
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({
            adReward: config.ad_reward,
            dailyLoginReward: config.daily_login_reward,
            referralBonus: config.referral_bonus,
            newUserBonus: config.new_user_bonus,
            minWithdraw: config.min_withdraw
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get config error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get config' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
