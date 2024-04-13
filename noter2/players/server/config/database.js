const db = require('better-sqlite3')('db.sqlite3');
db.exec(`DROP TABLE IF EXISTS notes;`);
db.exec(`CREATE TABLE notes(
        id INTEGER PRIMARY KEY,
        uuid TEXT,
        note TEXT,
        createBy TEXT,
        config TEXT
    );`
    );

module.exports = { 
    db: db   
}