if (typeof DASHBOARD_ROLE === "undefined") {
    throw new Error("Dashboard role not defined");
}

const currentUser = checkAuth(DASHBOARD_ROLE);
if (!currentUser) {
    throw new Error("Unauthorized");
}

document.getElementById("userName").textContent = currentUser.username;
document.getElementById("logoutBtn").addEventListener("click", () => logout());

const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".content-section");
navItems.forEach(item => {
    item.addEventListener("click", event => {
        event.preventDefault();
        navItems.forEach(nav => nav.classList.remove("active"));
        sections.forEach(section => section.classList.remove("active"));
        item.classList.add("active");
        const sectionId = `${item.dataset.section}Section`;
        document.getElementById(sectionId).classList.add("active");
        refreshRoleUI();
    });
});

const requestModal = document.getElementById("requestModal");
const requestForm = document.getElementById("requestForm");
const itemField = document.getElementById("requestItem");
const quantityField = document.getElementById("requestQuantity");
const reasonField = document.getElementById("requestReason");

const escapeHtml = value => {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

const escapeAttribute = value => escapeHtml(value);

const formatCurrency = value => {
    const amount = Number(value) || 0;
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const openRequestButtons = document.querySelectorAll("#openRequest");
openRequestButtons.forEach(btn => btn.addEventListener("click", () => openRequestModal("")));

document.getElementById("closeRequestModal").addEventListener("click", () => closeRequestModal());
document.getElementById("cancelRequest").addEventListener("click", () => closeRequestModal());

requestModal.addEventListener("click", event => {
    if (event.target === requestModal) {
        closeRequestModal();
    }
});

const openRequestModal = presetName => {
    itemField.value = presetName;
    requestModal.classList.add("show");
    itemField.focus();
};

const closeRequestModal = () => {
    requestModal.classList.remove("show");
    requestForm.reset();
};

requestForm.addEventListener("submit", event => {
    event.preventDefault();
    const itemName = itemField.value.trim();
    const quantity = Number(quantityField.value);
    const reason = reasonField.value.trim();
    if (!itemName || !reason || quantity < 1) {
        alert("Please provide item name, quantity, and reason.");
        return;
    }
    const stock = Storage.getStock();
    const match = stock.find(entry => entry.name.toLowerCase() === itemName.toLowerCase());
    let stockState = "available";
    let notificationMessage = `${currentUser.username} (${currentUser.role}) requested ${quantity} unit(s) of ${itemName}. Reason: ${reason}.`;
    if (!match) {
        stockState = "missing";
        notificationMessage = `${currentUser.username} (${currentUser.role}) requested ${quantity} unit(s) of ${itemName}, but that item is not currently in stock. Reason: ${reason}.`;
    } else if (match.quantity < quantity) {
        stockState = "insufficient";
        notificationMessage = `${currentUser.username} (${currentUser.role}) requested ${quantity} unit(s) of ${itemName}, but only ${match.quantity} are available. Reason: ${reason}.`;
    }
    Storage.addRequest({
        username: currentUser.username,
        userRole: currentUser.role,
        itemName,
        quantity,
        reason,
        stockState
    });
    Storage.addNotification({
        title: "New Stock Request",
        message: notificationMessage,
        type: stockState === "available" ? "info" : "warning"
    });
    alert("Request submitted successfully. The admin has been notified.");
    closeRequestModal();
    renderMyRequests();
});

const stockTableBody = document.getElementById("stockTableBody");
stockTableBody.addEventListener("click", event => {
    const requestBtn = event.target.closest("button[data-request]");
    if (!requestBtn) {
        return;
    }
    openRequestModal(requestBtn.dataset.request);
});

const renderStock = () => {
    const stock = Storage.getStock();
    if (!stock.length) {
        stockTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No stock items available yet. Use the request button to notify the admin.</td></tr>';
        return;
    }
    const sorted = [...stock].sort((a, b) => a.name.localeCompare(b.name));
    stockTableBody.innerHTML = sorted
        .map(item => {
            const isAvailable = item.quantity > 0;
            const quantityText = isAvailable ? `${item.quantity}` : '<span style="color:#f05c5c;font-weight:600;">Out of stock</span>';
            const unitCost = item.unitCost !== undefined ? item.unitCost : 0;
            const totalBudget = unitCost * (item.quantity || 0);
            return `
                <tr>
                    <td><strong>${escapeHtml(item.name)}</strong></td>
                    <td>${quantityText}</td>
                    <td>${formatCurrency(unitCost)}</td>
                    <td>${formatCurrency(totalBudget)}</td>
                    <td>${escapeHtml(item.description)}</td>
                    <td><button class="btn btn-light" type="button" data-request="${escapeAttribute(item.name)}">Request</button></td>
                </tr>
            `;
        })
        .join("");
};

const myRequestsList = document.getElementById("myRequestsList");
const renderMyRequests = () => {
    const requests = Storage.getRequests().filter(req => req.username === currentUser.username);
    if (!requests.length) {
        myRequestsList.innerHTML = '<div class="empty-state">You have not submitted any requests yet.</div>';
        return;
    }
    const sorted = [...requests].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    myRequestsList.innerHTML = sorted
        .map(req => {
            const statusClass = req.status;
            const badge = req.stockState && req.stockState !== "available" && req.status === "pending"
                ? '<span class="card-badge">Awaiting restock</span>'
                : "";
            return `
                <article class="request-card ${statusClass}">
                    <div class="card-header">
                        <div class="card-title">${escapeHtml(req.itemName)}</div>
                        <span class="card-status ${statusClass}">${req.status.toUpperCase()}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Quantity:</strong> ${req.quantity}</p>
                        <p><strong>Reason:</strong> ${escapeHtml(req.reason)}</p>
                        ${badge}
                    </div>
                    <div class="card-footer">
                        <span>Requested on ${escapeHtml(req.createdAt)}</span>
                        ${req.resolvedAt ? `<span>Updated on ${escapeHtml(req.resolvedAt)}</span>` : ""}
                    </div>
                </article>
            `;
        })
        .join("");
};

const refreshRoleUI = () => {
    renderStock();
    renderMyRequests();
};

refreshRoleUI();
setInterval(refreshRoleUI, 5000);
