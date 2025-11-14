const Storage = (() => {
    const USERS_KEY = "dsm_users";
    const STOCK_KEY = "dsm_stock";
    const REQUESTS_KEY = "dsm_requests";
    const NOTIFICATIONS_KEY = "dsm_notifications";
    const CURRENT_USER_KEY = "dsm_current_user";
    const BUDGET_KEY = "dsm_budget";

    const roundCurrency = value => {
        const numeric = Number(value) || 0;
        return Math.round((numeric + Number.EPSILON) * 100) / 100;
    };

    const read = (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (err) {
            console.error("Failed to read storage", key, err);
            return fallback;
        }
    };

    const write = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (err) {
            console.error("Failed to write storage", key, err);
        }
    };

    const getUsers = () => read(USERS_KEY, []);
    const saveUsers = users => write(USERS_KEY, users);

    const getCurrentUser = () => read(CURRENT_USER_KEY, null);
    const saveCurrentUser = user => write(CURRENT_USER_KEY, user);
    const clearCurrentUser = () => localStorage.removeItem(CURRENT_USER_KEY);

    const getStock = () => {
        const stock = read(STOCK_KEY, []);
        let updated = false;
        const normalized = stock.map(item => {
            if (item.unitCost === undefined) {
                updated = true;
                return { ...item, unitCost: 0 };
            }
            return item;
        });
        if (updated) {
            saveStock(normalized);
        }
        return normalized;
    };
    const saveStock = stock => write(STOCK_KEY, stock);

    const getRequests = () => read(REQUESTS_KEY, []);
    const saveRequests = requests => write(REQUESTS_KEY, requests);

    const getNotifications = () => read(NOTIFICATIONS_KEY, []);
    const saveNotifications = notifications => write(NOTIFICATIONS_KEY, notifications);

    const addStockItem = item => {
        const stock = getStock();
        const entry = {
            id: Date.now(),
            name: item.name,
            quantity: Number(item.quantity) || 0,
            unitCost: Number(item.unitCost) || 0,
            description: item.description
        };
        stock.push(entry);
        saveStock(stock);
        return entry;
    };

    const updateStockItem = (id, changes) => {
        const stock = getStock();
        const index = stock.findIndex(item => item.id === id);
        if (index === -1) {
            return null;
        }
        stock[index] = {
            ...stock[index],
            ...changes,
            quantity: changes.quantity !== undefined ? Number(changes.quantity) : stock[index].quantity,
            unitCost: changes.unitCost !== undefined ? Number(changes.unitCost) : stock[index].unitCost || 0
        };
        saveStock(stock);
        return stock[index];
    };

    const deleteStockItem = id => {
        const filtered = getStock().filter(item => item.id !== id);
        saveStock(filtered);
    };

    const addRequest = request => {
        const requests = getRequests();
        const entry = {
            id: Date.now(),
            username: request.username,
            userRole: request.userRole,
            itemName: request.itemName,
            quantity: Number(request.quantity),
            reason: request.reason,
            status: "pending",
            stockState: request.stockState || "available",
            createdAt: new Date().toLocaleString()
        };
        requests.push(entry);
        saveRequests(requests);
        return entry;
    };

    const updateRequestStatus = (id, status, changes = {}) => {
        const requests = getRequests();
        const index = requests.findIndex(req => req.id === id);
        if (index === -1) {
            return null;
        }
        requests[index] = {
            ...requests[index],
            ...changes,
            status,
            resolvedAt: new Date().toLocaleString()
        };
        saveRequests(requests);
        return requests[index];
    };

    const addNotification = notification => {
        const notifications = getNotifications();
        const entry = {
            id: Date.now(),
            title: notification.title,
            message: notification.message,
            type: notification.type || "info",
            read: false,
            createdAt: new Date().toLocaleString()
        };
        notifications.unshift(entry);
        saveNotifications(notifications);
        return entry;
    };

    const markNotificationRead = id => {
        const notifications = getNotifications();
        const index = notifications.findIndex(notif => notif.id === id);
        if (index === -1) {
            return;
        }
        notifications[index].read = true;
        saveNotifications(notifications);
    };

    const markAllNotificationsRead = () => {
        const notifications = getNotifications().map(notif => ({ ...notif, read: true }));
        saveNotifications(notifications);
    };

    const clearRequests = () => {
        saveRequests([]);
    };

    const clearNotifications = () => {
        saveNotifications([]);
    };

    const saveBudgetState = budget => write(BUDGET_KEY, budget);

    const getBudget = () => {
        let budget = read(BUDGET_KEY, null);
        if (!budget) {
            budget = { totalBudget: 0, totalSpent: 0 };
            saveBudgetState(budget);
            return budget;
        }
        const sanitized = {
            totalBudget: roundCurrency(budget.totalBudget),
            totalSpent: roundCurrency(budget.totalSpent)
        };
        if (sanitized.totalSpent < 0) {
            sanitized.totalSpent = 0;
        }
        if (sanitized.totalBudget < 0) {
            sanitized.totalBudget = 0;
        }
        if (sanitized.totalBudget !== budget.totalBudget || sanitized.totalSpent !== budget.totalSpent) {
            saveBudgetState(sanitized);
        }
        return sanitized;
    };

    const setTotalBudget = amount => {
        const budget = getBudget();
        const newTotal = roundCurrency(amount);
        if (newTotal < budget.totalSpent) {
            return false;
        }
        budget.totalBudget = newTotal;
        saveBudgetState(budget);
        return true;
    };

    const applyBudgetDelta = delta => {
        const budget = getBudget();
        const change = roundCurrency(delta);
        const remaining = roundCurrency(budget.totalBudget - budget.totalSpent);
        if (change > 0 && change > remaining) {
            return false;
        }
        budget.totalSpent = roundCurrency(budget.totalSpent + change);
        if (budget.totalSpent < 0) {
            budget.totalSpent = 0;
        }
        saveBudgetState(budget);
        return true;
    };

    const getRemainingBudget = () => {
        const budget = getBudget();
        return roundCurrency(budget.totalBudget - budget.totalSpent);
    };

    const initializeDefaults = () => {
        if (!localStorage.getItem(USERS_KEY)) {
            saveUsers([
                {
                    username: "admin",
                    password: "admin123",
                    role: "admin"
                }
            ]);
        }
        if (!localStorage.getItem(STOCK_KEY)) {
            saveStock([
                {
                    id: Date.now() - 2,
                    name: "Projector",
                    quantity: 4,
                    unitCost: 45000,
                    description: "Ceiling mounted projectors for seminar halls"
                },
                {
                    id: Date.now() - 1,
                    name: "Whiteboard Markers",
                    quantity: 120,
                    unitCost: 35,
                    description: "Mixed color marker set for classrooms"
                }
            ]);
        }
        if (!localStorage.getItem(REQUESTS_KEY)) {
            saveRequests([]);
        }
        if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
            saveNotifications([]);
        }
        if (!localStorage.getItem(BUDGET_KEY)) {
            saveBudgetState({ totalBudget: 0, totalSpent: 0 });
        }
    };

    initializeDefaults();

    return {
        getUsers,
        saveUsers,
        getCurrentUser,
        saveCurrentUser,
        clearCurrentUser,
        getStock,
        saveStock,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        getRequests,
        saveRequests,
        addRequest,
        updateRequestStatus,
        clearRequests,
        getNotifications,
        saveNotifications,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        getBudget,
        setTotalBudget,
        applyBudgetDelta,
        getRemainingBudget
    };
})();
