const http = require("http");
const fs = require("fs");
const path = require("path");
const db = require("./database");
const cookie = require("cookie");

const validateAuthToken = [];

const loginHtmlFile = fs.readFileSync(path.join(__dirname, "static", "login.html"));
const registerHtmlFile = fs.readFileSync(path.join(__dirname, "static", "register.html"));
const indexHtmlFile = fs.readFileSync(path.join(__dirname, "static", "index.html"));
const styleCssFile = fs.readFileSync(path.join(__dirname, "static", "style.css"));
const scriptJsFile = fs.readFileSync(path.join(__dirname, "static", "script.js"));
const authJsFile = fs.readFileSync(path.join(__dirname, "static", "auth.js"));

const server = http.createServer((req, res) => {
    if (req.method == "GET") {
        switch (req.url) {
            case "/style.css": return res.end(styleCssFile);
            case "/register": return res.end(registerHtmlFile);
            case "/login": return res.end(loginHtmlFile);
            case "/auth.js": return res.end(authJsFile);
            default: return guarded(req, res);
        }
    }
    if (req.method == "POST") {
        switch (req.url) {
            case "/api/register": return registerUser(req, res);
            case "/api/login": return login(req, res);
            default: return guarded(req, res);
        }
    }
    return res.end("Error 404")
})

function login(req, res) {
    let data = "";
    req.on("data", (chunk) => {
        data += chunk;
    })
    req.on("end", async () => {
        try {
            const user = JSON.parse(data);
            const token = await db.getAuthToken(user);
            validateAuthToken.push(token);
            res.writeHead(200);
            res.end(JSON.stringify({
                token: token
            }))
        } catch (error) {
            res.writeHead(500);
            return res.end(JSON.stringify({
                error: error
            }));
        }
    })
}

function registerUser(req, res) {
    let data = "";
    req.on("data", (chunk) => {
        data += chunk;
    })
    req.on("end", async () => {
        try {
            const user = JSON.parse(data);
            if (!user.login || !user.password) {
                return res.end(JSON.stringify({
                    error: "Empty login or password"
                }));
            }
            if (await db.isUserExist(user.login)) {
                return res.end(JSON.stringify({
                    error: "User already exist"
                }));
            }
            await db.addUser(user);
            return res.end(JSON.stringify({
                res: "Registration is successful"
            }));
        } catch (error) {
            return res.end(JSON.stringify({
                error: error
            }));
        }
    })
}

function guarded(req, res) {
    const credentials = getCreadentials(req.headers?.cookie);
    if (!credentials) {
        res.writeHead(302, { "Location": "/register" });
    }
    if (req.method == "GET") {
        switch (req.url) {
            case "/": return res.end(indexHtmlFile);
            case "/script.js": return res.end(scriptJsFile);
        }
    }
}

function getCreadentials(c = '') {
    const cookies = cookie.parse(c);
    const token = cookies?.token;

    if (!token || !validateAuthToken.includes(token)) return null;
    const [user_id, login] = token.split(".");
    if (!user_id || !login) return null;
    return { user_id, login }
}

server.listen(3000);

const { Server } = require("socket.io");
const io = new Server(server);

io.use((socket, next) => {
    const cookie = socket.handshake.auth.cookie;
    const credentials = getCreadentials(cookie);
    if (!credentials) {
        next(new Error("No auth"));
    }
    socket.credentials = credentials;
    next();
})

io.on("connection", async (socket) => {
    console.log("User connected with id: " + socket.id);
    let username = socket.credentials?.login;
    let user_id = socket.credentials?.user_id;
    let messages = await db.getMessages();

    socket.emit("all_messages", messages);

    socket.on("new_message", (message) => {
        let obj = { 
            login: username, 
            content: message, 
            userId: user_id 
        }

        db.addMessage(message, user_id);
        io.emit("message", obj);
    })
})