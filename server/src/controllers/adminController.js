const User = require('../models/User');
const FileRecord = require('../models/FileRecord');

// @desc    Get System Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getSystemStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const fileCount = await FileRecord.countDocuments();

        // Calculate total size
        const files = await FileRecord.find();
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);

        res.status(200).json({
            success: true,
            data: {
                users: userCount,
                files: fileCount,
                totalSizeBytes: totalSize
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
