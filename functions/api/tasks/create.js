// Cloudflare Pages Function: /api/tasks/create

function generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export async function onRequestPost(context) {
    try {
        const { userId, task } = await context.request.json();
        const db = context.env.DB;
        
        // Verify admin
        const ADMIN_IDS = (context.env.ADMIN_IDS || '').split(',').map(id => id.trim());
        if (!ADMIN_IDS.includes(userId)) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const taskId = generateId();
        
        await db.prepare(`
            INSERT INTO tasks (task_id, title, reward, link, type, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(taskId, task.title, task.reward, task.link, task.type).run();
        
        return new Response(JSON.stringify({ success: true, taskId }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Create task error:', error);
        return new Response(JSON.stringify({ error: 'Failed to create task' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
