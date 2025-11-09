const sqlite3 = require('sqlite3').verbose();

// Open database
const db = new sqlite3.Database('./lissa.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    } else {
        console.log('✅ Connected to SQLite database');
    }
});

// Create about_cards table
db.run(`
    CREATE TABLE IF NOT EXISTS about_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        title_ru TEXT,
        description_ru TEXT,
        title_en TEXT,
        description_en TEXT,
        title_uk TEXT,
        description_uk TEXT,
        image TEXT,
        priority INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating about_cards table:', err);
        process.exit(1);
    } else {
        console.log('✅ About cards table created successfully');
        db.close();
        console.log('✅ Migration completed!');
        process.exit(0);
    }
});
