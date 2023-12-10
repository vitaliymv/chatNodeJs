const fs = require("fs");
const dbFile = "./chat.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;
const crypto = require("crypto");

dbWrapper.open({
    filename: dbFile,
    driver: sqlite3.Database
}).then(async (dBase) => {
    db = dBase;
    try {
        if (!exists) {
            await db.run(
                `CREATE TABLE user (
                    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    login VARCHAR(40) UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    salt TEXT
                );`
            )

            await db.run(
                `CREATE TABLE message (
                    msg_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    author INTEGER NOT NULL,
                    FOREIGN KEY(author) REFERENCES user(user_id)
                );`
            )
        } else {
            console.log(await db.all("SELECT * FROM user"));
        }
    } catch (error) {
        console.error(error);
    }
})

module.exports = {
    getMessages: async () => {
        try {
            return await db.all(`
            SELECT msg_id, content, login, user_id FROM message
            JOIN user ON message.author = user.user_id
        `)
        } catch (error) {
            console.error(error);
        }
    },
    addMessage: async (msg, userId) => {
        await db.run(`
            INSERT INTO message (content, author) VALUES (?, ?)
        `, [msg, userId]);
    },
    isUserExist: async (login) => {
        const candidate = await db.all("SELECT * FROM user WHERE login = ?", [login]);
        return candidate.length;
    },
    addUser: async (user) => {
        const salt = crypto.randomBytes(16).toString("hex");
        const password = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString("hex");
        await db.run(`
            INSERT INTO user (login, password, salt) VALUES (?, ?, ?)
        `, [user.login, password, salt])
    },
    getAuthToken: async (user) => {
        const candidate = await db.all("SELECT * FROM user WHERE login = ?", [user.login]);
        if (!candidate.length) {
            throw "Wrong input"
        }
        const {user_id, login, password, salt} = candidate[0];
        const hash = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString("hex");
        if (hash != password) {
            throw "Wrong password"
        }

        return user_id + "." + login + "." + crypto.randomBytes(20).toString("hex");
    }
}

