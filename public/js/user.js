async function checkAuth() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
        window.location.href = '/';
        return;
    }

    try {
        // Always verify token with backend
        const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Invalid or expired token');
        }

        const result = await response.json();

        // Use `result` wrapper if your backend responds with { success, data }
        const user = result.data || result;

        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(user));

        // Role-based redirect
        if (user.role !== 'user') {
            showAlert(`Redirecting to ${user.role} dashboard...`, 'info');
            setTimeout(() => {
                window.location.href = `dashboard-${user.role}.html`;
            }, 1200);
            return;
        }

        // Update UI
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userPoints').textContent = user.points;

    } catch (error) {
        console.error("Auth check failed:", error);
        showAlert('Session expired. Please login again.', 'danger');
        logout();
    }
}
