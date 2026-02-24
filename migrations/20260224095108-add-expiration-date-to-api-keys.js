module.exports = {
  async up(db, client) {
    // Add expiration date to all existing API keys (e.g., 30 days from creation or now)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    await db.collection('apikeys').updateMany(
      { expiresAt: { $exists: false } },
      { $set: { expiresAt: thirtyDaysFromNow } }
    );
  },

  async down(db, client) {
    // Remove the expiresAt field
    await db.collection('apikeys').updateMany(
      {},
      { $unset: { expiresAt: "" } }
    );
  }
};
