async function registerUser(event) {
  event.preventDefault();

  const data = {
    name: document.getElementById("name").value,
    username: document.getElementById("username").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value
  };

  const response = await fetch("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json().catch(() => ({}));

  document.getElementById("message").innerText =
    result.message || "Registration completed";

  if (response.ok) {
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1000);
  }
}

async function loginUser(event, isAdminLogin = false) {
  event.preventDefault();

  const data = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value
  };

  const response = await fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    document.getElementById("message").innerText = "Invalid credentials";
    return;
  }

  localStorage.setItem("token", result.token);
  localStorage.setItem("username", result.username);
  localStorage.setItem("role", result.role);

  if (result.role === "ADMIN") {
    window.location.href = "/admin-home.html";
  } else {
    window.location.href = "/customer-home.html";
  }
}

async function sendPasswordResetOtp(event) {
  event.preventDefault();

  const username = document.getElementById("resetUsername").value.trim();
  const response = await fetch("/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username })
  });

  const result = await response.json().catch(() => ({}));
  document.getElementById("message").innerText =
    result.message || (response.ok ? "OTP sent successfully" : "Unable to send OTP");

  if (response.ok) {
    document.getElementById("forgotPasswordForm").style.display = "none";
    document.getElementById("resetPasswordForm").style.display = "block";
  }
}

async function resetPassword(event) {
  event.preventDefault();

  const data = {
    username: document.getElementById("resetUsername").value.trim(),
    otp: document.getElementById("otp").value.trim(),
    newPassword: document.getElementById("newPassword").value.trim()
  };

  const response = await fetch("/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json().catch(() => ({}));
  document.getElementById("message").innerText =
    result.message || (response.ok ? "Password reset successfully" : "Unable to reset password");

  if (response.ok) {
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const resetPasswordForm = document.getElementById("resetPasswordForm");

  if (signupForm) {
    signupForm.addEventListener("submit", registerUser);
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => loginUser(e, false));
  }

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", (e) => loginUser(e, true));
  }

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", sendPasswordResetOtp);
  }

  if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", resetPassword);
  }
});
