const redirectToDashboard = role => {
    const dashboardMap = {
        admin: "admin.html",
        faculty: "faculty.html",
        staff: "staff.html"
    };
    const destination = dashboardMap[role];
    if (destination) {
        window.location.href = destination;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const currentUser = Storage.getCurrentUser();
    const isAuthPage = window.location.pathname.endsWith("login.html") || window.location.pathname.endsWith("signup.html");
    if (currentUser && isAuthPage) {
        redirectToDashboard(currentUser.role);
        return;
    }

    const roleToggles = document.querySelectorAll(".role-toggle");
    roleToggles.forEach(toggle => {
        const inputId = toggle.getAttribute("data-role-input");
        const hiddenInput = inputId ? document.getElementById(inputId) : null;
        if (!hiddenInput) {
            return;
        }
        const buttons = toggle.querySelectorAll(".role-option");

        const setActiveRole = role => {
            buttons.forEach(btn => {
                const isActive = btn.getAttribute("data-role") === role;
                btn.classList.toggle("active", isActive);
                btn.setAttribute("aria-pressed", isActive ? "true" : "false");
            });
            hiddenInput.value = role;
        };

        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                setActiveRole(btn.getAttribute("data-role"));
            });
        });

        if (hiddenInput.value) {
            setActiveRole(hiddenInput.value);
        }
    });

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", event => {
            event.preventDefault();
            const role = document.getElementById("role").value.trim();
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;

            if (!role) {
                alert("Please select your role before logging in.");
                return;
            }

            const users = Storage.getUsers();
            const match = users.find(user => user.username === username && user.password === password && user.role === role);
            if (!match) {
                alert("Invalid credentials. Please verify your role, username, and password.");
                return;
            }
            Storage.saveCurrentUser(match);
            redirectToDashboard(match.role);
        });
    }

    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", event => {
            event.preventDefault();
            const role = document.getElementById("role").value.trim();
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (!role) {
                alert("Please select a role for the new account.");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match. Please try again.");
                return;
            }
            const users = Storage.getUsers();
            if (users.some(user => user.username === username)) {
                alert("That username is already in use. Please choose another one.");
                return;
            }
            const newUser = { username, password, role };
            users.push(newUser);
            Storage.saveUsers(users);
            alert("Account created successfully. You can now log in.");
            window.location.href = "login.html";
        });
    }
});

const checkAuth = requiredRole => {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) {
        window.location.href = "login.html";
        return null;
    }
    if (requiredRole && currentUser.role !== requiredRole) {
        alert("Unauthorized access. Please login with the correct role.");
        Storage.clearCurrentUser();
        window.location.href = "login.html";
        return null;
    }
    return currentUser;
};

const logout = () => {
    Storage.clearCurrentUser();
    window.location.href = "login.html";
};
