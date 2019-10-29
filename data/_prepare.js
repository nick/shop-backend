function prepareDb(db, netId) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS BlockTracker (
    network_id STRING PRIMARY KEY,
    last_block INTEGER
  );
  CREATE TABLE IF NOT EXISTS Transactions (
    network_id STRING,
    transaction_hash STRING,
    block_number INTEGER,
    PRIMARY KEY(network_id, transaction_hash)
  );
  INSERT OR IGNORE INTO BlockTracker(network_id, last_block) VALUES('${netId}', 0);
  `)
}

module.exports = prepareDb
