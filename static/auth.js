const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const span = document.getElementById("response");

registerForm?.addEventListener("submit", (event) => {
    span.innerHTML = null;
    event.preventDefault();
    const {login, password, passwordRepeat} = registerForm;
    if (password.value != passwordRepeat.value) {
        span.style.color = "red";
        return span.innerHTML = "Password not match";
    }

    const user = JSON.stringify({
        login: login.value,
        password: password.value
    })
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/register");
    xhr.send(user);
    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.response.error) {
            span.style.color = "red";
            span.innerHTML = xhr.response.error;
        } else {
            span.style.color = "lime";
            span.innerHTML = xhr.response.res;
            setTimeout(() => {
                window.open("/login", "_self");
            }, 1000);
        }
    }
})

loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const {login, password} = loginForm;
    const user = JSON.stringify({
        login: login.value,
        password: password.value
    });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/login");
    xhr.send(user);
    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.status == 200) {
            const token = xhr.response.token;
            document.cookie = `token=${token}`;
            window.location.assign("/");
        } else {
            span.style.color = "red";
            span.innerHTML = xhr.response.error;
        }
    }
})