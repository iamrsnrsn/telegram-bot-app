// Cloudflare Pages Function: /api/ads/complete

export async function onRequestPost(context) {
    try {
        const { userId } = await context.request.json();
        const db = context.env.DB;
        
        const hourlyLimit = 10;
        const dailyLimit = 50;
        
        // Check limits
        const hourlyResult = await db.prepare(`
            SELECT COUNT(*) as count FROM ad_watches 
            WHERE user_id = ? AND timestamp > datetime('now', '-1 hour')
        `).bind(userId).first();
        
        const dailyResult = await db.prepare(`
            SELECT COUNT(*) as count FROM ad_watches 
            WHERE user_id = ? AND timestamp > datetime('now', '-1 day')
        `).bind(userId).first();
        
        if (hourlyResult.count >= hourlyLimit || dailyResult.count >= dailyLimit) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Ad limit reached'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get config
        const config = await db.prepare('SELECT * FROM config WHERE id = 1').first();
        const adReward = config?.ad_reward || 0.10;
        
        // Record ad watch
        await db.prepare(`
            INSERT INTO ad_watches (user_id, timestamp) VALUES (?, CURRENT_TIMESTAMP)
        `).bind(userId).run();
        
        // Update user balance
        await db.prepare(`
            UPDATE users SET 
                balance = balance + ?,
                total_earned = total_earned + ?
            WHERE user_id = ?
        `).bind(adReward, adReward, userId).run();
        
        // Get updated user
        const updatedUser = await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first();
        const completedTasks = JSON.parse(updatedUser.completed_tasks || '[]');
        
        return new Response(JSON.stringify({
            success: true,
            reward: adReward,
            userData: {
                userId: updatedUser.user_id,
                firstName: updatedUser.first_name,
                username: updatedUser.username,
                balance: updatedUser.balance,
                totalEarned: updatedUser.total_earned,
                streak: updatedUser.streak,
                lastLogin: updatedUser.last_login,
                referrals: updatedUser.referrals,
                referrerId: updatedUser.referrer_id,
                completedTasks,
                createdAt: updatedUser.created_at
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Complete ad error:', error);
        return new Response(JSON.stringify({ error: 'Failed to complete ad' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
                  }
