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
  const role = document.getElementById("signup-role").value;

  if (password !== confirm) {
    alert("Passwords do not match");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users")) || [];

  // check duplicate email
  const exists = users.find((user) => user.email === email);

  if (exists) {
    alert("Email already registered");
    return;
  }

  const newUser = {
    name,
    email,
    password,
    role,
    address: "Not set",
  };

  users.push(newUser);

  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("user", JSON.stringify(newUser));
  localStorage.setItem("isLoggedIn", "true");

  alert("Account created successfully");

  if (role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "profile.html";
  }
}

function login(e) {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    alert("Invalid email or password");
    return;
  }

  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("isLoggedIn", "true");

  if (user.role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "profile.html";
  }
}

function loadProfile() {
  protectPage();

  const user = getUser();

  document.getElementById("profile-name").textContent = user.name;
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("profile-address").textContent = user.address;

  if (user.role === "admin") {
    const adminBtn = document.getElementById("adminBtn");
    adminBtn.style.display = "inline-block";
    adminBtn.onclick = () => {
      window.location.href = "admin.html";
    };
  }
}

function loadSettings() {
  protectPage();

  const user = getUser();

  document.getElementById("set-name").value = user.name;
  document.getElementById("set-email").value = user.email;
  document.getElementById("set-address").value = user.address;
}

function saveSettings(e) {
  e.preventDefault();

  const user = getUser();

  user.name = document.getElementById("set-name").value;
  user.email = document.getElementById("set-email").value;
  user.address = document.getElementById("set-address").value;

  localStorage.setItem("user", JSON.stringify(user));

  alert("Profile updated successfully");

  window.location.href = "profile.html";
}

function changePassword(e) {
  e.preventDefault();

  const user = getUser();

  const current = document.getElementById("current-password").value;
  const newPass = document.getElementById("new-password").value;
  const confirm = document.getElementById("confirm-password").value;

  if (current !== user.password) {
    alert("Current password incorrect");
    return;
  }

  if (newPass !== confirm) {
    alert("Passwords do not match");
    return;
  }

  user.password = newPass;

  localStorage.setItem("user", JSON.stringify(user));

  alert("Password updated");
}

function logout() {
  localStorage.setItem("isLoggedIn", "false");
  window.location.href = "login.html";
}

// ADMIN PAGE PROTECTION
function loadAdmin() {
  protectPage();

  const user = getUser();

  if (user.role !== "admin") {
    alert("Access denied");
    window.location.href = "profile.html";
  }
}

// LOAD USERS TABLE
function loadUsers() {
  const table = document.getElementById("userTable");

  let users = JSON.parse(localStorage.getItem("users")) || [];

  table.innerHTML = "";

  users.forEach((user, index) => {
    table.innerHTML += `
    <tr>
      <td>${index + 1}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>
        <button onclick="deleteUser(${index})" class="nav-btn">
        Delete
        </button>
      </td>
    </tr>
    `;
  });
}

// ADD USER
function addUser(e) {
  e.preventDefault();

  const name = document.getElementById("new-name").value;
  const email = document.getElementById("new-email").value;
  const password = document.getElementById("new-password").value;
  const role = document.getElementById("new-role").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];

  users.push({ name, email, password, role });

  localStorage.setItem("users", JSON.stringify(users));

  alert("User added successfully");

  window.location.href = "manage-users.html";
}

// DELETE USER
function deleteUser(index) {
  let users = JSON.parse(localStorage.getItem("users")) || [];

  users.splice(index, 1);

  localStorage.setItem("users", JSON.stringify(users));

  loadUsers();
}
