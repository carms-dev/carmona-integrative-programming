function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function protectPage() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}

function signup(e) {
  e.preventDefault();

  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;

  if (password !== confirm) {
    alert("Passwords do not match");
    return;
  }

  localStorage.setItem(
    "user",
    JSON.stringify({ name, email, password, address: "Not set" }),
  );
  localStorage.setItem("isLoggedIn", "true");
  window.location.href = "profile.html";
}

function login(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const user = getUser();

  if (!user || user.email !== email || user.password !== password) {
    alert("Invalid credentials");
    return;
  }

  localStorage.setItem("isLoggedIn", "true");
  window.location.href = "profile.html";
}

function loadProfile() {
  protectPage();
  const user = getUser();

  document.getElementById("profile-name").textContent = user.name;
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("profile-address").textContent = user.address;
}

function saveSettings(e) {
  e.preventDefault();
  const user = getUser();

  user.email = document.getElementById("set-email").value;
  user.address = document.getElementById("set-address").value;
  const newPass = document.getElementById("set-password").value;
  if (newPass) user.password = newPass;

  localStorage.setItem("user", JSON.stringify(user));
  alert("Profile updated");
  window.location.href = "profile.html";
}

function logout() {
  localStorage.setItem("isLoggedIn", "false");
  window.location.href = "login.html";
}
