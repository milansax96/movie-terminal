const { cleanupExpiredCache, getCacheStats } = require('../../../utils/cache');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('[Cache Cleanup] Starting cache cleanup...');

    // Get stats before cleanup
    const statsBefore = await getCacheStats();
    console.log('[Cache Cleanup] Cache stats before:', statsBefore);

    // Run cleanup
    const cleanupResults = await cleanupExpiredCache();

    // Get stats after cleanup
    const statsAfter = await getCacheStats();
    console.log('[Cache Cleanup] Cache stats after:', statsAfter);

    return res.status(200).json({
      success: true,
      message: 'Cache cleanup completed',
      before: statsBefore,
      after: statsAfter,
      cleaned: cleanupResults,
    });
  } catch (error) {
    console.error('[Cache Cleanup] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cache cleanup failed',
      message: error.message,
    });
  }
}
