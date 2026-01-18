// Cloudflare Pages Function: /api/tasks/complete-ad-task
// Handles reward callback from AdsGram Task Ads

export async function onRequestPost(context) {
    try {
        const { userId, blockId, reward } = await context.request.json();
        const db = context.env.DB;
        
        if (!userId || !blockId) {
            return new Response(JSON.stringify({ error: 'Missing userId or blockId' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Default reward if not provided
        const rewardAmount = reward || 100;
        
        // Update user balance and total earned
        await db.prepare(`
            UPDATE users SET 
                balance = balance + ?,
                total_earned = total_earned + ?
            WHERE user_id = ?
        `).bind(rewardAmount, rewardAmount, userId).run();
        
        // Get updated user data
        const updatedUser = await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first();
        const completedTasks = JSON.parse(updatedUser.completed_tasks || '[]');
        
        return new Response(JSON.stringify({
            success: true,
            reward: rewardAmount,
            user: {
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
        console.error('Complete ad task error:', error);
        return new Response(JSON.stringify({ error: 'Failed to complete ad task' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
