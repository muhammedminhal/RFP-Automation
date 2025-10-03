// scripts/reprocess-pending-chunks.js
// One-time script to enqueue embedding jobs for existing pending chunks

require('dotenv').config();
const pool = require('../src/config/db/pool');
const { enqueueEmbeddingForChunks } = require('../src/services/queue/enqueue/embedQueue');

async function reprocessPendingChunks() {
  try {
    console.log('🔍 Finding pending chunks...');
    
    const result = await pool.query(
      `SELECT id FROM chunks WHERE embedding_status = 'pending' ORDER BY created_at ASC`
    );
    
    const pendingChunkIds = result.rows.map(r => r.id);
    console.log(`Found ${pendingChunkIds.length} pending chunks`);
    
    if (pendingChunkIds.length === 0) {
      console.log('✅ No pending chunks to process');
      process.exit(0);
    }
    
    // Enqueue in batches of 50
    const batchSize = 50;
    for (let i = 0; i < pendingChunkIds.length; i += batchSize) {
      const batch = pendingChunkIds.slice(i, i + batchSize);
      console.log(`📤 Enqueuing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pendingChunkIds.length / batchSize)} (${batch.length} chunks)`);
      
      await enqueueEmbeddingForChunks(batch, { priority: 2 });
    }
    
    console.log(`✅ Successfully enqueued ${pendingChunkIds.length} chunks for embedding`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

reprocessPendingChunks();

