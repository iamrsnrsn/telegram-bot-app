// Cloudflare Pages Function: /api/tasks/list

export async function onRequestGet(context) {
    try {
        const db = context.env.DB;
        
        const tasks = await db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
        
        return new Response(JSON.stringify(tasks.results.map(task => ({
            taskId: task.task_id,
            title: task.title,
            reward: task.reward,
            link: task.link,
            type: task.type,
            createdAt: task.created_at
        }))), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('List tasks error:', error);
        return new Response(JSON.stringify({ error: 'Failed to list tasks' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
