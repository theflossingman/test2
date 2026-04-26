const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const archiver = require('archiver');
const webpush = require('web-push');

const app = express();

// Data directory - use /app/data for Docker volume persistence, fallback to __dirname
const DATA_DIR = fs.existsSync('/app/data') ? '/app/data' : __dirname;
console.log('Using data directory:', DATA_DIR);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Enable CORS for all routes
app.use(cors());

// Serve static files from uploads directory (use DATA_DIR for persistence)
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads', 'shorts');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')));

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.mp4';
        cb(null, `short-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 200 * 1024 * 1024 // 200MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'));
        }
    }
});

// Data persistence functions - use DATA_DIR for Docker volume compatibility
const AURA_DATA_FILE = path.join(DATA_DIR, 'aura-data.json');
const DAILY_AURA_DATA_FILE = path.join(DATA_DIR, 'daily-aura-data.json');
const COIN_DATA_FILE = path.join(DATA_DIR, 'coin-data.json');
const PASSWORD_DATA_FILE = path.join(DATA_DIR, 'password-data.json');
const POSTS_DATA_FILE = path.join(DATA_DIR, 'posts-data.json');
const COMMENTS_DATA_FILE = path.join(DATA_DIR, 'comments-data.json');
const PURCHASED_BACKGROUNDS_FILE = path.join(DATA_DIR, 'purchased-backgrounds.json');
const PURCHASED_BADGES_FILE = path.join(DATA_DIR, 'purchased-badges.json');
const EQUIPPED_BADGES_FILE = path.join(DATA_DIR, 'equipped-badges.json');
const PURCHASED_FRAMES_FILE = path.join(DATA_DIR, 'purchased-frames.json');
const EQUIPPED_FRAMES_FILE = path.join(DATA_DIR, 'equipped-frames.json');
const ACTIVITY_LOG_FILE = path.join(DATA_DIR, 'activity-log.json');
const SHORTS_DATA_FILE = path.join(DATA_DIR, 'shorts-data.json');
const USER_BIOS_FILE = path.join(DATA_DIR, 'user-bios.json');

function loadAuraData() {
    try {
        if (fs.existsSync(AURA_DATA_FILE)) {
            const data = fs.readFileSync(AURA_DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading aura data:', error);
    }
    return {
        max: 0,
        gigi: 0,
        marco: 0,
        dezi: 0,
        sevi: 0
    };
}

function loadDailyAuraData() {
    try {
        if (fs.existsSync(DAILY_AURA_DATA_FILE)) {
            const data = fs.readFileSync(DAILY_AURA_DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading daily aura data:', error);
    }
    
    const today = new Date().toDateString();
    return {
        max: { 
            dezi: 0, 
            gigi: 0, 
            marco: 0, 
            sevi: 0, 
            date: today
        },
        gigi: { 
            max: 0, 
            dezi: 0, 
            marco: 0, 
            sevi: 0, 
            date: today
        },
        marco: { 
            max: 0, 
            gigi: 0, 
            dezi: 0, 
            sevi: 0, 
            date: today
        },
        dezi: { 
            max: 0, 
            gigi: 0, 
            marco: 0, 
            sevi: 0, 
            date: today
        },
        sevi: { 
            max: 0, 
            gigi: 0, 
            marco: 0, 
            dezi: 0, 
            date: today
        }
    };
}

function loadCoinData() {
    try {
        if (fs.existsSync(COIN_DATA_FILE)) {
            const data = fs.readFileSync(COIN_DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading coin data:', error);
    }
    return {
        max: 0,
        gigi: 0,
        marco: 0,
        dezi: 0,
        sevi: 0
    };
}

function loadPasswordData() {
    try {
        if (fs.existsSync(PASSWORD_DATA_FILE)) {
            const data = fs.readFileSync(PASSWORD_DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading password data:', error);
    }
    return {
        max: '1234',
        gigi: '1234',
        marco: '1234',
        dezi: '1234',
        sevi: '1234'
    };
}

function loadPostsData() {
    try {
        if (fs.existsSync(POSTS_DATA_FILE)) {
            const data = fs.readFileSync(POSTS_DATA_FILE, 'utf8');
            const posts = JSON.parse(data);
            console.log(`Loaded ${posts.length} posts from file`);
            
            // Check for image posts
            const imagePosts = posts.filter(post => post.type === 'image' && post.image);
            console.log(`Found ${imagePosts.length} image posts`);
            imagePosts.forEach(post => {
                console.log(`Image post from ${post.user}: image data length = ${post.image ? post.image.length : 0} characters`);
            });
            
            return posts;
        }
    } catch (error) {
        console.error('Error loading posts data:', error);
    }
    return [];
}

function savePostsData(posts) {
    try {
        fs.writeFileSync(POSTS_DATA_FILE, JSON.stringify(posts, null, 2));
        console.log('Posts data saved successfully');
    } catch (error) {
        console.error('Error saving posts data:', error);
    }
}

function loadCommentsData() {
    try {
        if (fs.existsSync(COMMENTS_DATA_FILE)) {
            const data = fs.readFileSync(COMMENTS_DATA_FILE, 'utf8');
            const comments = JSON.parse(data);
            console.log(`Loaded ${Object.keys(comments).length} posts with comments`);
            return comments;
        }
    } catch (error) {
        console.error('Error loading comments data:', error);
    }
    return {};
}

function saveCommentsData(comments) {
    try {
        fs.writeFileSync(COMMENTS_DATA_FILE, JSON.stringify(comments, null, 2));
        console.log('Comments data saved successfully');
    } catch (error) {
        console.error('Error saving comments data:', error);
    }
}

function loadPurchasedBackgrounds() {
    try {
        if (fs.existsSync(PURCHASED_BACKGROUNDS_FILE)) {
            const data = fs.readFileSync(PURCHASED_BACKGROUNDS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading purchased backgrounds data:', error);
    }
    return {
        max: [],
        gigi: [],
        marco: [],
        dezi: [],
        sevi: []
    };
}

function savePurchasedBackgrounds(purchasedBackgrounds) {
    try {
        fs.writeFileSync(PURCHASED_BACKGROUNDS_FILE, JSON.stringify(purchasedBackgrounds, null, 2));
        console.log('Purchased backgrounds data saved successfully');
    } catch (error) {
        console.error('Error saving purchased backgrounds data:', error);
    }
}

function loadPurchasedBadges() {
    try {
        if (fs.existsSync(PURCHASED_BADGES_FILE)) {
            const data = fs.readFileSync(PURCHASED_BADGES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading purchased badges data:', error);
    }
    return {
        max: [],
        gigi: [],
        marco: [],
        dezi: [],
        sevi: []
    };
}

function savePurchasedBadges(purchasedBadges) {
    try {
        fs.writeFileSync(PURCHASED_BADGES_FILE, JSON.stringify(purchasedBadges, null, 2));
        console.log('Purchased badges data saved successfully');
    } catch (error) {
        console.error('Error saving purchased badges data:', error);
    }
}

function loadEquippedBadges() {
    try {
        if (fs.existsSync(EQUIPPED_BADGES_FILE)) {
            const data = fs.readFileSync(EQUIPPED_BADGES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading equipped badges data:', error);
    }
    return {
        max: null,
        gigi: null,
        marco: null,
        dezi: null,
        sevi: null
    };
}

function saveEquippedBadges(equippedBadges) {
    try {
        fs.writeFileSync(EQUIPPED_BADGES_FILE, JSON.stringify(equippedBadges, null, 2));
        console.log('Equipped badges data saved successfully');
    } catch (error) {
        console.error('Error saving equipped badges data:', error);
    }
}

function loadPurchasedFrames() {
    try {
        if (fs.existsSync(PURCHASED_FRAMES_FILE)) {
            const data = fs.readFileSync(PURCHASED_FRAMES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading purchased frames data:', error);
    }
    return {
        max: [],
        gigi: [],
        marco: [],
        dezi: [],
        sevi: []
    };
}

function savePurchasedFrames(purchasedFrames) {
    try {
        fs.writeFileSync(PURCHASED_FRAMES_FILE, JSON.stringify(purchasedFrames, null, 2));
        console.log('Purchased frames data saved successfully');
    } catch (error) {
        console.error('Error saving purchased frames data:', error);
    }
}

function loadEquippedFrames() {
    try {
        if (fs.existsSync(EQUIPPED_FRAMES_FILE)) {
            const data = fs.readFileSync(EQUIPPED_FRAMES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading equipped frames data:', error);
    }
    return {
        max: null,
        gigi: null,
        marco: null,
        dezi: null,
        sevi: null
    };
}

function saveEquippedFrames(equippedFrames) {
    try {
        fs.writeFileSync(EQUIPPED_FRAMES_FILE, JSON.stringify(equippedFrames, null, 2));
        console.log('Equipped frames data saved successfully');
    } catch (error) {
        console.error('Error saving equipped frames data:', error);
    }
}

function loadActivityLog() {
    try {
        if (fs.existsSync(ACTIVITY_LOG_FILE)) {
            const data = fs.readFileSync(ACTIVITY_LOG_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading activity log:', error);
    }
    return [];
}

function saveActivityLog(activityLog) {
    try {
        fs.writeFileSync(ACTIVITY_LOG_FILE, JSON.stringify(activityLog, null, 2));
        console.log('Activity log saved successfully');
    } catch (error) {
        console.error('Error saving activity log:', error);
    }
}

function loadShortsData() {
    try {
        if (fs.existsSync(SHORTS_DATA_FILE)) {
            const data = fs.readFileSync(SHORTS_DATA_FILE, 'utf8');
            const shorts = JSON.parse(data);
            console.log(`Loaded ${shorts.length} shorts from file`);
            return shorts;
        }
    } catch (error) {
        console.error('Error loading shorts data:', error);
    }
    return [];
}

function saveShortsData(shorts) {
    try {
        fs.writeFileSync(SHORTS_DATA_FILE, JSON.stringify(shorts, null, 2));
        console.log(`Saved ${shorts.length} shorts to file`);
    } catch (error) {
        console.error('Error saving shorts data:', error);
    }
}

// User bios persistence
function loadUserBios() {
    try {
        if (fs.existsSync(USER_BIOS_FILE)) {
            const data = fs.readFileSync(USER_BIOS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading user bios:', error);
    }
    return {};
}

function saveUserBios(bios) {
    try {
        fs.writeFileSync(USER_BIOS_FILE, JSON.stringify(bios, null, 2));
        console.log('Saved user bios to file');
    } catch (error) {
        console.error('Error saving user bios:', error);
    }
}

// Define all available badges
const ALL_BADGES = [
    "Aura King 👑",
    "Aura God",
    "Aura Overlord",
    "Certified Legend",
    "Top Giver",
    "Himothy",
    "The Chosen One",
    "Main Character",
    "Big Aura Energy",
    "Elite Status",
    "Coin Collector",
    "Marketplace Mogul",
    "Drip Investor",
    "Aura Millionaire",
    "Big Spender",
    "Crypto Cousin 😂",
    "Coin Hoarder",
    "Luxury Loader",
    "Drip Dealer",
    "Rich Behavior",
    "Certified Yapper",
    "Professional Lurker",
    "NPC Energy",
    "Side Quest King",
    "Delulu Certified",
    "Touch Grass 💀",
    "Chronically Online",
    "Goofy Goober",
    "Skill Issue",
    "No Thoughts Head Empty",
    "Chat Demon",
    "Reply Instantly",
    "Left On Read 💀",
    "Double Texter",
    "Ghoster",
    "Streak Lord 🔥",
    "Typing…",
    "Voice Note Warrior",
    "Seen It All",
    "Story Spammer",
    "XP Grinder",
    "Coin Farmer",
    "Tryhard Mode",
    "AFK Legend",
    "Speedrunner",
    "Casual Chaos",
    "RNG Blessed",
    "Loot Goblin",
    "Final Boss",
    "Clutch Master",
    "OG Member",
    "Day One",
    "Founder",
    "Beta Tester",
    "Limited Drop",
    "Legendary Pull",
    "Mythic Aura",
    "Ultra Rare",
    "Glitched Badge 👾",
    "One of One",
    "Lowkey Icon",
    "Highkey Famous",
    "Aura Radiant",
    "Vibe Master",
    "Chillest Alive",
    "Silent Flex",
    "Smooth Operator",
    "Energy Different",
    "Built Different",
    "Untouchable"
];

function savePasswordData() {
    try {
        console.log('Saving password data to file...');
        fs.writeFileSync(PASSWORD_DATA_FILE, JSON.stringify(passwordData, null, 2));
        console.log('Password data saved successfully');
    } catch (error) {
        console.error('Error saving password data:', error);
    }
}

function saveAuraData() {
    try {
        console.log('Saving data to files...');
        fs.writeFileSync(AURA_DATA_FILE, JSON.stringify(auraData, null, 2));
        fs.writeFileSync(DAILY_AURA_DATA_FILE, JSON.stringify(dailyAuraData, null, 2));
        console.log('Writing coin data to file:', COIN_DATA_FILE);
        console.log('Coin data being written:', JSON.stringify(coinData, null, 2));
        fs.writeFileSync(COIN_DATA_FILE, JSON.stringify(coinData, null, 2));
        
        // Save frame data
        savePurchasedFrames(purchasedFrames);
        saveEquippedFrames(equippedFrames);
        
        console.log('Aura, coin, and frame data saved successfully');
        
        // Verify the file was written correctly
        const verifyData = JSON.parse(fs.readFileSync(COIN_DATA_FILE, 'utf8'));
        console.log('Verification - coin data in file after save:', JSON.stringify(verifyData, null, 2));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Load data on startup
let auraData = loadAuraData();
let dailyAuraData = loadDailyAuraData();
let coinData = loadCoinData();
let passwordData = loadPasswordData();
let purchasedBackgrounds = loadPurchasedBackgrounds();
let purchasedBadges = loadPurchasedBadges();
let equippedBadges = loadEquippedBadges();
let purchasedFrames = loadPurchasedFrames();
let equippedFrames = loadEquippedFrames();
let activityLog = loadActivityLog();

console.log('Initial coin data loaded:', coinData);

// Daily reset function
function performDailyReset() {
    const today = new Date().toDateString();
    let resetPerformed = false;
    
    // Check if we need to reset for any user
    Object.keys(dailyAuraData).forEach(userId => {
        if (dailyAuraData[userId] && dailyAuraData[userId].date !== today) {
            // Reset this user's daily limits
            Object.keys(dailyAuraData[userId]).forEach(key => {
                if (key !== 'date') {
                    dailyAuraData[userId][key] = 0;
                }
            });
            dailyAuraData[userId].date = today;
            resetPerformed = true;
        }
    });
    
    if (resetPerformed) {
        saveAuraData();
        console.log(`[${new Date().toISOString()}] Daily aura limits reset for all users`);
    }
}

// Schedule daily reset at 4 AM
function scheduleDailyReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(4, 0, 0, 0); // Set to 4 AM tomorrow
    
    const msUntil4AM = tomorrow.getTime() - now.getTime();
    
    console.log(`[${new Date().toISOString()}] Scheduled daily reset for ${tomorrow.toISOString()}`);
    
    setTimeout(() => {
        performDailyReset();
        // Schedule next day's reset
        scheduleDailyReset();
    }, msUntil4AM);
}

// Perform initial reset check and schedule daily resets
performDailyReset();
scheduleDailyReset();

// REST API endpoints
app.use(express.json({ limit: '50mb' })); // Increase limit for large base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.'));

// Get aura data
app.get('/api/aura', (req, res) => {
    res.json({ auraData, dailyAuraData, coinData, passwordData });
});

// Get posts
app.get('/api/posts', (req, res) => {
    const posts = loadPostsData();
    res.json(posts);
});

// Save posts
app.post('/api/posts', (req, res) => {
    const { posts } = req.body;
    console.log('POST /api/posts received:', posts.length, 'posts');
    
    if (!Array.isArray(posts)) {
        return res.status(400).json({ error: 'Posts must be an array' });
    }
    
    // Check for image posts and log their sizes
    posts.forEach(post => {
        if (post.type === 'image' && post.image) {
            console.log(`Image post from ${post.user}: image data length = ${post.image.length} characters`);
        }
    });
    
    try {
        savePostsData(posts);
        console.log('Posts saved successfully to file');
        res.json({ success: true, posts });
    } catch (error) {
        console.error('Error saving posts:', error);
        res.status(500).json({ error: 'Failed to save posts', details: error.message });
    }
});

// Get all shorts
app.get('/api/shorts', (req, res) => {
    const shorts = loadShortsData();
    res.json(shorts);
});

// Save a new short (with base64 video - legacy)
app.post('/api/shorts', (req, res) => {
    const short = req.body;
    console.log('POST /api/shorts received:', short.id, 'from', short.user);
    
    if (!short || !short.id || !short.user) {
        return res.status(400).json({ error: 'Invalid short data' });
    }
    
    try {
        const shorts = loadShortsData();
        
        // Check if short already exists (avoid duplicates)
        const exists = shorts.some(s => s.id === short.id);
        if (!exists) {
            shorts.push(short);
            saveShortsData(shorts);
            console.log('Short saved successfully. Total shorts:', shorts.length);
        } else {
            console.log('Short already exists, skipping save');
        }
        
        res.json({ success: true, shorts });
    } catch (error) {
        console.error('Error saving short:', error);
        res.status(500).json({ error: 'Failed to save short', details: error.message });
    }
});

// Upload short video file (new fast method)
app.post('/api/shorts/upload', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }
        
        const { caption, user, userId } = req.body;
        
        if (!user || !userId) {
            // Delete uploaded file if user data missing
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'User data required' });
        }
        
        // Create video URL path
        const videoUrl = `/uploads/shorts/${req.file.filename}`;
        
        // Create short object with file URL instead of base64
        const newShort = {
            id: Date.now(),
            user: user,
            userId: userId,
            caption: caption || '',
            videoUrl: videoUrl,
            videoFile: req.file.filename,
            time: new Date().toLocaleString(),
            likes: 0,
            comments: 0,
            liked: false
        };
        
        // Save to shorts data
        const shorts = loadShortsData();
        shorts.push(newShort);
        saveShortsData(shorts);
        
        console.log('Video uploaded:', req.file.filename, 'Size:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');
        
        res.json({ 
            success: true, 
            short: newShort,
            message: 'Video uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading video:', error);
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to upload video', details: error.message });
    }
});

// Delete a specific short (admin only)
app.delete('/api/shorts/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { adminUser } = req.body;
        
        // Verify admin
        if (adminUser !== 'max') {
            return res.status(403).json({ error: 'Only admin can delete shorts' });
        }
        
        const shorts = loadShortsData();
        const shortToDelete = shorts.find(s => s.id === parseInt(id));
        
        if (!shortToDelete) {
            return res.status(404).json({ error: 'Short not found' });
        }
        
        // Delete video file if it exists
        if (shortToDelete.videoFile) {
            const videoPath = path.join(UPLOADS_DIR, shortToDelete.videoFile);
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
                console.log('Deleted video file:', shortToDelete.videoFile);
            }
        }
        
        // Remove from shorts data
        const updatedShorts = shorts.filter(s => s.id !== parseInt(id));
        saveShortsData(updatedShorts);
        
        console.log(`Deleted short ${id}. Remaining shorts: ${updatedShorts.length}`);
        
        res.json({ success: true, message: 'Short deleted successfully' });
    } catch (error) {
        console.error('Error deleting short:', error);
        res.status(500).json({ error: 'Failed to delete short', details: error.message });
    }
});

// Delete all shorts (admin only)
app.post('/api/shorts/delete-all', (req, res) => {
    try {
        const { adminUser } = req.body;
        
        // Verify admin
        if (adminUser !== 'max') {
            return res.status(403).json({ error: 'Only admin can delete all shorts' });
        }
        
        const shorts = loadShortsData();
        const deletedCount = shorts.length;
        
        // Delete all video files
        shorts.forEach(short => {
            if (short.videoFile) {
                const videoPath = path.join(UPLOADS_DIR, short.videoFile);
                if (fs.existsSync(videoPath)) {
                    fs.unlinkSync(videoPath);
                    console.log('Deleted video file:', short.videoFile);
                }
            }
        });
        
        // Clear shorts data
        saveShortsData([]);
        
        console.log(`Deleted all ${deletedCount} shorts`);
        
        res.json({ success: true, deletedCount, message: 'All shorts deleted successfully' });
    } catch (error) {
        console.error('Error deleting all shorts:', error);
        res.status(500).json({ error: 'Failed to delete all shorts', details: error.message });
    }
});

// Get all user bios
app.get('/api/user-bios', (req, res) => {
    const bios = loadUserBios();
    res.json(bios);
});

// Get specific user bio
app.get('/api/user-bios/:userId', (req, res) => {
    const { userId } = req.params;
    const bios = loadUserBios();
    res.json({ userId, bio: bios[userId] || '' });
});

// Update user bio
app.post('/api/user-bios/:userId', (req, res) => {
    const { userId } = req.params;
    const { bio } = req.body;
    
    if (!userId || bio === undefined) {
        return res.status(400).json({ error: 'User ID and bio required' });
    }
    
    try {
        const bios = loadUserBios();
        bios[userId] = bio;
        saveUserBios(bios);
        console.log(`Updated bio for ${userId}:`, bio.substring(0, 50));
        res.json({ success: true, userId, bio });
    } catch (error) {
        console.error('Error saving bio:', error);
        res.status(500).json({ error: 'Failed to save bio', details: error.message });
    }
});

// Get comments for a post
app.get('/api/comments/:postId', (req, res) => {
    const { postId } = req.params;
    const comments = loadCommentsData();
    const postComments = comments[postId] || [];
    res.json(postComments);
});

// Add comment to a post
app.post('/api/comments/:postId', (req, res) => {
    const { postId } = req.params;
    const { comment } = req.body;
    
    console.log(`Adding comment to post ${postId}:`, comment);
    
    if (!comment || !comment.text || !comment.user) {
        return res.status(400).json({ error: 'Invalid comment data' });
    }
    
    try {
        const comments = loadCommentsData();
        
        // Initialize comments array for this post if it doesn't exist
        if (!comments[postId]) {
            comments[postId] = [];
        }
        
        // Add new comment
        const newComment = {
            id: Date.now(),
            text: comment.text,
            user: comment.user,
            avatar: comment.avatar,
            gradient: comment.gradient,
            time: new Date().toLocaleString(),
            timestamp: new Date().toISOString()
        };
        
        comments[postId].unshift(newComment); // Add to beginning (newest first)
        
        saveCommentsData(comments);
        console.log(`Comment added to post ${postId}. Total comments: ${comments[postId].length}`);
        
        res.json({ success: true, comment: newComment, totalComments: comments[postId].length });
    } catch (error) {
        console.error('Error saving comment:', error);
        res.status(500).json({ error: 'Failed to save comment', details: error.message });
    }
});

// Update aura (fallback REST API)
app.post('/api/aura', (req, res) => {
    const { person, action, currentUser } = req.body;
    console.log('POST /api/aura received:', { person, action, currentUser });
    
    // Same validation logic as WebSocket
    if (!person || !action || !currentUser) {
        return res.status(400).json({ error: 'Invalid data' });
    }
    
    const today = new Date().toDateString();
    if (dailyAuraData[currentUser].date !== today) {
        Object.keys(dailyAuraData[currentUser]).forEach(key => {
            if (key !== 'date') {
                dailyAuraData[currentUser][key] = 0;
            }
        });
        dailyAuraData[currentUser].date = today;
    }
    
    const incrementAmount = 25;
    const currentGivenToPerson = dailyAuraData[currentUser][person] || 0;
    const DAILY_POSITIVE_LIMIT = 500;
    const DAILY_NEGATIVE_LIMIT = -500;
    
    if (action === 'increment') {
        if (currentGivenToPerson + incrementAmount > DAILY_POSITIVE_LIMIT) {
            return res.status(400).json({ 
                error: `You've reached your daily limit of ${DAILY_POSITIVE_LIMIT} aura for ${person.charAt(0).toUpperCase() + person.slice(1)}!` 
            });
        }
        auraData[person] += incrementAmount;
        dailyAuraData[currentUser][person] = currentGivenToPerson + incrementAmount;
    } else if (action === 'decrement') {
        if (currentGivenToPerson - incrementAmount < DAILY_NEGATIVE_LIMIT) {
            return res.status(400).json({ 
                error: `You've reached your daily negative limit of ${DAILY_NEGATIVE_LIMIT} aura for ${person.charAt(0).toUpperCase() + person.slice(1)}!` 
            });
        }
        auraData[person] -= incrementAmount;
        dailyAuraData[currentUser][person] = currentGivenToPerson - incrementAmount;
    }
    
    // Coin earning/losing logic
    if (action === 'increment') {
        // Person receiving +1 aura gets 2 coins
        coinData[person] = (coinData[person] || 0) + 2;
        console.log(`${person} earned 2 coins for receiving +1 aura. New balance: ${coinData[person]}`);
    } else if (action === 'decrement') {
        // Person receiving -1 aura loses 1 coin (but never goes below 0)
        coinData[person] = Math.max(0, (coinData[person] || 0) - 1);
        console.log(`${person} lost 1 coin for receiving -1 aura. New balance: ${coinData[person]}`);
        
        // Person removing aura also loses 1 coin as penalty (but never goes below 0)
        coinData[currentUser] = Math.max(0, (coinData[currentUser] || 0) - 1);
        console.log(`${currentUser} lost 1 coin penalty for removing aura. New balance: ${coinData[currentUser]}`);
    }
    
    console.log('Final coin data being returned:', coinData);
    saveAuraData();
    res.json({ success: true, auraData, coinData });
});

// Admin API endpoints
app.post('/api/aura/admin', (req, res) => {
    const { userId, auraValue, adminUser } = req.body;
    
    // Verify admin access
    if (adminUser !== 'max') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Validate user exists
    if (!auraData.hasOwnProperty(userId)) {
        return res.status(400).json({ error: 'User not found' });
    }
    
    // Set aura value (no limits for admin)
    auraData[userId] = auraValue;
    
    console.log(`Admin ${adminUser} set ${userId} aura to ${auraValue}`);
    res.json({ success: true, auraData });
});

app.post('/api/aura/admin/reset', (req, res) => {
    const { adminUser } = req.body;
    
    // Verify admin access
    if (adminUser !== 'max') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Reset all aura to 0
    Object.keys(auraData).forEach(userId => {
        auraData[userId] = 0;
    });
    
    // Reset daily limits as well
    Object.keys(dailyAuraData).forEach(userId => {
        Object.keys(dailyAuraData[userId]).forEach(key => {
            if (key !== 'date') {
                dailyAuraData[userId][key] = 0;
            }
        });
    });
    
    // Save data after changes
    saveAuraData();
    
    console.log(`Admin ${adminUser} reset all aura to 0`);
    res.json({ success: true, auraData, dailyAuraData });
});

// Admin API endpoint to set individual user coins
app.post('/api/coins/admin', (req, res) => {
    const { userId, coinValue, adminUser } = req.body;
    
    // Verify admin access
    if (adminUser !== 'max') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Validate user exists
    if (!coinData.hasOwnProperty(userId)) {
        return res.status(400).json({ error: 'User not found' });
    }
    
    // Set coin value (no limits for admin)
    const oldCoins = coinData[userId];
    coinData[userId] = coinValue;
    
    console.log(`Admin ${adminUser} set ${userId} coins from ${oldCoins} to ${coinValue}`);
    
    // Save data after changes
    saveAuraData();
    
    res.json({ success: true, coinData });
});

// Admin API endpoint to update user passwords
app.post('/api/passwords/admin', (req, res) => {
    const { userId, newPassword, adminUser } = req.body;
    
    // Verify admin access
    if (adminUser !== 'max') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Validate user exists
    if (!passwordData.hasOwnProperty(userId)) {
        return res.status(400).json({ error: 'User not found' });
    }
    
    // Validate password is not empty
    if (!newPassword || newPassword.trim() === '') {
        return res.status(400).json({ error: 'Password cannot be empty' });
    }
    
    // Update password
    const oldPassword = passwordData[userId];
    passwordData[userId] = newPassword.trim();
    
    console.log(`Admin ${adminUser} updated password for ${userId}`);
    
    // Save password data
    savePasswordData();
    
    res.json({ 
        success: true, 
        message: `Password updated for ${userId}`,
        userId: userId
    });
});

// Purchase API endpoint for backgrounds
app.post('/api/coins/purchase', (req, res) => {
    const { userId, cost, item } = req.body;
    
    console.log(`Purchase request: ${userId} wants to buy ${item} for ${cost} coins`);
    
    // Validate user exists
    if (!coinData.hasOwnProperty(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user' });
    }
    
    // Check if user has enough coins
    if (coinData[userId] < cost) {
        return res.status(400).json({ success: false, message: 'Insufficient coins' });
    }
    
    // Process the purchase
    const oldCoins = coinData[userId];
    coinData[userId] -= cost;
    
    console.log(`User ${userId} purchased ${item} for ${cost} coins. Balance: ${oldCoins} -> ${coinData[userId]}`);
    
    // Add to purchased backgrounds if it's a background item
    if (item.startsWith('gradient')) {
        if (!purchasedBackgrounds[userId]) {
            purchasedBackgrounds[userId] = [];
        }
        if (!purchasedBackgrounds[userId].includes(item)) {
            purchasedBackgrounds[userId].push(item);
            savePurchasedBackgrounds(purchasedBackgrounds);
        }
    }
    
    // Save data after changes
    saveAuraData();
    
    res.json({ 
        success: true, 
        message: `Purchased ${item} for ${cost} coins`,
        newBalance: coinData[userId],
        coinData: coinData,
        purchasedBackgrounds: purchasedBackgrounds
    });
});

// Get purchased backgrounds for a user
app.get('/api/purchased-backgrounds/:userId', (req, res) => {
    const { userId } = req.params;
    
    if (!purchasedBackgrounds.hasOwnProperty(userId)) {
        return res.json({ success: true, backgrounds: [] });
    }
    
    res.json({ 
        success: true, 
        backgrounds: purchasedBackgrounds[userId] || []
    });
});

// Sync purchased backgrounds for a user
app.post('/api/purchased-backgrounds/:userId/sync', (req, res) => {
    const { userId } = req.params;
    const { backgrounds } = req.body;
    
    console.log(`Sync request: ${userId} syncing ${backgrounds ? backgrounds.length : 0} backgrounds`);
    
    if (!purchasedBackgrounds.hasOwnProperty(userId)) {
        purchasedBackgrounds[userId] = [];
    }
    
    // Merge server and client backgrounds (union of both)
    const serverBackgrounds = purchasedBackgrounds[userId] || [];
    const clientBackgrounds = backgrounds || [];
    const mergedBackgrounds = [...new Set([...serverBackgrounds, ...clientBackgrounds])];
    
    purchasedBackgrounds[userId] = mergedBackgrounds;
    savePurchasedBackgrounds(purchasedBackgrounds);
    
    res.json({ 
        success: true, 
        message: `Synced ${mergedBackgrounds.length} backgrounds for ${userId}`,
        backgrounds: mergedBackgrounds
    });
});

// Get all available badges
app.get('/api/badges', (req, res) => {
    res.json({ 
        success: true, 
        badges: ALL_BADGES 
    });
});

// Get purchased badges for a user
app.get('/api/purchased-badges/:userId', (req, res) => {
    const { userId } = req.params;
    
    if (!purchasedBadges.hasOwnProperty(userId)) {
        return res.json({ success: true, badges: [] });
    }
    
    res.json({ 
        success: true, 
        badges: purchasedBadges[userId] || []
    });
});

// Get equipped badge for a user
app.get('/api/equipped-badge/:userId', (req, res) => {
    const { userId } = req.params;
    
    res.json({ 
        success: true, 
        badge: equippedBadges[userId] || null
    });
});

// Sync purchased badges for a user
app.post('/api/purchased-badges/:userId/sync', (req, res) => {
    const { userId } = req.params;
    const { badges } = req.body;
    
    console.log(`Sync request: ${userId} syncing ${badges ? badges.length : 0} badges`);
    
    if (!purchasedBadges.hasOwnProperty(userId)) {
        purchasedBadges[userId] = [];
    }
    
    // Merge server and client badges (union of both)
    const serverBadges = purchasedBadges[userId] || [];
    const clientBadges = badges || [];
    const mergedBadges = [...new Set([...serverBadges, ...clientBadges])];
    
    purchasedBadges[userId] = mergedBadges;
    savePurchasedBadges(purchasedBadges);
    
    res.json({ 
        success: true, 
        message: `Synced ${mergedBadges.length} badges for ${userId}`,
        badges: mergedBadges
    });
});

// Purchase a badge
app.post('/api/badges/purchase', (req, res) => {
    const { userId, cost, badge } = req.body;
    
    console.log(`Badge purchase request: ${userId} wants to buy ${badge} for ${cost} coins`);
    
    // Validate user exists
    if (!coinData.hasOwnProperty(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user' });
    }
    
    // Check if user has enough coins
    if (coinData[userId] < cost) {
        return res.status(400).json({ success: false, message: 'Insufficient coins' });
    }
    
    // Check if badge exists
    if (!ALL_BADGES.includes(badge)) {
        return res.status(400).json({ success: false, message: 'Invalid badge' });
    }
    
    // Check if user already owns this badge
    if (purchasedBadges[userId] && purchasedBadges[userId].includes(badge)) {
        return res.status(400).json({ success: false, message: 'Badge already owned' });
    }
    
    // Process the purchase
    const oldCoins = coinData[userId];
    coinData[userId] -= cost;
    
    // Add to purchased badges
    if (!purchasedBadges[userId]) {
        purchasedBadges[userId] = [];
    }
    purchasedBadges[userId].push(badge);
    
    console.log(`User ${userId} purchased badge ${badge} for ${cost} coins. Balance: ${oldCoins} -> ${coinData[userId]}`);
    
    // Save data after changes
    saveAuraData();
    savePurchasedBadges(purchasedBadges);
    
    res.json({ 
        success: true, 
        message: `Purchased ${badge} for ${cost} coins`,
        newBalance: coinData[userId],
        coinData: coinData,
        purchasedBadges: purchasedBadges
    });
});

// Equip a badge
app.post('/api/badges/equip', (req, res) => {
    const { userId, badge } = req.body;
    
    console.log(`Equip request: ${userId} wants to equip ${badge}`);
    
    // Validate user exists
    if (!purchasedBadges.hasOwnProperty(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user' });
    }
    
    // Check if user owns this badge
    if (!purchasedBadges[userId] || !purchasedBadges[userId].includes(badge)) {
        return res.status(400).json({ success: false, message: 'Badge not owned' });
    }
    
    // Equip the badge
    equippedBadges[userId] = badge;
    saveEquippedBadges(equippedBadges);
    
    console.log(`User ${userId} equipped badge: ${badge}`);
    
    res.json({ 
        success: true, 
        message: `Equipped ${badge}`,
        equippedBadge: badge,
        equippedBadges: equippedBadges
    });
});

// Unequip a badge
app.post('/api/badges/unequip', (req, res) => {
    const { userId } = req.body;
    
    console.log(`Unequip request: ${userId} wants to unequip badge`);
    
    // Validate user exists
    if (!equippedBadges.hasOwnProperty(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user' });
    }
    
    // Unequip the badge
    const previousBadge = equippedBadges[userId];
    equippedBadges[userId] = null;
    saveEquippedBadges(equippedBadges);
    
    console.log(`User ${userId} unequipped badge: ${previousBadge}`);
    
    res.json({ 
        success: true, 
        message: `Unequipped badge`,
        equippedBadge: null,
        equippedBadges: equippedBadges
    });
});

// Frame API endpoints

// Get purchased frames for a user
app.get('/api/purchased-frames/:userId', (req, res) => {
    const { userId } = req.params;
    
    if (!purchasedFrames.hasOwnProperty(userId)) {
        purchasedFrames[userId] = [];
    }
    
    res.json({ 
        success: true, 
        frames: purchasedFrames[userId] || []
    });
});

// Sync purchased frames for a user
app.post('/api/purchased-frames/:userId/sync', (req, res) => {
    const { userId } = req.params;
    const { frames } = req.body;
    
    console.log(`Frame sync request: ${userId} syncing ${frames ? frames.length : 0} frames`);
    
    if (!purchasedFrames.hasOwnProperty(userId)) {
        purchasedFrames[userId] = [];
    }
    
    // Merge server and client frames (union of both)
    const serverFrames = purchasedFrames[userId] || [];
    const clientFrames = frames || [];
    const mergedFrames = [...new Set([...serverFrames, ...clientFrames])];
    
    purchasedFrames[userId] = mergedFrames;
    savePurchasedFrames(purchasedFrames);
    
    res.json({ 
        success: true, 
        message: `Synced ${mergedFrames.length} frames for ${userId}`,
        frames: mergedFrames
    });
});

// Purchase a frame
app.post('/api/frames/purchase', (req, res) => {
    const { userId, cost, frame } = req.body;
    
    console.log(`Frame purchase request: ${userId} wants to buy ${frame} for ${cost} coins`);
    
    // Validate user exists
    if (!coinData.hasOwnProperty(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user' });
    }
    
    // Check if user has enough coins
    if (coinData[userId] < cost) {
        return res.status(400).json({ success: false, message: 'Insufficient coins' });
    }
    
    // Check if user already owns this frame
    if (purchasedFrames[userId] && purchasedFrames[userId].includes(frame)) {
        return res.status(400).json({ success: false, message: 'Frame already owned' });
    }
    
    // Purchase the frame
    if (!purchasedFrames[userId]) {
        purchasedFrames[userId] = [];
    }
    
    purchasedFrames[userId].push(frame);
    coinData[userId] -= cost;
    
    savePurchasedFrames(purchasedFrames);
    saveAuraData(); // This also saves coin data
    
    console.log(`User ${userId} purchased frame: ${frame} for ${cost} coins`);
    
    res.json({ 
        success: true, 
        message: `Purchased ${frame} for ${cost} coins`,
        newBalance: coinData[userId],
        coinData: coinData,
        purchasedFrames: purchasedFrames
    });
});

// Equip a frame
app.post('/api/frames/equip', (req, res) => {
    const { userId, frame } = req.body;
    
    console.log(`Frame equip request: ${userId} wants to equip ${frame}`);
    
    // Validate user exists
    if (!purchasedFrames.hasOwnProperty(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user' });
    }
    
    // Check if user owns this frame (or if it's 'none' which is free)
    if (frame !== 'none' && (!purchasedFrames[userId] || !purchasedFrames[userId].includes(frame))) {
        return res.status(400).json({ success: false, message: 'Frame not owned' });
    }
    
    // Equip the frame
    equippedFrames[userId] = frame === 'none' ? null : frame;
    saveEquippedFrames(equippedFrames);
    
    console.log(`User ${userId} equipped frame: ${frame}`);
    
    res.json({ 
        success: true, 
        message: `Equipped ${frame}`,
        equippedFrame: frame === 'none' ? null : frame,
        equippedFrames: equippedFrames
    });
});

// Get equipped frame for a user
app.get('/api/equipped-frame/:userId', (req, res) => {
    const { userId } = req.params;
    
    res.json({ 
        success: true, 
        frame: equippedFrames[userId] || null
    });
});

// Admin API endpoint to reset all coins
app.post('/api/coins/admin/reset', (req, res) => {
    const { adminUser } = req.body;
    
    console.log(`Coin reset request received from admin: ${adminUser}`);
    
    // Verify admin access
    if (adminUser !== 'max') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Reset all coins to 0
    Object.keys(coinData).forEach(userId => {
        coinData[userId] = 0;
    });
    
    // Save data after changes
    saveAuraData();
    
    console.log(`Admin ${adminUser} reset all coins to 0`);
    res.json({ success: true, coinData });
});

// Test endpoint for daily reset
app.post('/api/test/daily-reset', (req, res) => {
    console.log(`[${new Date().toISOString()}] Manual daily reset test triggered`);
    
    // Store current state for comparison
    const beforeState = JSON.parse(JSON.stringify(dailyAuraData));
    
    // Force reset by setting yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    Object.keys(dailyAuraData).forEach(userId => {
        dailyAuraData[userId].date = yesterdayString;
        // Set some test data
        Object.keys(dailyAuraData[userId]).forEach(key => {
            if (key !== 'date') {
                dailyAuraData[userId][key] = Math.floor(Math.random() * 200) + 50; // Random test data
            }
        });
    });
    
    console.log('Before reset:', JSON.stringify(beforeState, null, 2));
    
    // Perform the reset
    performDailyReset();
    
    console.log('After reset:', JSON.stringify(dailyAuraData, null, 2));
    
    res.json({ 
        success: true, 
        message: 'Daily reset test completed',
        before: beforeState,
        after: dailyAuraData
    });
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Activity Log API endpoints
app.get('/api/activity-log', (req, res) => {
    try {
        res.json({
            success: true,
            activities: activityLog
        });
    } catch (error) {
        console.error('Error getting activity log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get activity log'
        });
    }
});

app.post('/api/activity-log', (req, res) => {
    try {
        const { activity } = req.body;
        
        if (!activity) {
            return res.status(400).json({
                success: false,
                error: 'Activity data is required'
            });
        }
        
        // Add new activity to the beginning (newest first)
        activityLog.unshift(activity);
        
        // Keep only last 50 activities
        if (activityLog.length > 50) {
            activityLog = activityLog.slice(0, 50);
        }
        
        // Save to file
        saveActivityLog(activityLog);
        
        res.json({
            success: true,
            activities: activityLog
        });
    } catch (error) {
        console.error('Error saving activity log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save activity log'
        });
    }
});

app.delete('/api/activity-log', (req, res) => {
    try {
        activityLog = [];
        saveActivityLog(activityLog);
        
        res.json({
            success: true,
            message: 'Activity log cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing activity log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear activity log'
        });
    }
});

// Data Export/Import API endpoints
app.get('/api/export-data', (req, res) => {
    try {
        const exportData = {
            auraData: auraData,
            dailyAuraData: dailyAuraData,
            coinData: coinData,
            purchasedBackgrounds: purchasedBackgrounds,
            purchasedBadges: purchasedBadges,
            equippedBadges: equippedBadges,
            activityLog: activityLog,
            postsData: loadPostsData(),
            commentsData: loadCommentsData(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        res.json({
            success: true,
            data: exportData
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export data'
        });
    }
});

// Export entire project as zip file (for development/backup)
app.get('/api/export-project', (req, res) => {
    try {
        console.log('Starting project export...');
        
        // Create a zip archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });
        
        // Set the response headers for file download
        res.attachment(`aura-hub-project-${new Date().toISOString().split('T')[0]}.zip`);
        res.setHeader('Content-Type', 'application/zip');
        
        // Pipe the archive to the response
        archive.pipe(res);
        
        // Handle archive errors
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            res.status(500).send({ error: 'Failed to create archive' });
        });
        
        // Add all project files
        const projectDir = __dirname;
        
        // Core project files
        const filesToInclude = [
            'index.html',
            'server-backend.js',
            'server.js',
            'simple-server.js',
            'package.json',
            'package-lock.json',
            'README.md',
            'manifest.json',
            'sw.js',
            'DEPLOYMENT.md',
            'Dockerfile',
            'docker-compose.yml',
            'portainer-stack.yml'
        ];
        
        // Add each core file if it exists
        filesToInclude.forEach(file => {
            const filePath = path.join(projectDir, file);
            if (fs.existsSync(file)) {
                archive.file(filePath, { name: file });
            }
        });
        
        // Add data files (JSON files) - from DATA_DIR for persisted data, fallback to projectDir
        const dataDirToUse = fs.existsSync(DATA_DIR) ? DATA_DIR : projectDir;
        const jsonFiles = fs.readdirSync(dataDirToUse).filter(f => f.endsWith('.json'));
        jsonFiles.forEach(file => {
            archive.file(path.join(dataDirToUse, file), { name: file });
        });
        
        // Add styles directory
        if (fs.existsSync(path.join(projectDir, 'styles'))) {
            archive.directory(path.join(projectDir, 'styles'), 'styles');
        }
        
        // Add scripts directory
        if (fs.existsSync(path.join(projectDir, 'scripts'))) {
            archive.directory(path.join(projectDir, 'scripts'), 'scripts');
        }
        
        // Add assets directory
        if (fs.existsSync(path.join(projectDir, 'assets'))) {
            archive.directory(path.join(projectDir, 'assets'), 'assets');
        }
        
        // Add uploads/shorts directory - from DATA_DIR for persisted videos
        if (fs.existsSync(path.join(dataDirToUse, 'uploads'))) {
            archive.directory(path.join(dataDirToUse, 'uploads'), 'uploads');
        }
        
        // Finalize the archive
        archive.finalize();
        
        console.log('Project export complete');
    } catch (error) {
        console.error('Error exporting project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export project',
            details: error.message
        });
    }
});

app.post('/api/import-data', (req, res) => {
    try {
        const { data } = req.body;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Import data is required'
            });
        }
        
        // Validate required fields
        const requiredFields = ['auraData', 'dailyAuraData', 'coinData'];
        for (const field of requiredFields) {
            if (!data[field]) {
                return res.status(400).json({
                    success: false,
                    error: `Missing required field: ${field}`
                });
            }
        }
        
        // Import data with validation
        if (data.auraData) {
            saveAuraData(data.auraData);
            auraData = data.auraData;
        }
        
        if (data.dailyAuraData) {
            saveDailyAuraData(data.dailyAuraData);
            dailyAuraData = data.dailyAuraData;
        }
        
        if (data.coinData) {
            saveCoinData(data.coinData);
            coinData = data.coinData;
        }
        
        if (data.purchasedBackgrounds) {
            savePurchasedBackgrounds(data.purchasedBackgrounds);
            purchasedBackgrounds = data.purchasedBackgrounds;
        }
        
        if (data.purchasedBadges) {
            savePurchasedBadges(data.purchasedBadges);
            purchasedBadges = data.purchasedBadges;
        }
        
        if (data.equippedBadges) {
            saveEquippedBadges(data.equippedBadges);
            equippedBadges = data.equippedBadges;
        }
        
        if (data.activityLog) {
            saveActivityLog(data.activityLog);
            activityLog = data.activityLog;
        }
        
        if (data.postsData) {
            savePostsData(data.postsData);
        }
        
        if (data.commentsData) {
            saveCommentsData(data.commentsData);
        }
        
        res.json({
            success: true,
            message: 'Data imported successfully',
            importedFields: Object.keys(data)
        });
    } catch (error) {
        console.error('Error importing data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to import data'
        });
    }
});

// Push Notification Setup
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'push-subscriptions.json');

// Generate VAPID keys if not set in environment
let vapidKeys;
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    vapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY
    };
} else {
    // Try to load from file or generate new keys
    const vapidFile = path.join(DATA_DIR, 'vapid-keys.json');
    if (fs.existsSync(vapidFile)) {
        vapidKeys = JSON.parse(fs.readFileSync(vapidFile, 'utf8'));
    } else {
        vapidKeys = webpush.generateVAPIDKeys();
        fs.writeFileSync(vapidFile, JSON.stringify(vapidKeys, null, 2));
        console.log('Generated new VAPID keys and saved to file');
    }
}

// Set VAPID details
webpush.setVapidDetails(
    'mailto:admin@aurahub.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

console.log('VAPID Public Key:', vapidKeys.publicKey);

// Load subscriptions from file
function loadSubscriptions() {
    try {
        if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
            const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading subscriptions:', error);
    }
    return {};
}

// Save subscriptions to file
function saveSubscriptions(subscriptions) {
    try {
        fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
    } catch (error) {
        console.error('Error saving subscriptions:', error);
    }
}

// Push subscriptions storage (keyed by endpoint to prevent duplicates)
let pushSubscriptions = loadSubscriptions();

// Get VAPID public key
app.get('/api/vapid-key', (req, res) => {
    console.log('VAPID key requested');
    res.json({ publicKey: vapidKeys.publicKey });
});

// Get subscription count (for debugging)
app.get('/api/subscriptions/count', (req, res) => {
    const count = Object.keys(pushSubscriptions).length;
    const users = [...new Set(Object.values(pushSubscriptions).map(s => s.userId))];
    console.log(`Subscription count requested: ${count} subscriptions from users: ${users.join(', ')}`);
    res.json({
        count: count,
        users: users,
        subscriptions: Object.values(pushSubscriptions).map(s => ({
            userId: s.userId,
            endpoint: s.subscription.endpoint.substring(0, 50) + '...',
            timestamp: s.timestamp
        }))
    });
});

// Subscribe to push notifications
app.post('/api/subscribe', (req, res) => {
    console.log('POST /api/subscribe received');
    const { subscription, userId } = req.body;
    console.log('Request body:', { userId, hasSubscription: !!subscription, hasEndpoint: !!(subscription && subscription.endpoint) });

    if (!subscription || !subscription.endpoint) {
        console.log('Invalid subscription data received');
        return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Store subscription keyed by endpoint
    pushSubscriptions[subscription.endpoint] = {
        subscription: subscription,
        userId: userId,
        timestamp: new Date().toISOString()
    };

    saveSubscriptions(pushSubscriptions);

    console.log(`✓ User ${userId} subscribed to push notifications. Total subscriptions: ${Object.keys(pushSubscriptions).length}`);
    res.json({ success: true, message: 'Subscribed successfully' });
});

// Unsubscribe from push notifications
app.post('/api/unsubscribe', (req, res) => {
    const { endpoint, userId } = req.body;

    if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint required' });
    }

    if (pushSubscriptions[endpoint]) {
        delete pushSubscriptions[endpoint];
        saveSubscriptions(pushSubscriptions);
        console.log(`User ${userId} unsubscribed from push notifications`);
    }

    res.json({ success: true, message: 'Unsubscribed successfully' });
});

// Send announcement to all subscribers (admin only)
app.post('/api/announce', async (req, res) => {
    console.log('POST /api/announce received');
    const { message, adminUser } = req.body;
    console.log('Request body:', { adminUser, hasMessage: !!message, messageLength: message ? message.length : 0 });

    // Verify admin access
    if (adminUser !== 'max') {
        console.log('Announce rejected: not admin');
        return res.status(403).json({ error: 'Admin access required' });
    }

    if (!message || message.trim() === '') {
        console.log('Announce rejected: empty message');
        return res.status(400).json({ error: 'Message required' });
    }

    const subscriptions = Object.values(pushSubscriptions);
    console.log(`Sending announcement to ${subscriptions.length} subscribers`);

    if (subscriptions.length === 0) {
        console.log('No subscribers to notify');
        return res.json({ success: true, recipients: 0, message: 'No subscribers to notify' });
    }

    const payload = JSON.stringify({
        title: 'Aura Hub Announcement',
        body: message,
        icon: '/assets/icon-192.png',
        badge: '/assets/icon-72.png',
        tag: 'announcement',
        data: {
            type: 'announcement',
            timestamp: new Date().toISOString()
        }
    });

    const results = await Promise.allSettled(
        subscriptions.map(async ({ subscription }) => {
            try {
                await webpush.sendNotification(subscription, payload);
                return { success: true };
            } catch (error) {
                console.error('Error sending notification:', error);
                // Remove invalid subscriptions
                if (error.statusCode === 404 || error.statusCode === 410) {
                    delete pushSubscriptions[subscription.endpoint];
                    saveSubscriptions(pushSubscriptions);
                    console.log('Removed invalid subscription');
                }
                return { success: false, error: error.message };
            }
        })
    );

    const successful = results.filter(r => r.value && r.value.success).length;
    const failed = results.length - successful;

    console.log(`Announcement sent: ${successful} successful, ${failed} failed`);

    res.json({
        success: true,
        recipients: successful,
        failed: failed,
        totalSubscribers: subscriptions.length
    });
});

const PORT = process.env.PORT || 3067;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Create HTTP server
app.listen(PORT, HOST, () => {
    console.log(`Aura Hub HTTP Server running on http://${HOST}:${PORT}`);
    console.log(`Access from other devices on your network using your computer's IP address`);
    console.log(`Note: Running on HTTP - make sure this is acceptable for your use case.`);
});
