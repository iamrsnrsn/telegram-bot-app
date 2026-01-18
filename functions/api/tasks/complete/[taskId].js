// Cloudflare Pages Function: /api/tasks/complete/:taskId

export async function onRequestPost(context) {
    try {
        const { userId } = await context.request.json();
        const taskId = context.params.taskId;
        const db = context.env.DB;
        
        // Get task
        const task = await db.prepare('SELECT * FROM tasks WHERE task_id = ?').bind(taskId).first();
        
        if (!task) {
            return new Response(JSON.stringify({ error: 'Task not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get user
        const user = await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first();
        const completedTasks = JSON.parse(user.completed_tasks || '[]');
        
        // Check if already completed
        if (completedTasks.includes(taskId)) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Task already completed'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Add to completed tasks
        completedTasks.push(taskId);
        
        // Update user
        await db.prepare(`
            UPDATE users SET 
                completed_tasks = ?,
                balance = balance + ?,
                total_earned = total_earned + ?
            WHERE user_id = ?
        `).bind(JSON.stringify(completedTasks), task.reward, task.reward, userId).run();
        
        // Get updated user
        const updatedUser = await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first();
        
        return new Response(JSON.stringify({
            success: true,
            reward: task.reward,
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
                completedTasks: JSON.parse(updatedUser.completed_tasks || '[]'),
                createdAt: updatedUser.created_at
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Complete task error:', error);
        return new Response(JSON.stringify({ error: 'Failed to complete task' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
              }
