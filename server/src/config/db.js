const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;

        // If no persistent MongoDB, use memory server
        if (process.env.NODE_ENV === 'development') {
            try {
                // Try connecting to URI first
                await mongoose.connect(uri, {
                    serverSelectionTimeoutMS: 2000,
                    family: 4
                });
                console.log(`Real MongoDB Connected`);
            } catch (uriErr) {
                console.log('Local MongoDB not found, starting MongoMemoryServer...');
                const mongod = await MongoMemoryServer.create();
                uri = mongod.getUri();
                await mongoose.connect(uri);
                console.log(`Memory MongoDB Connected: ${uri}`);
            }
        } else {
            const conn = await mongoose.connect(uri);
            console.log(`MongoDB Connected: ${conn.connection.host}`);
        }
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
