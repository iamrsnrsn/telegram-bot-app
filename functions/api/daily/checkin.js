// Cloudflare Pages Function: /api/daily/checkin

export async function onRequestPost(context) {
    try {
        const { userId } = await context.request.json();
        const db = context.env.DB;
        
        // Get user and config
        const user = await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first();
        const config = await db.prepare('SELECT * FROM config WHERE id = 1').first();
        
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const dailyReward = config?.daily_login_reward || 0.50;
        
        // Check if already claimed today
        const lastLogin = new Date(user.last_login);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
        
        if (lastLoginDate.getTime() === today.getTime()) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Already claimed today'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Calculate new streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const isConsecutive = lastLoginDate.getTime() === yesterday.getTime();
        const newStreak = isConsecutive ? user.streak + 1 : 1;
        
        // Update user
        await db.prepare(`
            UPDATE users SET 
                streak = ?,
                balance = balance + ?,
                total_earned = total_earned + ?,
                last_login = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `).bind(newStreak, dailyReward, dailyReward, userId).run();
        
        // Get updated user
        const updatedUser = await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first();
        const completedTasks = JSON.parse(updatedUser.completed_tasks || '[]');
        
        return new Response(JSON.stringify({
            success: true,
            reward: dailyReward,
            streak: newStreak,
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
        console.error('Daily checkin error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process checkin' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
