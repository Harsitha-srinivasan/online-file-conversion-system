const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DATA_DIR = path.join(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

class MockModel {
    constructor(collectionName, schema) {
        this.collectionName = collectionName;
        this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
        this.schema = schema;
    }

    _readData() {
        if (!fs.existsSync(this.filePath)) return [];
        try {
            return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        } catch (e) {
            return [];
        }
    }

    _writeData(data) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    async create(doc) {
        const data = this._readData();
        const _id = Math.random().toString(36).substr(2, 9);
        const newDoc = { _id, ...doc };

        // Handle defaults from schema (simple implementation)
        if (this.schema && this.schema.obj) {
            for (const [key, val] of Object.entries(this.schema.obj)) {
                if (newDoc[key] === undefined && val.default !== undefined) {
                    newDoc[key] = typeof val.default === 'function' ? val.default() : val.default;
                }
            }
        }

        // Handle Pre-save hooks (specifically password hashing for User)
        if (this.collectionName === 'users' && newDoc.password) {
            // Mocking the bcrypt salt/hash manually since we don't have the middleware hook logic fully replicated
            const salt = await bcrypt.genSalt(10);
            newDoc.password = await bcrypt.hash(newDoc.password, salt);
        }

        data.push(newDoc);
        this._writeData(data);
        return this._instantiate(newDoc);
    }

    find(query = {}) {
        const self = this;
        return {
            sort: function (criteria) {
                this._sort = criteria;
                return this;
            },
            then: async function (resolve, reject) {
                try {
                    const data = self._readData();
                    const filtered = data.filter(item => self._matches(item, query));
                    let result = filtered.map(item => self._instantiate(item));
                    // Handle sort
                    if (this._sort) {
                        const key = Object.keys(this._sort)[0];
                        const order = this._sort[key];
                        result.sort((a, b) => {
                            const valA = a[key] ? new Date(a[key]).getTime() : 0;
                            const valB = b[key] ? new Date(b[key]).getTime() : 0;
                            return order === -1 ? valB - valA : valA - valB;
                        });
                    } else {
                        // Default sort
                        result.sort((a, b) => {
                            const dateA = new Date(a.createdAt || a.uploadDate || 0).getTime();
                            const dateB = new Date(b.createdAt || b.uploadDate || 0).getTime();
                            return dateB - dateA;
                        });
                    }
                    resolve(result);
                } catch (e) { reject(e); }
            }
        };
    }

    findOne(query) {
        const self = this;
        return {
            select: function (fields) {
                return this;
            },
            then: async function (resolve, reject) {
                try {
                    const data = self._readData();
                    const item = data.find(item => self._matches(item, query));
                    resolve(item ? self._instantiate(item) : null);
                } catch (e) { reject(e); }
            }
        };
    }

    async findById(id) {
        const data = this._readData();
        const item = data.find(i => i._id === id);
        return item ? this._instantiate(item) : null;
    }

    async countDocuments() {
        return this._readData().length;
    }

    _matches(item, query) {
        for (let key in query) {
            if (item[key] !== query[key]) return false;
        }
        return true;
    }

    _instantiate(doc) {
        // Return an object with methods
        const instance = { ...doc };
        const self = this;

        // Add save method
        instance.save = async function () {
            const allData = self._readData();
            const index = allData.findIndex(d => d._id === instance._id);
            if (index !== -1) {
                allData[index] = { ...allData[index], ...this }; // update
                self._writeData(allData);
            }
            return this;
        };

        // Add User specific methods
        if (this.collectionName === 'users') {
            instance.matchPassword = async function (enteredPassword) {
                return await bcrypt.compare(enteredPassword, this.password);
            };
            instance.getSignedJwtToken = function () {
                return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
                    expiresIn: '30d'
                });
            };
        }

        return instance;
    }
}

// Mimic Mongoose export
const model = (name, schema) => new MockModel(name.toLowerCase() + 's', schema);
const Schema = class {
    constructor(obj) { this.obj = obj; this.pre = () => { }; this.methods = {}; }
    static Types = { ObjectId: String };
};

module.exports = { model, Schema };
