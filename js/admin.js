const adminUser = checkAuth("admin");
if (!adminUser) {
    throw new Error("Unauthorized");
}

document.getElementById("adminName").textContent = adminUser.username;
document.getElementById("logoutBtn").addEventListener("click", () => logout());

const totalBudgetValue = document.getElementById("totalBudgetValue");
const totalSpentValue = document.getElementById("totalSpentValue");
const remainingBudgetValue = document.getElementById("remainingBudgetValue");
const remainingBudgetCard = document.querySelector(".budget-card.remaining");
const budgetForm = document.getElementById("budgetForm");
const budgetAmountInput = document.getElementById("budgetAmount");

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
        refreshUI();
    });
});

const markAllReadBtn = document.getElementById("markAllRead");
if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", () => {
        if (!Storage.getNotifications().length) {
            alert("There are no notifications to mark as read.");
            return;
        }
        Storage.markAllNotificationsRead();
        renderNotifications();
    });
}

const clearNotificationsBtn = document.getElementById("clearNotifications");
if (clearNotificationsBtn) {
    clearNotificationsBtn.addEventListener("click", () => {
        if (!Storage.getNotifications().length) {
            alert("There are no notifications to clear.");
            return;
        }
        if (confirm("Clear all notifications? This action cannot be undone.")) {
            Storage.clearNotifications();
            renderNotifications();
        }
    });
}

const clearRequestsBtn = document.getElementById("clearRequests");
if (clearRequestsBtn) {
    clearRequestsBtn.addEventListener("click", () => {
        if (!Storage.getRequests().length) {
            alert("There are no requests to clear.");
            return;
        }
        if (confirm("Clear all requests? This action cannot be undone.")) {
            Storage.clearRequests();
            renderRequests();
        }
    });
}

/* Stock Modal Logic */
const stockModal = document.getElementById("stockModal");
const openModalBtn = document.getElementById("addStockBtn");
const closeModalBtn = document.getElementById("closeModal");
const cancelModalBtn = document.getElementById("cancelModal");
const stockForm = document.getElementById("stockForm");
const editItemIdField = document.getElementById("editItemId");
const itemBudgetField = document.getElementById("itemBudget");

const openModal = (item = null) => {
    if (item) {
        document.getElementById("modalTitle").textContent = "Edit Stock Item";
        document.getElementById("itemName").value = item.name;
        document.getElementById("itemQuantity").value = item.quantity;
        itemBudgetField.value = item.unitCost !== undefined ? item.unitCost : "";
        document.getElementById("itemDescription").value = item.description;
        editItemIdField.value = item.id;
    } else {
        document.getElementById("modalTitle").textContent = "Add Stock Item";
        stockForm.reset();
        editItemIdField.value = "";
    }
    stockModal.classList.add("show");
};

const closeModal = () => {
    stockModal.classList.remove("show");
};

openModalBtn.addEventListener("click", () => openModal());
closeModalBtn.addEventListener("click", closeModal);
cancelModalBtn.addEventListener("click", closeModal);

stockModal.addEventListener("click", event => {
    if (event.target === stockModal) {
        closeModal();
    }
});

stockForm.addEventListener("submit", event => {
    event.preventDefault();
    const payload = {
        name: document.getElementById("itemName").value.trim(),
        quantity: Number(document.getElementById("itemQuantity").value),
        unitCost: Number(itemBudgetField.value),
        description: document.getElementById("itemDescription").value.trim()
    };

    if (!payload.name) {
        alert("Item name is required.");
        return;
    }
    if (Number.isNaN(payload.quantity) || payload.quantity < 0) {
        alert("Quantity must be zero or a positive number.");
        return;
    }
    if (Number.isNaN(payload.unitCost) || payload.unitCost < 0) {
        alert("Budget per unit must be zero or a positive number.");
        return;
    }

    const editId = editItemIdField.value;
    const nextTotal = (payload.unitCost || 0) * (payload.quantity || 0);
    let delta = nextTotal;
    let existingItem = null;

    if (editId) {
        existingItem = Storage.getStock().find(item => item.id === Number(editId));
        if (!existingItem) {
            alert("The item you are trying to edit no longer exists.");
            closeModal();
            renderStock();
            renderBudgetSummary();
            return;
        }
        const currentTotal = (existingItem.unitCost || 0) * (existingItem.quantity || 0);
        delta = nextTotal - currentTotal;
    }

    const remainingBefore = Storage.getRemainingBudget();
    if (delta > 0 && delta > remainingBefore) {
        alert(`Insufficient remaining budget. Available balance is ${formatCurrency(remainingBefore)}.`);
        return;
    }

    if (!Storage.applyBudgetDelta(delta)) {
        alert("Unable to update the budget allocation. Please try again.");
        return;
    }

    if (editId) {
        const updated = Storage.updateStockItem(Number(editId), payload);
        if (!updated) {
            Storage.applyBudgetDelta(-delta);
            alert("Unable to update this stock item. Please refresh and try again.");
            renderStock();
            renderBudgetSummary();
            return;
        }
    } else {
        Storage.addStockItem(payload);
    }

    closeModal();
    renderStock();
    renderBudgetSummary();
});

const stockTableBody = document.getElementById("stockTableBody");
stockTableBody.addEventListener("click", event => {
    const actionBtn = event.target.closest("button[data-action]");
    if (!actionBtn) {
        return;
    }
    const id = Number(actionBtn.dataset.id);
    const stockItem = Storage.getStock().find(item => item.id === id);
    if (actionBtn.dataset.action === "edit") {
        if (stockItem) {
            openModal(stockItem);
        }
        return;
    }
    if (actionBtn.dataset.action === "delete") {
        if (!stockItem) {
            alert("This stock item is no longer available.");
            renderStock();
            renderBudgetSummary();
            return;
        }
        if (confirm("Delete this stock item?")) {
            const totalCost = (stockItem.unitCost || 0) * (stockItem.quantity || 0);
            Storage.applyBudgetDelta(-totalCost);
            Storage.deleteStockItem(id);
            renderStock();
            renderBudgetSummary();
        }
    }
});

const requestsList = document.getElementById("requestsList");
requestsList.addEventListener("click", event => {
    const actionBtn = event.target.closest("button[data-request-action]");
    if (!actionBtn) {
        return;
    }
    const id = Number(actionBtn.dataset.id);
    if (actionBtn.dataset.requestAction === "approve") {
        approveRequest(id);
    }
    if (actionBtn.dataset.requestAction === "reject") {
        rejectRequest(id);
    }
});

const notificationsList = document.getElementById("notificationsList");
notificationsList.addEventListener("click", event => {
    const markBtn = event.target.closest("button[data-notification]");
    if (!markBtn) {
        return;
    }
    Storage.markNotificationRead(Number(markBtn.dataset.notification));
    renderNotifications();
});

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

const formatCurrency = value => {
    const amount = Number(value) || 0;
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const renderBudgetSummary = () => {
    if (!totalBudgetValue || !totalSpentValue || !remainingBudgetValue) {
        return;
    }
    const budget = Storage.getBudget();
    const remaining = Storage.getRemainingBudget();
    totalBudgetValue.textContent = formatCurrency(budget.totalBudget);
    totalSpentValue.textContent = formatCurrency(budget.totalSpent);
    remainingBudgetValue.textContent = formatCurrency(remaining);
    remainingBudgetValue.style.color = remaining <= 0 ? "#f05c5c" : "#2f3765";
    if (remainingBudgetCard) {
        remainingBudgetCard.style.borderLeftColor = remaining <= 0 ? "#f05c5c" : "#25b66c";
    }
    if (budgetAmountInput && document.activeElement !== budgetAmountInput) {
        budgetAmountInput.value = budget.totalBudget || 0;
    }
};

if (budgetForm) {
    budgetForm.addEventListener("submit", event => {
        event.preventDefault();
        if (!budgetAmountInput) {
            return;
        }
        const proposed = Number(budgetAmountInput.value);
        if (Number.isNaN(proposed) || proposed < 0) {
            alert("Enter a valid, non-negative budget amount.");
            return;
        }
        if (!Storage.setTotalBudget(proposed)) {
            alert("Budget cannot be lower than the amount already spent. Increase the value and try again.");
            budgetAmountInput.value = Storage.getBudget().totalBudget || 0;
            return;
        }
        renderBudgetSummary();
    });
}

const renderStock = () => {
    const stock = Storage.getStock();
    if (!stock.length) {
        stockTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No stock found. Add your first item to get started.</td></tr>';
        return;
    }
    const sorted = [...stock].sort((a, b) => a.name.localeCompare(b.name));
    stockTableBody.innerHTML = sorted
        .map(item => {
            const quantityText = item.quantity > 0 ? `${item.quantity}` : '<span style="color:#f05c5c;font-weight:600;">Out of stock</span>';
            const unitCost = item.unitCost !== undefined ? item.unitCost : 0;
            const totalBudget = unitCost * (item.quantity || 0);
            return `
                <tr>
                    <td><strong>${escapeHtml(item.name)}</strong></td>
                    <td>${quantityText}</td>
                    <td>${formatCurrency(unitCost)}</td>
                    <td>${formatCurrency(totalBudget)}</td>
                    <td>${escapeHtml(item.description)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-light" type="button" data-action="edit" data-id="${item.id}">Edit</button>
                            <button class="btn btn-danger" type="button" data-action="delete" data-id="${item.id}">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");
};

const renderRequests = () => {
    const requests = Storage.getRequests();
    if (!requests.length) {
        requestsList.innerHTML = '<div class="empty-state">No requests yet. Faculty and staff requests will appear here.</div>';
        updateRequestBadge(0);
        return;
    }
    const ordered = [...requests].sort((a, b) => {
        if (a.status === b.status) {
            return (b.createdAt || "").localeCompare(a.createdAt || "");
        }
        return a.status === "pending" ? -1 : 1;
    });
    const pendingCount = ordered.filter(req => req.status === "pending").length;
    updateRequestBadge(pendingCount);
    requestsList.innerHTML = ordered
        .map(req => {
            const statusClass = req.status;
            const needsAttention = req.stockState && req.stockState !== "available" && req.status === "pending";
            const attentionTag = needsAttention ? '<span class="card-badge">Requires restock</span>' : "";
            return `
                <article class="request-card ${statusClass}">
                    <div class="card-header">
                        <div>
                            <div class="card-title">${escapeHtml(req.itemName)}</div>
                            <div style="font-size:13px;color:#7a82ab;margin-top:4px;">${escapeHtml(req.username)} · ${req.userRole.toUpperCase()}</div>
                        </div>
                        <span class="card-status ${statusClass}">${req.status.toUpperCase()}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Quantity:</strong> ${req.quantity}</p>
                        <p><strong>Reason:</strong> ${escapeHtml(req.reason)}</p>
                        ${attentionTag}
                    </div>
                    <div class="card-footer">
                        <span>Requested on ${req.createdAt}</span>
                        ${req.status === "pending" ? `
                            <div class="action-buttons">
                                <button class="btn btn-success" type="button" data-request-action="approve" data-id="${req.id}">Approve</button>
                                <button class="btn btn-danger" type="button" data-request-action="reject" data-id="${req.id}">Reject</button>
                            </div>
                        ` : `<span>${req.resolvedAt ? `Updated on ${req.resolvedAt}` : ""}</span>`}
                    </div>
                </article>
            `;
        })
        .join("");
};

const renderNotifications = () => {
    const notifications = Storage.getNotifications();
    if (!notifications.length) {
        notificationsList.innerHTML = '<div class="empty-state">All caught up! Notifications will appear here.</div>';
        updateNotificationBadge(0);
        return;
    }
    const unread = notifications.filter(notif => !notif.read).length;
    updateNotificationBadge(unread);
    notificationsList.innerHTML = notifications
        .map(notif => {
            const cardClass = [`notification-card`, notif.type, notif.read ? "muted" : ""].join(" ");
            const action = notif.read
                ? '<span style="color:#25b66c;font-weight:600;">✔ Read</span>'
                : `<button class="btn btn-light" type="button" data-notification="${notif.id}">Mark as Read</button>`;
            return `
                <article class="${cardClass}">
                    <div class="card-header">
                        <div class="card-title">${escapeHtml(notif.title)}</div>
                        <span style="font-size:13px;color:#7a82ab;">${notif.createdAt}</span>
                    </div>
                    <div class="card-body">${escapeHtml(notif.message)}</div>
                    <div class="card-footer">${action}</div>
                </article>
            `;
        })
        .join("");
};

const updateRequestBadge = count => {
    document.getElementById("requestCount").textContent = count;
};

const updateNotificationBadge = count => {
    document.getElementById("notifCount").textContent = count;
};

const approveRequest = id => {
    const request = Storage.getRequests().find(entry => entry.id === id);
    if (!request) {
        return;
    }
    const stock = Storage.getStock();
    const stockItem = stock.find(item => item.name.toLowerCase() === request.itemName.toLowerCase());
    if (!stockItem) {
        alert("This item does not exist in stock. Add it before approving.");
        return;
    }
    if (stockItem.quantity < request.quantity) {
        alert("Insufficient quantity. Update the stock before approving this request.");
        return;
    }
    Storage.updateStockItem(stockItem.id, { quantity: stockItem.quantity - request.quantity });
    Storage.updateRequestStatus(id, "approved", { stockState: "fulfilled" });
    Storage.addNotification({
        title: "Request Approved",
        message: `${request.itemName} request for ${request.username} has been approved. Remaining stock: ${stockItem.quantity - request.quantity} units.`,
        type: "success"
    });
    renderStock();
    renderBudgetSummary();
    renderRequests();
    renderNotifications();
};

const rejectRequest = id => {
    const request = Storage.getRequests().find(entry => entry.id === id);
    if (!request) {
        return;
    }
    Storage.updateRequestStatus(id, "rejected");
    Storage.addNotification({
        title: "Request Rejected",
        message: `${request.itemName} request from ${request.username} was rejected.`,
        type: "warning"
    });
    renderRequests();
    renderNotifications();
    renderBudgetSummary();
};

const refreshUI = () => {
    renderBudgetSummary();
    renderStock();
    renderRequests();
    renderNotifications();
};

refreshUI();
setInterval(refreshUI, 5000);
