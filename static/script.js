const socket = io({
    auth: {
        cookie: document.cookie
    }     
});
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const logout = document.getElementById("logout");
let myId = document.cookie.split("=")[1].split(".")[0];
let login = document.cookie.split("=")[1].split(".")[1];
logout.addEventListener("click", (e) => {
    document.cookie = "token=; Max-Age=0";
    location.assign("/login");
})

socket.on("all_messages", (msgArray) => {
    msgArray.forEach(msg => {
        getMessage(msg);
    });
})

form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (input.value) {
        socket.emit("new_message", input.value);
        input.value = "";
    }
});

socket.on("message", (msg) => {
    getMessage(msg);
})

function getMessage(msg) {
    let item = document.createElement("li");

    if (msg.user_id == myId) {
        item.classList.add("my");
    }
    item.textContent = msg.login + ": " + msg.content;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}
