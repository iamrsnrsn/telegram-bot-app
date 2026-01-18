// Cloudflare Pages Function: /api/user/get-or-create

export async function onRequestPost(context) {
    try {
        const { userId, firstName, username, referrerId } = await context.request.json();
        const db = context.env.DB;
        
        // Check if user exists
        const existingUser = await db.prepare(
            'SELECT * FROM users WHERE user_id = ?'
        ).bind(userId).first();
        
        if (existingUser) {
            // Parse completed tasks JSON
            const completedTasks = JSON.parse(existingUser.completed_tasks || '[]');
            
            return new Response(JSON.stringify({
                userId: existingUser.user_id,
                firstName: existingUser.first_name,
                username: existingUser.username,
                balance: existingUser.balance,
                totalEarned: existingUser.total_earned,
                streak: existingUser.streak,
                lastLogin: existingUser.last_login,
                referrals: existingUser.referrals,
                referrerId: existingUser.referrer_id,
                completedTasks,
                createdAt: existingUser.created_at
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get config for new user bonus
        const config = await db.prepare('SELECT * FROM config WHERE id = 1').first();
        const newUserBonus = config?.new_user_bonus || 0;
        const referralBonus = config?.referral_bonus || 0;
        
        // Create new user
        let initialBalance = newUserBonus;
        
        // Handle referral
        if (referrerId && referrerId !== userId) {
            // Check if referrer exists
            const referrer = await db.prepare(
                'SELECT * FROM users WHERE user_id = ?'
            ).bind(referrerId).first();
            
            if (referrer) {
                // Credit referrer
                await db.prepare(
                    'UPDATE users SET referrals = referrals + 1, balance = balance + ?, total_earned = total_earned + ? WHERE user_id = ?'
                ).bind(referralBonus, referralBonus, referrerId).run();
            }
        }
        
        // Insert new user
        await db.prepare(`
            INSERT INTO users (
                user_id, first_name, username, balance, total_earned, 
                streak, last_login, referrals, referrer_id, completed_tasks, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0, ?, '[]', CURRENT_TIMESTAMP)
        `).bind(
            userId,
            firstName || '',
            username || '',
            initialBalance,
            initialBalance,
            0,
            referrerId || null
        ).run();
        
        // Return new user data
        return new Response(JSON.stringify({
            userId,
            firstName: firstName || '',
            username: username || '',
            balance: initialBalance,
            totalEarned: initialBalance,
            streak: 0,
            lastLogin: new Date().toISOString(),
            referrals: 0,
            referrerId: referrerId || null,
            completedTasks: [],
            createdAt: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get or create user error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get or create user' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
                  }
