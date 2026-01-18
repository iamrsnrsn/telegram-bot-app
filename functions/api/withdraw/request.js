// Cloudflare Pages Function: /api/withdraw/request

function generateReqId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export async function onRequestPost(context) {
    try {
        const { userId, amount, wallet } = await context.request.json();
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
        
        const minWithdraw = config?.min_withdraw || 5.00;
        
        // Validate
        if (amount < minWithdraw) {
            return new Response(JSON.stringify({
                success: false,
                message: `Minimum withdrawal is ${minWithdraw}`
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (amount > user.balance) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Insufficient balance'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Instant deduct
        await db.prepare(`
            UPDATE users SET balance = balance - ? WHERE user_id = ?
        `).bind(amount, userId).run();
        
        // Create withdrawal request
        const reqId = generateReqId();
        await db.prepare(`
            INSERT INTO withdrawals (req_id, user_id, amount, wallet, status, requested_at)
            VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        `).bind(reqId, userId, amount, wallet).run();
        
        // Get updated user
        const updatedUser = await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first();
        const completedTasks = JSON.parse(updatedUser.completed_tasks || '[]');
        
        return new Response(JSON.stringify({
            success: true,
            reqId,
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
        console.error('Withdrawal request error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process withdrawal' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
