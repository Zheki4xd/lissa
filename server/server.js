const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
// Configure CORS to allow requests from Netlify and localhost
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            /\.netlify\.app$/,     // Any Netlify domain
            /\.ngrok\.io$/,        // Any ngrok domain
            /\.railway\.app$/,     // Any Railway domain
            /\.up\.railway\.app$/  // Railway production domains
        ];

        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return allowed === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // Allow anyway for development
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Database initialization
const db = new sqlite3.Database('./lissa.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('✅ Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    // Portfolio table with images stored as JSON array
    db.run(`
        CREATE TABLE IF NOT EXISTS portfolio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            title_ru TEXT,
            description_ru TEXT,
            title_en TEXT,
            description_en TEXT,
            title_uk TEXT,
            description_uk TEXT,
            images TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating portfolio table:', err);
        } else {
            console.log('✅ Portfolio table ready');

            // Add language columns if they don't exist (for existing databases)
            db.run(`ALTER TABLE portfolio ADD COLUMN title_ru TEXT`, () => {});
            db.run(`ALTER TABLE portfolio ADD COLUMN description_ru TEXT`, () => {});
            db.run(`ALTER TABLE portfolio ADD COLUMN title_en TEXT`, () => {});
            db.run(`ALTER TABLE portfolio ADD COLUMN description_en TEXT`, () => {});
            db.run(`ALTER TABLE portfolio ADD COLUMN title_uk TEXT`, () => {});
            db.run(`ALTER TABLE portfolio ADD COLUMN description_uk TEXT`, () => {});

            // Add priority column for sorting (default 0)
            db.run(`ALTER TABLE portfolio ADD COLUMN priority INTEGER DEFAULT 0`, () => {
                console.log('✅ Priority column added to portfolio');
            });
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating contacts table:', err);
        } else {
            console.log('✅ Contacts table ready');
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating admin table:', err);
        } else {
            console.log('✅ Admin table ready');
            // Create default admin if not exists (password: admin123)
            db.run(`INSERT OR IGNORE INTO admin (username, password) VALUES ('admin', 'admin123')`, (err) => {
                if (!err) {
                    console.log('✅ Default admin user created (username: admin, password: admin123)');
                }
            });
        }
    });

    // About cards table with multilingual support
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
            console.error('Error creating about_cards table:', err);
        } else {
            console.log('✅ About cards table ready');
        }
    });
}

// Configure multer for multiple file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
        }
    }
});

// ===== API Routes =====

// Get all portfolio items
app.get('/api/portfolio', (req, res) => {
    db.all('SELECT * FROM portfolio ORDER BY priority DESC, created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Error fetching portfolio:', err);
            return res.status(500).json({ error: 'Failed to fetch portfolio' });
        }

        // Parse images JSON for each item
        const items = rows.map(row => ({
            ...row,
            images: JSON.parse(row.images)
        }));

        res.json(items);
    });
});

// Get single portfolio item
app.get('/api/portfolio/:id', (req, res) => {
    db.get('SELECT * FROM portfolio WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            console.error('Error fetching portfolio item:', err);
            return res.status(500).json({ error: 'Failed to fetch portfolio item' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Portfolio item not found' });
        }

        // Parse images JSON
        row.images = JSON.parse(row.images);
        res.json(row);
    });
});

// Add portfolio item (admin only) - MULTIPLE IMAGES
app.post('/api/portfolio', upload.array('images', 20), (req, res) => {
    const { title, description, title_ru, description_ru, title_en, description_en, title_uk, description_uk, priority } = req.body;
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    if (!title_ru || images.length === 0) {
        return res.status(400).json({ error: 'Russian title and at least one image are required' });
    }

    const priorityValue = priority ? parseInt(priority) : 0;

    db.run(
        'INSERT INTO portfolio (title, description, title_ru, description_ru, title_en, description_en, title_uk, description_uk, images, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title || '', description || '', title_ru || '', description_ru || '', title_en || '', description_en || '', title_uk || '', description_uk || '', JSON.stringify(images), priorityValue],
        function(err) {
            if (err) {
                console.error('Error adding portfolio item:', err);
                return res.status(500).json({ error: 'Failed to add portfolio item' });
            }
            res.json({
                id: this.lastID,
                title,
                description,
                title_ru,
                description_ru,
                title_en,
                description_en,
                title_uk,
                description_uk,
                images,
                priority: priorityValue,
                message: 'Portfolio item added successfully'
            });
        }
    );
});

// Update portfolio item (admin only)
app.put('/api/portfolio/:id', upload.array('images', 20), (req, res) => {
    const { title, description, title_ru, description_ru, title_en, description_en, title_uk, description_uk, existingImages, priority } = req.body;
    const id = req.params.id;

    // Get existing item first
    db.get('SELECT * FROM portfolio WHERE id = ?', [id], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ error: 'Portfolio item not found' });
        }

        // Parse existing images
        let currentImages = JSON.parse(row.images);

        // Parse existingImages from request (images that user wants to keep)
        let keptImages = [];
        if (existingImages) {
            try {
                keptImages = JSON.parse(existingImages);
            } catch (e) {
                keptImages = Array.isArray(existingImages) ? existingImages : [existingImages];
            }
        }

        // Add new uploaded images
        const newImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        // Combine kept images with new images
        const finalImages = [...keptImages, ...newImages];

        if (finalImages.length === 0) {
            return res.status(400).json({ error: 'At least one image is required' });
        }

        // Delete removed images from filesystem
        const removedImages = currentImages.filter(img => !finalImages.includes(img));
        removedImages.forEach(img => {
            const filePath = path.join(__dirname, '../public', img);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        // Build update query
        let query = 'UPDATE portfolio SET ';
        const params = [];
        const updates = [];

        // Always update all fields (including empty strings to clear data)
        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        if (title_ru !== undefined) {
            updates.push('title_ru = ?');
            params.push(title_ru);
        }
        if (description_ru !== undefined) {
            updates.push('description_ru = ?');
            params.push(description_ru);
        }
        if (title_en !== undefined) {
            updates.push('title_en = ?');
            params.push(title_en);
        }
        if (description_en !== undefined) {
            updates.push('description_en = ?');
            params.push(description_en);
        }
        if (title_uk !== undefined) {
            updates.push('title_uk = ?');
            params.push(title_uk);
        }
        if (description_uk !== undefined) {
            updates.push('description_uk = ?');
            params.push(description_uk);
        }
        if (priority !== undefined) {
            updates.push('priority = ?');
            params.push(parseInt(priority) || 0);
        }
        updates.push('images = ?');
        params.push(JSON.stringify(finalImages));

        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        db.run(query, params, function(err) {
            if (err) {
                console.error('Error updating portfolio item:', err);
                return res.status(500).json({ error: 'Failed to update portfolio item' });
            }
            res.json({
                message: 'Portfolio item updated successfully',
                images: finalImages
            });
        });
    });
});

// Delete portfolio item (admin only)
app.delete('/api/portfolio/:id', (req, res) => {
    // First get the item to delete images
    db.get('SELECT * FROM portfolio WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete portfolio item' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Portfolio item not found' });
        }

        // Delete images from filesystem
        const images = JSON.parse(row.images);
        images.forEach(img => {
            const filePath = path.join(__dirname, '../public', img);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        // Delete from database
        db.run('DELETE FROM portfolio WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                console.error('Error deleting portfolio item:', err);
                return res.status(500).json({ error: 'Failed to delete portfolio item' });
            }
            res.json({ message: 'Portfolio item deleted successfully' });
        });
    });
});

// Reorder portfolio items (MUST be before /:id/reorder to avoid route conflict)
app.post('/api/portfolio/reorder', (req, res) => {
    const { order } = req.body;

    if (!order || !Array.isArray(order)) {
        return res.status(400).json({ error: 'Order array is required' });
    }

    // Update each item with its new position
    const updatePromises = order.map((id, index) => {
        return new Promise((resolve, reject) => {
            // We'll use created_at to store order - update timestamps
            // First item in order should have newest timestamp (for DESC sorting)
            const timestamp = new Date(Date.now() - index * 1000).toISOString();
            db.run(
                'UPDATE portfolio SET created_at = ? WHERE id = ?',
                [timestamp, id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    });

    Promise.all(updatePromises)
        .then(() => {
            res.json({ message: 'Portfolio order updated successfully' });
        })
        .catch(err => {
            console.error('Error reordering portfolio:', err);
            res.status(500).json({ error: 'Failed to reorder portfolio' });
        });
});

// Reorder images in portfolio item
app.put('/api/portfolio/:id/reorder', (req, res) => {
    const { images } = req.body;
    const id = req.params.id;

    if (!images || !Array.isArray(images)) {
        return res.status(400).json({ error: 'Images array is required' });
    }

    db.run(
        'UPDATE portfolio SET images = ? WHERE id = ?',
        [JSON.stringify(images), id],
        function(err) {
            if (err) {
                console.error('Error reordering images:', err);
                return res.status(500).json({ error: 'Failed to reorder images' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Portfolio item not found' });
            }
            res.json({ message: 'Images reordered successfully' });
        }
    );
});

// ===== ABOUT CARDS API =====

// Get all about cards
app.get('/api/about-cards', (req, res) => {
    db.all('SELECT * FROM about_cards ORDER BY priority ASC', [], (err, rows) => {
        if (err) {
            console.error('Error fetching about cards:', err);
            return res.status(500).json({ error: 'Failed to fetch about cards' });
        }
        res.json(rows);
    });
});

// Get single about card
app.get('/api/about-cards/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM about_cards WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching about card:', err);
            return res.status(500).json({ error: 'Failed to fetch about card' });
        }
        if (!row) {
            return res.status(404).json({ error: 'About card not found' });
        }
        res.json(row);
    });
});

// Create new about card
app.post('/api/about-cards', upload.array('images', 10), (req, res) => {
    const { title, description, title_ru, description_ru, title_en, description_en, title_uk, description_uk } = req.body;

    if (!title_ru) {
        return res.status(400).json({ error: 'Russian title is required' });
    }

    // Handle multiple images
    const imageUrls = req.files && req.files.length > 0
        ? req.files.map(file => `/uploads/${file.filename}`)
        : [];
    const imagesJson = JSON.stringify(imageUrls);
    const firstImage = imageUrls.length > 0 ? imageUrls[0] : null;

    // Try with 'images' column first (new schema), fallback to 'image' (old schema)
    db.run(
        `INSERT INTO about_cards (title, description, title_ru, description_ru, title_en, description_en, title_uk, description_uk, images, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title || '', description || '', title_ru, description_ru || '', title_en || '', description_en || '', title_uk || '', description_uk || '', imagesJson, firstImage],
        function(err) {
            if (err) {
                // If 'images' column doesn't exist, try old schema with only 'image'
                if (err.message.includes('has no column named images')) {
                    db.run(
                        `INSERT INTO about_cards (title, description, title_ru, description_ru, title_en, description_en, title_uk, description_uk, image)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [title || '', description || '', title_ru, description_ru || '', title_en || '', description_en || '', title_uk || '', description_uk || '', firstImage],
                        function(fallbackErr) {
                            if (fallbackErr) {
                                console.error('Error creating about card (fallback):', fallbackErr);
                                return res.status(500).json({ error: 'Failed to create about card' });
                            }
                            console.log('✅ Created card using OLD schema (image column)');
                            res.json({ id: this.lastID, message: 'About card created successfully' });
                        }
                    );
                } else {
                    console.error('Error creating about card:', err);
                    return res.status(500).json({ error: 'Failed to create about card' });
                }
            } else {
                console.log('✅ Created card using NEW schema (images column)');
                res.json({ id: this.lastID, message: 'About card created successfully' });
            }
        }
    );
});

// Update about card
app.put('/api/about-cards/:id', upload.array('images', 10), (req, res) => {
    const { id } = req.params;
    const { title, description, title_ru, description_ru, title_en, description_en, title_uk, description_uk, existingImages, removedImages } = req.body;

    // Get current card
    db.get('SELECT * FROM about_cards WHERE id = ?', [id], (err, currentCard) => {
        if (err) {
            console.error('Error fetching about card:', err);
            return res.status(500).json({ error: 'Failed to fetch about card' });
        }
        if (!currentCard) {
            return res.status(404).json({ error: 'About card not found' });
        }

        // Parse existing images from DB (support both old 'image' and new 'images' columns)
        let currentImages = [];
        if (currentCard.images) {
            try {
                currentImages = JSON.parse(currentCard.images);
            } catch (e) {
                currentImages = [];
            }
        } else if (currentCard.image) {
            // Backward compatibility: migrate old single image
            currentImages = [currentCard.image];
        }

        // Parse existingImages from request (images that weren't removed)
        let keptImages = [];
        if (existingImages) {
            try {
                keptImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
            } catch (e) {
                keptImages = [];
            }
        }

        // Parse removedImages (images to delete from filesystem)
        let imagesToRemove = [];
        if (removedImages) {
            try {
                imagesToRemove = typeof removedImages === 'string' ? JSON.parse(removedImages) : removedImages;
            } catch (e) {
                imagesToRemove = [];
            }
        }

        // Delete removed images from filesystem
        imagesToRemove.forEach(imgUrl => {
            const imagePath = path.join(__dirname, '../public', imgUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        });

        // Add new uploaded images
        const newImageUrls = req.files && req.files.length > 0
            ? req.files.map(file => `/uploads/${file.filename}`)
            : [];

        // Combine kept images + new images
        const finalImages = [...keptImages, ...newImageUrls];
        const imagesJson = JSON.stringify(finalImages);
        const firstImage = finalImages.length > 0 ? finalImages[0] : null;

        // Try with 'images' column first (new schema), fallback to 'image' (old schema)
        db.run(
            `UPDATE about_cards SET
                title = ?, description = ?, title_ru = ?, description_ru = ?,
                title_en = ?, description_en = ?, title_uk = ?, description_uk = ?, images = ?, image = ?
             WHERE id = ?`,
            [title || '', description || '', title_ru, description_ru || '', title_en || '', description_en || '', title_uk || '', description_uk || '', imagesJson, firstImage, id],
            function(err) {
                if (err) {
                    // If 'images' column doesn't exist, try old schema with only 'image'
                    if (err.message.includes('has no column named images')) {
                        db.run(
                            `UPDATE about_cards SET
                                title = ?, description = ?, title_ru = ?, description_ru = ?,
                                title_en = ?, description_en = ?, title_uk = ?, description_uk = ?, image = ?
                             WHERE id = ?`,
                            [title || '', description || '', title_ru, description_ru || '', title_en || '', description_en || '', title_uk || '', description_uk || '', firstImage, id],
                            function(fallbackErr) {
                                if (fallbackErr) {
                                    console.error('Error updating about card (fallback):', fallbackErr);
                                    return res.status(500).json({ error: 'Failed to update about card' });
                                }
                                console.log('✅ Updated card using OLD schema (image column)');
                                res.json({ message: 'About card updated successfully' });
                            }
                        );
                    } else {
                        console.error('Error updating about card:', err);
                        return res.status(500).json({ error: 'Failed to update about card' });
                    }
                } else {
                    console.log('✅ Updated card using NEW schema (images column)');
                    res.json({ message: 'About card updated successfully' });
                }
            }
        );
    });
});

// Delete about card
app.delete('/api/about-cards/:id', (req, res) => {
    const { id } = req.params;

    // Get the card to delete its images
    db.get('SELECT * FROM about_cards WHERE id = ?', [id], (err, card) => {
        if (err) {
            console.error('Error fetching about card:', err);
            return res.status(500).json({ error: 'Failed to fetch about card' });
        }
        if (!card) {
            return res.status(404).json({ error: 'About card not found' });
        }

        // Delete all image files
        let imagesToDelete = [];

        // Try new 'images' column first
        if (card.images) {
            try {
                imagesToDelete = JSON.parse(card.images);
            } catch (e) {
                imagesToDelete = [];
            }
        }
        // Fallback to old 'image' column for backward compatibility
        else if (card.image) {
            imagesToDelete = [card.image];
        }

        // Delete each image file
        imagesToDelete.forEach(imgUrl => {
            const imagePath = path.join(__dirname, '../public', imgUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        });

        // Delete the card from database
        db.run('DELETE FROM about_cards WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Error deleting about card:', err);
                return res.status(500).json({ error: 'Failed to delete about card' });
            }
            res.json({ message: 'About card deleted successfully' });
        });
    });
});

// Reorder about cards
app.post('/api/about-cards/reorder', (req, res) => {
    const { order } = req.body; // Array of IDs in desired order

    if (!Array.isArray(order)) {
        return res.status(400).json({ error: 'Order must be an array of IDs' });
    }

    const updatePromises = order.map((id, index) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE about_cards SET priority = ? WHERE id = ?', [index, id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });

    Promise.all(updatePromises)
        .then(() => res.json({ message: 'About cards reordered successfully' }))
        .catch(err => {
            console.error('Error reordering about cards:', err);
            res.status(500).json({ error: 'Failed to reorder about cards' });
        });
});

// Submit contact form
app.post('/api/contact', (req, res) => {
    const { name, phone, message } = req.body;

    if (!name || !phone || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    db.run(
        'INSERT INTO contacts (name, phone, message) VALUES (?, ?, ?)',
        [name, phone, message],
        function(err) {
            if (err) {
                console.error('Error saving contact form:', err);
                return res.status(500).json({ error: 'Failed to save contact form' });
            }
            res.json({ message: 'Contact form submitted successfully' });
        }
    );
});

// Get all contact messages (admin only)
app.get('/api/contacts', (req, res) => {
    db.all('SELECT * FROM contacts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Error fetching contacts:', err);
            return res.status(500).json({ error: 'Failed to fetch contacts' });
        }
        res.json(rows);
    });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get('SELECT * FROM admin WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ error: 'Login failed' });
        }
        if (!row) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({
            message: 'Login successful',
            username: row.username,
            token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
        });
    });
});

// Serve admin panel HTML
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Serve main page for all other routes (must be last!)
app.get('*', (req, res) => {
    // Don't catch admin routes or API routes
    if (req.path.startsWith('/admin/') || req.path.startsWith('/api/')) {
        return;
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`🌍 Main site: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});
