class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.projects = [];
        this.parcels = [];
        this.permissions = [];
        
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuth();
        
        // Bind events
        this.bindEvents();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Show dashboard tab by default
        this.showTab('dashboard');
    }

    async checkAuth() {
        const token = localStorage.getItem('adminToken');
        console.log('Checking auth with token:', token);
        
        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = '/admin-login.html';
            return;
        }

        try {
            console.log('Verifying token with server...');
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Auth response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.log('Auth failed:', errorData);
                throw new Error('Unauthorized');
            }

            this.currentUser = await response.json();
            console.log('Auth successful, user:', this.currentUser);
            document.getElementById('currentUser').textContent = this.currentUser.email;
        } catch (error) {
            console.error('Auth error:', error);
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login.html';
        }
    }

    bindEvents() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.showTab(tab.dataset.tab);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Add buttons
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.showModal('addUserModal');
        });

        document.getElementById('addProjectBtn').addEventListener('click', () => {
            this.showModal('addProjectModal');
        });

        document.getElementById('addPermissionBtn').addEventListener('click', () => {
            this.showModal('addPermissionModal');
        });

        // Import Excel button
        document.getElementById('importExcelBtn').addEventListener('click', () => {
            this.showModal('importExcelModal');
        });

        // Form submissions
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addUser();
        });

        document.getElementById('addProjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProject();
        });

        document.getElementById('addPermissionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPermission();
        });

        // Import Excel form
        document.getElementById('importExcelForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.importExcel();
        });

        // Close modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModal(closeBtn.closest('.modal').id);
            });
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Filters
        document.getElementById('adminProjectFilter').addEventListener('change', () => {
            this.filterParcels();
        });

        document.getElementById('adminStatusFilter').addEventListener('change', () => {
            this.filterParcels();
        });
    }

    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Load tab-specific data
        switch (tabName) {
            case 'users':
                this.loadUsers();
                break;
            case 'projects':
                this.loadProjects();
                break;
            case 'parcels':
                this.loadParcels();
                break;
            case 'permissions':
                this.loadPermissions();
                break;
        }
    }

    async loadDashboardData() {
        try {
            const [parcelsRes, projectsRes, usersRes] = await Promise.all([
                fetch('/api/parcels'),
                fetch('/api/projects'),
                fetch('/api/users')
            ]);

            const parcels = await parcelsRes.json();
            const projects = await projectsRes.json();
            const users = await usersRes.json();

            // Update dashboard stats
            document.getElementById('totalParcels').textContent = parcels.length;
            document.getElementById('totalProjects').textContent = projects.length;
            document.getElementById('totalUsers').textContent = users.length;

            // Calculate today's parcels
            const today = new Date().toDateString();
            const todayParcels = parcels.filter(p => {
                const createdDate = new Date(p.created_at || Date.now()).toDateString();
                return createdDate === today;
            }).length;
            document.getElementById('todayParcels').textContent = todayParcels;

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users');
            this.users = await response.json();
            this.renderUsersTable();
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.name || 'N/A'}</td>
                <td>${user.role}</td>
                <td>${new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editUser(${user.id})">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteUser(${user.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            this.projects = await response.json();
            this.renderProjectsTable();
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    renderProjectsTable() {
        const tbody = document.getElementById('projectsTableBody');
        tbody.innerHTML = '';

        this.projects.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.id}</td>
                <td>${project.code || 'N/A'}</td>
                <td>${project.name}</td>
                <td>${project.description || 'N/A'}</td>
                <td>${project.parcel_count || 0}</td>
                <td>${new Date(project.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editProject(${project.id})">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteProject(${project.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadParcels() {
        try {
            const response = await fetch('/api/parcels');
            this.parcels = await response.json();
            this.renderParcelsTable();
            this.updateParcelFilters();
        } catch (error) {
            console.error('Error loading parcels:', error);
        }
    }

    renderParcelsTable() {
        const tbody = document.getElementById('parcelsTableBody');
        tbody.innerHTML = '';

        this.parcels.forEach(parcel => {
            const project = this.projects.find(p => p.id === parcel.project_id);
            const projectName = project ? project.name : 'N/A';
            const projectCode = project ? project.code : 'N/A';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${parcel.id}</td>
                <td>${parcel.parcel_code || 'N/A'}</td>
                <td>${parcel.title}</td>
                <td>${projectCode}</td>
                <td>${projectName}</td>
                <td>${parcel.area || 0} m²</td>
                <td>${parcel.person_in_charge || 'N/A'}</td>
                <td>${parcel.legal_status}</td>
                <td>${parcel.clearance_status}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editParcel(${parcel.id})">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteParcel(${parcel.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateParcelFilters() {
        // Update project filter
        const projectFilter = document.getElementById('adminProjectFilter');
        projectFilter.innerHTML = '<option value="">Tất cả dự án</option>';
        
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectFilter.appendChild(option);
        });

        // Update status filter
        const statusFilter = document.getElementById('adminStatusFilter');
        statusFilter.innerHTML = '<option value="">Tất cả trạng thái</option>';
        
        const uniqueStatuses = [...new Set(this.parcels.map(p => p.legal_status).filter(Boolean))];
        uniqueStatuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusFilter.appendChild(option);
        });
    }

    async loadPermissions() {
        try {
            const response = await fetch('/api/permissions');
            this.permissions = await response.json();
            this.renderPermissionsTable();
        } catch (error) {
            console.error('Error loading permissions:', error);
        }
    }

    renderPermissionsTable() {
        const tbody = document.getElementById('permissionsTableBody');
        tbody.innerHTML = '';

        this.permissions.forEach(permission => {
            const user = this.users.find(u => u.id === permission.user_id);
            const project = this.projects.find(p => p.id === permission.project_id);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user ? user.email : 'N/A'}</td>
                <td>${project ? project.name : 'N/A'}</td>
                <td>${permission.can_view ? '✓' : '✗'}</td>
                <td>${permission.can_edit ? '✓' : '✗'}</td>
                <td>${new Date(permission.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editPermission(${permission.id})">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deletePermission(${permission.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    filterParcels() {
        const projectFilter = document.getElementById('adminProjectFilter').value;
        const statusFilter = document.getElementById('adminStatusFilter').value;

        const filteredParcels = this.parcels.filter(parcel => {
            const projectMatch = !projectFilter || parcel.project_id == projectFilter;
            const statusMatch = !statusFilter || parcel.legal_status === statusFilter;
            return projectMatch && statusMatch;
        });

        this.renderFilteredParcels(filteredParcels);
    }

    renderFilteredParcels(parcels) {
        const tbody = document.getElementById('parcelsTableBody');
        tbody.innerHTML = '';

        parcels.forEach(parcel => {
            const project = this.projects.find(p => p.id === parcel.project_id);
            const projectName = project ? project.name : 'N/A';
            const projectCode = project ? project.code : 'N/A';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${parcel.id}</td>
                <td>${parcel.parcel_code || 'N/A'}</td>
                <td>${parcel.title}</td>
                <td>${projectCode}</td>
                <td>${projectName}</td>
                <td>${parcel.area || 0} m²</td>
                <td>${parcel.person_in_charge || 'N/A'}</td>
                <td>${parcel.legal_status}</td>
                <td>${parcel.clearance_status}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editParcel(${parcel.id})">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteParcel(${parcel.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async addUser() {
        const formData = {
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value,
            name: document.getElementById('userName').value,
            role: document.getElementById('userRole').value
        };

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showNotification('Thêm người dùng thành công', 'success');
                this.closeModal('addUserModal');
                document.getElementById('addUserForm').reset();
                this.loadUsers();
                this.loadDashboardData();
            } else {
                throw new Error('Lỗi khi thêm người dùng');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Lỗi khi thêm người dùng', 'error');
        }
    }

    async addProject() {
        const formData = {
            code: document.getElementById('projectCode').value,
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDescription').value
        };

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showNotification('Thêm dự án thành công', 'success');
                this.closeModal('addProjectModal');
                document.getElementById('addProjectForm').reset();
                this.loadProjects();
                this.loadDashboardData();
            } else {
                throw new Error('Lỗi khi thêm dự án');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Lỗi khi thêm dự án', 'error');
        }
    }

    async addPermission() {
        const formData = {
            user_id: document.getElementById('permissionUser').value,
            project_id: document.getElementById('permissionProject').value,
            can_view: document.getElementById('permissionView').checked,
            can_edit: document.getElementById('permissionEdit').checked
        };

        try {
            const response = await fetch('/api/permissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showNotification('Thêm phân quyền thành công', 'success');
                this.closeModal('addPermissionModal');
                document.getElementById('addPermissionForm').reset();
                this.loadPermissions();
            } else {
                throw new Error('Lỗi khi thêm phân quyền');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Lỗi khi thêm phân quyền', 'error');
        }
    }

    async importExcel() {
        const fileInput = document.getElementById('excelFile');
        const file = fileInput.files[0];

        if (!file) {
            this.showNotification('Vui lòng chọn file Excel', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/import-excel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification(result.message, 'success');
                this.closeModal('importExcelModal');
                document.getElementById('importExcelForm').reset();
                this.loadParcels();
                this.loadDashboardData();
            } else {
                throw new Error(result.error || 'Lỗi khi import Excel');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Lỗi khi import Excel: ' + error.message, 'error');
        }
    }

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            
            // Populate modal data if needed
            if (modalId === 'addPermissionModal') {
                this.populatePermissionModal();
            }
        }
    }

    // Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Populate permission modal with user and project data
    populatePermissionModal() {
        // Populate user dropdown
        const userSelect = document.getElementById('permissionUser');
        userSelect.innerHTML = '<option value="">Chọn người dùng</option>';
        
        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.email} (${user.name || 'N/A'})`;
            userSelect.appendChild(option);
        });

        // Populate project dropdown
        const projectSelect = document.getElementById('permissionProject');
        projectSelect.innerHTML = '<option value="">Chọn dự án</option>';
        
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }

    // Logout
    async logout() {
        try {
            const token = localStorage.getItem('adminToken');
            if (token) {
                // Call logout API to clear session
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage and redirect
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login.html';
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification - you can enhance this
        alert(`${type.toUpperCase()}: ${message}`);
    }

    // Placeholder methods for edit/delete operations
    editUser(userId) {
        this.showNotification('Chức năng sửa người dùng đang phát triển');
    }

    deleteUser(userId) {
        if (confirm('Bạn có chắc muốn xóa người dùng này?')) {
            this.showNotification('Chức năng xóa người dùng đang phát triển');
        }
    }

    editProject(projectId) {
        this.showNotification('Chức năng sửa dự án đang phát triển');
    }

    deleteProject(projectId) {
        if (confirm('Bạn có chắc muốn xóa dự án này?')) {
            this.showNotification('Chức năng xóa dự án đang phát triển');
        }
    }

    editParcel(parcelId) {
        this.showNotification('Chức năng sửa thửa đất đang phát triển');
    }

    deleteParcel(parcelId) {
        if (confirm('Bạn có chắc muốn xóa thửa đất này?')) {
            this.showNotification('Chức năng xóa thửa đất đang phát triển');
        }
    }

    editPermission(permissionId) {
        this.showNotification('Chức năng sửa phân quyền đang phát triển');
    }

    deletePermission(permissionId) {
        if (confirm('Bạn có chắc muốn xóa phân quyền này?')) {
            this.showNotification('Chức năng xóa phân quyền đang phát triển');
        }
    }
}

// Initialize admin panel when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Global function for modal closing
function closeModal(modalId) {
    window.adminPanel.closeModal(modalId);
} 