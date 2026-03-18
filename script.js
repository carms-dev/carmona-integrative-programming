// ==================== HELPER FUNCTIONS ====================
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

// ==================== AUTHENTICATION ====================
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
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("user", JSON.stringify(newUser));
  localStorage.setItem("isLoggedIn", "true");

  showNotification("Account created successfully!", "success");

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
    showNotification("Invalid email or password", "error");
    return;
  }

  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("isLoggedIn", "true");

  showNotification("Login successful!", "success");

  if (user.role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "profile.html";
  }
}

function logout() {
  localStorage.setItem("isLoggedIn", "false");
  showNotification("Logged out successfully", "info");
  window.location.href = "login.html";
}

// ==================== PROFILE PAGE ====================
function loadProfile() {
  protectPage();

  const user = getUser();

  document.getElementById("profile-name").textContent = user.name;
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("profile-address").textContent =
    user.address || "Not set";

  // Update role badge
  const roleBadge = document.getElementById("profile-role-badge");
  if (roleBadge) {
    roleBadge.className = `role-badge ${user.role}`;
    roleBadge.innerHTML = user.role === "admin" ? "👑 Admin" : "👤 User";
  }

  // Update avatar with consistent seed
  const avatar = document.getElementById("profile-avatar");
  if (avatar) {
    avatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
  }

  // Update member since
  const joinedElement = document.getElementById("profile-joined");
  if (joinedElement) {
    joinedElement.textContent = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (user.role === "admin") {
    const adminBtn = document.getElementById("adminBtn");
    if (adminBtn) {
      adminBtn.style.display = "inline-flex";
      adminBtn.onclick = () => {
        window.location.href = "admin.html";
      };
    }
  }
}

// ==================== SETTINGS PAGE ====================
function loadSettings() {
  protectPage();

  const user = getUser();

  document.getElementById("set-name").value = user.name;
  document.getElementById("set-email").value = user.email;
  document.getElementById("set-address").value = user.address || "";
}

function saveSettings(e) {
  e.preventDefault();

  const user = getUser();

  user.name = document.getElementById("set-name").value;
  user.email = document.getElementById("set-email").value;
  user.address = document.getElementById("set-address").value;

  // Update in users array too
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const userIndex = users.findIndex((u) => u.email === user.email);
  if (userIndex !== -1) {
    users[userIndex] = { ...user };
    localStorage.setItem("users", JSON.stringify(users));
  }

  localStorage.setItem("user", JSON.stringify(user));

  showNotification("Profile updated successfully!", "success");
  window.location.href = "profile.html";
}

function changePassword(e) {
  e.preventDefault();

  const user = getUser();

  const current = document.getElementById("current-password").value;
  const newPass = document.getElementById("new-password").value;
  const confirm = document.getElementById("confirm-password").value;

  if (current !== user.password) {
    showNotification("Current password incorrect", "error");
    return;
  }

  if (newPass !== confirm) {
    showNotification("New passwords do not match", "error");
    return;
  }

  if (newPass.length < 6) {
    showNotification("Password must be at least 6 characters", "error");
    return;
  }

  user.password = newPass;

  // Update in users array too
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const userIndex = users.findIndex((u) => u.email === user.email);
  if (userIndex !== -1) {
    users[userIndex].password = newPass;
    localStorage.setItem("users", JSON.stringify(users));
  }

  localStorage.setItem("user", JSON.stringify(user));

  showNotification("Password updated successfully!", "success");

  // Clear password fields
  document.getElementById("current-password").value = "";
  document.getElementById("new-password").value = "";
  document.getElementById("confirm-password").value = "";
}

// ==================== ADMIN PAGE ====================
function loadAdmin() {
  protectPage();

  const user = getUser();

  if (user.role !== "admin") {
    showNotification("Access denied", "error");
    window.location.href = "profile.html";
    return;
  }

  // Update admin name
  const adminNameElement = document.getElementById("admin-name");
  if (adminNameElement) {
    adminNameElement.textContent = user.name.split(" ")[0];
  }

  // Update stats
  updateAdminStats();

  // Update current date
  const dateElement = document.getElementById("current-date");
  if (dateElement) {
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

function updateAdminStats() {
  let users = JSON.parse(localStorage.getItem("users")) || [];

  const totalUsers = document.getElementById("total-users");
  const totalAdmins = document.getElementById("total-admins");

  if (totalUsers) {
    totalUsers.textContent = users.length;
  }

  if (totalAdmins) {
    const adminCount = users.filter((u) => u.role === "admin").length;
    totalAdmins.textContent = adminCount;
  }
}

// ==================== USER MANAGEMENT ====================
function loadUsers() {
  const table = document.getElementById("userTable");
  const statsDiv = document.getElementById("userStats");

  let users = JSON.parse(localStorage.getItem("users")) || [];

  table.innerHTML = "";

  if (users.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="5" class="empty-table">
          <i class="fas fa-users-slash"></i>
          <p>No users found</p>
        </td>
      </tr>
    `;
  } else {
    users.forEach((user, index) => {
      const roleIcon = user.role === "admin" ? "👑" : "👤";
      const roleClass =
        user.role === "admin" ? "role-badge admin" : "role-badge user";

      table.innerHTML += `
      <tr class="user-row">
        <td><span class="user-id">#${index + 1}</span></td>
        <td>
          <div class="user-info">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}" 
                 alt="Avatar" 
                 class="user-avatar"
                 onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
            <span>${user.name}</span>
          </div>
        </td>
        <td>${user.email}</td>
        <td><span class="${roleClass}">${roleIcon} ${user.role}</span></td>
        <td>
          <button onclick="editUser(${index})" class="action-btn edit-btn" title="Edit User">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteUser(${index})" class="action-btn delete-btn" title="Delete User">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
      `;
    });
  }

  // Update stats
  if (statsDiv) {
    const adminCount = users.filter((u) => u.role === "admin").length;
    const userCount = users.filter((u) => u.role === "user").length;

    statsDiv.innerHTML = `
      <div class="stat-item">
        <i class="fas fa-users"></i>
        <span>Total: ${users.length}</span>
      </div>
      <div class="stat-item">
        <i class="fas fa-crown"></i>
        <span>Admins: ${adminCount}</span>
      </div>
      <div class="stat-item">
        <i class="fas fa-user"></i>
        <span>Users: ${userCount}</span>
      </div>
    `;
  }
}

function addUser(e) {
  e.preventDefault();

  const name = document.getElementById("new-name").value.trim();
  const email = document.getElementById("new-email").value.trim();
  const password = document.getElementById("new-password").value;
  const role = document.getElementById("new-role").value;

  // Validation
  if (name.length < 2) {
    showNotification("Name must be at least 2 characters", "error");
    return;
  }

  if (password.length < 6) {
    showNotification("Password must be at least 6 characters", "error");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users")) || [];

  // Check for duplicate email
  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    showNotification("Email already exists", "error");
    return;
  }

  const newUser = {
    name,
    email,
    password,
    role,
    address: "Not set",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  localStorage.setItem("users", JSON.stringify(users));

  // Clear form
  document.getElementById("new-name").value = "";
  document.getElementById("new-email").value = "";
  document.getElementById("new-password").value = "";
  document.getElementById("new-role").value = "user";

  showNotification("User added successfully!", "success");
  loadUsers();
}

function deleteUser(index) {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = getUser();
  const userToDelete = users[index];

  // Prevent admin from deleting themselves
  if (currentUser.email === userToDelete.email) {
    showNotification("You cannot delete your own account", "error");
    return;
  }

  if (confirm(`Are you sure you want to delete ${userToDelete.name}?`)) {
    users.splice(index, 1);
    localStorage.setItem("users", JSON.stringify(users));
    showNotification("User deleted successfully!", "success");
    loadUsers();
    updateAdminStats();
  }
}

function editUser(index) {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users[index];

  // Populate the form with user data
  document.getElementById("new-name").value = user.name;
  document.getElementById("new-email").value = user.email;
  document.getElementById("new-password").value = "";
  document.getElementById("new-role").value = user.role;

  // Change the form to update mode
  const form = document.querySelector(".settings-form");
  const submitBtn = form.querySelector("button");
  submitBtn.innerHTML = '<i class="fas fa-save"></i> Update User';

  // Store the index being edited
  form.dataset.editIndex = index;

  // Change form submit handler temporarily
  form.onsubmit = function (e) {
    e.preventDefault();
    updateUser(index);
  };

  // Scroll to form
  form.scrollIntoView({ behavior: "smooth" });
}

function updateUser(index) {
  const name = document.getElementById("new-name").value.trim();
  const email = document.getElementById("new-email").value.trim();
  const password = document.getElementById("new-password").value;
  const role = document.getElementById("new-role").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];

  // Update user
  users[index].name = name;
  users[index].email = email;
  users[index].role = role;

  if (password) {
    if (password.length < 6) {
      showNotification("Password must be at least 6 characters", "error");
      return;
    }
    users[index].password = password;
  }

  localStorage.setItem("users", JSON.stringify(users));

  // If updating current user, update the stored user too
  const currentUser = getUser();
  if (currentUser.email === users[index].email) {
    localStorage.setItem("user", JSON.stringify(users[index]));
  }

  // Reset form
  document.getElementById("new-name").value = "";
  document.getElementById("new-email").value = "";
  document.getElementById("new-password").value = "";
  document.getElementById("new-role").value = "user";

  const form = document.querySelector(".settings-form");
  const submitBtn = form.querySelector("button");
  submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Create User';
  form.onsubmit = function (e) {
    e.preventDefault();
    addUser(e);
  };
  delete form.dataset.editIndex;

  showNotification("User updated successfully!", "success");
  loadUsers();
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = "info") {
  // Remove existing notification
  const existingNotif = document.querySelector(".notification");
  if (existingNotif) {
    existingNotif.remove();
  }

  // Create notification
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;

  let icon = "fa-info-circle";
  if (type === "success") icon = "fa-check-circle";
  if (type === "error") icon = "fa-exclamation-circle";

  notification.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease forwards";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
