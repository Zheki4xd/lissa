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

// Migrate from single image to images array
db.serialize(() => {
    // 1. Add new column for images array
    db.run(`ALTER TABLE about_cards ADD COLUMN images TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('❌ Error adding images column:', err);
            db.close();
            process.exit(1);
        } else {
            console.log('✅ Images column added (or already exists)');
        }
    });

    // 2. Migrate existing data: convert single image to array
    db.all(`SELECT id, image FROM about_cards WHERE image IS NOT NULL AND (images IS NULL OR images = '')`, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching cards:', err);
            db.close();
            process.exit(1);
        }

        if (rows.length === 0) {
            console.log('✅ No cards to migrate');
            db.close();
            process.exit(0);
            return;
        }

        console.log(`📦 Migrating ${rows.length} cards...`);

        const updatePromises = rows.map(row => {
            return new Promise((resolve, reject) => {
                const imagesArray = [row.image];
                const imagesJson = JSON.stringify(imagesArray);

                db.run(
                    `UPDATE about_cards SET images = ? WHERE id = ?`,
                    [imagesJson, row.id],
                    (err) => {
                        if (err) {
                            console.error(`❌ Error updating card ${row.id}:`, err);
                            reject(err);
                        } else {
                            console.log(`✅ Migrated card ${row.id}: ${row.image} → [${row.image}]`);
                            resolve();
                        }
                    }
                );
            });
        });

        Promise.all(updatePromises)
            .then(() => {
                console.log('✅ All cards migrated successfully!');
                console.log('ℹ️  Old "image" column still exists for backward compatibility');
                console.log('ℹ️  You can remove it later if needed');
                db.close();
                process.exit(0);
            })
            .catch(err => {
                console.error('❌ Migration failed:', err);
                db.close();
                process.exit(1);
            });
    });
});
