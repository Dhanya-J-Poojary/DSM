# Department Stock Management System

A complete web-based inventory management solution for educational departments to track stock, manage requests, and control budgets.

## Overview

The Department Stock Management (DSM) System helps departments efficiently manage their inventory with role-based access control, real-time notifications, and comprehensive budget tracking.

## Features

### Authentication System
- **Secure Login/Signup**: Role-based authentication for Admin, Faculty, and Staff
- **Persistent Sessions**: Stay logged in across browser sessions
- **Role Selection**: Choose your role during signup

### Stock Management
- **Inventory Tracking**: Add, edit, and delete stock items with quantities
- **Budget per Unit**: Track cost allocation for each item
- **Real-time Updates**: Automatic refresh every 5 seconds
- **Stock Alerts**: Visual indicators for out-of-stock items

### Budget Management (Admin Only)
- **Department Budget**: Set and track total department budget
- **Spending Oversight**: Monitor total spent and remaining balance
- **Budget Enforcement**: Prevent overspending with automatic validation
- **Visual Indicators**: Color-coded budget cards for quick status checks

### Request System
- **Faculty/Staff Requests**: Submit item requests with quantity and reason
- **Stock Availability Check**: Automatic validation against current inventory
- **Admin Approval Workflow**: Approve or reject pending requests
- **Status Tracking**: Monitor request status (pending, approved, rejected)

### Notification Center
- **Real-time Alerts**: Get notified of request approvals and rejections
- **Unread Badges**: Visual counters for pending items
- **Batch Actions**: Mark all as read or clear all notifications

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: LocalStorage (browser-based persistence)
- **Styling**: Custom CSS with responsive design
- **Icons**: Unicode emojis for visual clarity

## File Structure

```
DSM/
├── index.html              # Landing page
├── pages/
│   ├── login.html         # Login page
│   ├── signup.html        # Signup page
│   ├── admin.html         # Admin dashboard
│   ├── faculty.html       # Faculty dashboard
│   └── staff.html         # Staff dashboard
├── css/
│   ├── styles.css         # Global styles
│   └── NITTE_logo.png     # Institution logo
├── js/
│   ├── storage.js         # LocalStorage management
│   ├── auth.js            # Authentication logic
│   ├── admin.js           # Admin dashboard controller
│   └── role.js            # Faculty/Staff controller
└── README.md              # Documentation
```

## Getting Started

### Installation

1. Clone or download the project files
2. Open `index.html` in a modern web browser
3. No server or build process required!

### Default Admin Account

The system initializes with a default admin account:
- **Username**: admin
- **Password**: admin123

*Note: Change this password immediately in production.*

### First-Time Setup

1. **Login as Admin**
   - Navigate to Login page
   - Use default credentials

2. **Set Department Budget**
   - Go to the budget section at the top
   - Enter your total department budget
   - Click "Save Budget"

3. **Add Stock Items**
   - Click "Add Item" button
   - Fill in item name, quantity, unit cost, and description
   - Budget is automatically deducted

4. **Create User Accounts**
   - Ask faculty/staff to sign up with their role
   - They can immediately start viewing stock and making requests

## User Roles

### Admin
- Full access to all features
- Manage stock inventory (add, edit, delete)
- Set and monitor department budget
- Approve/reject faculty and staff requests
- View all notifications
- Clear requests and notifications

### Faculty
- View stock inventory with budget details
- Submit item requests
- Track request status
- Cannot modify stock or budget

### Staff
- View stock inventory with budget details
- Submit item requests
- Track request status
- Cannot modify stock or budget

## How It Works

### Stock Management Flow
1. Admin adds items with quantity and unit cost
2. System calculates total cost (quantity × unit cost)
3. Budget is deducted from remaining balance
4. Stock appears in all user dashboards

### Request Workflow
1. Faculty/Staff submits a request for an item
2. System checks stock availability
3. Admin receives notification with pending badge
4. Admin approves or rejects the request
5. On approval, stock quantity is reduced automatically
6. Requester receives notification of the decision

### Budget Tracking
1. Admin sets total department budget
2. Each stock addition/update deducts from remaining balance
3. System prevents operations that exceed available funds
4. Deleting stock items refunds the budget
5. Dashboard shows real-time budget summary with three KPIs:
   - Total Budget (blue)
   - Total Spent (red)
   - Remaining Balance (green/red based on status)

## Key Features Explained

### Budget Enforcement
- **Pre-validation**: Checks available balance before saving
- **Automatic Calculation**: Computes cost changes for edits
- **Rollback Support**: Reverts budget on failed operations
- **Clear Feedback**: Shows remaining balance in alerts

### Smart Request Handling
- **Stock State Tracking**: Marks requests requiring restock
- **Automatic Inventory Updates**: Reduces quantity on approval
- **Bi-directional Notifications**: Informs both admin and requester

### Data Persistence
All data is stored in browser LocalStorage:
- User accounts and credentials
- Stock inventory with costs
- Request history with timestamps
- Notification records
- Budget allocations

*Note: Clearing browser data will reset the system.*

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with LocalStorage support

## Security Notes

⚠️ **Important**: This is a client-side demo application using LocalStorage.

For production use, consider:
- Server-side authentication with encrypted passwords
- Database storage instead of LocalStorage
- HTTPS for secure communication
- Role-based access control on the backend
- Input sanitization and validation
- Session timeout mechanisms

## Customization

### Changing Colors
Edit `css/styles.css`:
- Primary color: `#212872`
- Success: `#25b66c`
- Danger: `#f05c5c`
- Warning: `#ffc145`

### Modifying Currency
Edit `formatCurrency` function in `js/admin.js` and `js/role.js`:
```javascript
return `₹${amount.toLocaleString("en-IN", ...)}`;
```

### Adjusting Auto-refresh
Change interval in dashboard files:
```javascript
setInterval(refreshUI, 5000); // 5000ms = 5 seconds
```

## Troubleshooting

### Budget Not Updating
- Refresh the page
- Check browser console for errors
- Verify LocalStorage is enabled

### Login Issues
- Clear browser cache and LocalStorage
- Use default admin credentials
- Check for JavaScript errors

### Missing Stock Items
- Ensure budget has sufficient balance
- Verify all required fields are filled
- Check that item wasn't deleted

## Future Enhancements

Potential improvements:
- Export data to CSV/Excel
- Advanced search and filtering
- Item categories and tags
- Multi-department support
- Email notifications
- Audit logs and history
- Data backup/restore
- Charts and analytics
- Mobile app version

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all files are present
3. Ensure JavaScript is enabled
4. Test in a different browser

## License

This project is provided as-is for educational and departmental use.

---

**Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: Department Administration
