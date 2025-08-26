
import AdminUsers from './modules/admin-users.js';
import AdminProjects from './modules/admin-projects.js';
import AdminParcels from './modules/admin-parcels.js';
import AdminPermissions from './modules/admin-permissions.js';

class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.projects = [];
        this.parcels = [];
        this.permissions = [];
        this.usersPage = 1;
        this.projectsPage = 1;
        this.parcelsPage = 1;
        this.permissionsPage = 1;
        this.pageSize = 10;
        // Khởi tạo các module
        this.usersModule = new AdminUsers(this);
        this.projectsModule = new AdminProjects(this);
        this.parcelsModule = new AdminParcels(this);
        this.permissionsModule = new AdminPermissions(this);
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.bindEvents();
        await this.loadDashboardData();
        this.showTab('dashboard');
    }

    async checkAuth() {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = '/admin-login.html';
            return;
        }
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Unauthorized');
            this.currentUser = await response.json();
            document.getElementById('currentUser').textContent = this.currentUser.email;
        } catch (error) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login.html';
        }
    }

    bindEvents() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.showTab(tab.dataset.tab);
            });
        });
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.showModal('addUserModal');
        });
        document.getElementById('addProjectBtn').addEventListener('click', () => {
            this.showModal('addProjectModal');
        });
        document.getElementById('addPermissionBtn').addEventListener('click', () => {
            this.showModal('addPermissionModal');
        });
        document.getElementById('importExcelBtn').addEventListener('click', () => {
            this.showModal('importExcelModal');
        });
        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            this.parcelsModule.exportExcel();
        });
        document.getElementById('importDxfBtn').addEventListener('click', () => {
            this.parcelsModule.populateDxfProjectSelect();
            this.showModal('importDxfModal');
        });
        document.getElementById('importDxfForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.parcelsModule.importDxf();
        });
        document.querySelector('#importDxfModal .close').addEventListener('click', () => {
            this.closeModal('importDxfModal');
        });
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.usersModule.addUser();
        });
        document.getElementById('addProjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.projectsModule.addProject();
        });
        document.getElementById('addPermissionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.permissionsModule.addPermission();
        });
        document.getElementById('importExcelForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.parcelsModule.importExcel();
        });
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModal(closeBtn.closest('.modal').id);
            });
        });
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
        document.getElementById('adminProjectFilter').addEventListener('change', () => {
            this.parcelsPage = 1;
            this.parcelsModule.filterParcels();
        });
        document.getElementById('adminStatusFilter').addEventListener('change', () => {
            this.parcelsPage = 1;
            this.parcelsModule.filterParcels();
        });
        document.getElementById('usersPagination').addEventListener('click', (e) => this.usersModule.handlePaginationClick(e, 'users'));
        document.getElementById('projectsPagination').addEventListener('click', (e) => this.projectsModule.handlePaginationClick(e, 'projects'));
        document.getElementById('parcelsPagination').addEventListener('click', (e) => this.parcelsModule.handlePaginationClick(e, 'parcels'));
        document.getElementById('permissionsPagination').addEventListener('click', (e) => this.permissionsModule.handlePaginationClick(e, 'permissions'));
        document.getElementById('editParcelForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.parcelsModule.saveEditParcel();
        });
        document.querySelector('#editParcelModal .close').addEventListener('click', () => {
            this.closeModal('editParcelModal');
        });
    }

    showTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        switch (tabName) {
            case 'users':
                this.usersModule.load();
                break;
            case 'projects':
                this.projectsModule.load();
                break;
            case 'parcels':
                this.parcelsModule.load();
                break;
            case 'permissions':
                this.permissionsModule.load();
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
            document.getElementById('totalParcels').textContent = parcels.length;
            document.getElementById('totalProjects').textContent = projects.length;
            document.getElementById('totalUsers').textContent = users.length;
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

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            if (modalId === 'addPermissionModal') {
                this.permissionsModule.populatePermissionModal();
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async logout() {
        try {
            const token = localStorage.getItem('adminToken');
            if (token) {
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
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login.html';
        }
    }

    showNotification(message, type = 'info') {
        alert(`${type.toUpperCase()}: ${message}`);
    }
    // --- USERS ---
    async loadUsers() {
        try {
            const res = await fetch('/api/users');
            this.users = await res.json();
            this.renderUsersTable();
        } catch (error) {
            this.showNotification('Lỗi khi tải danh sách người dùng', 'error');
        }
    }
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        const pageUsers = this.users.slice((this.usersPage-1)*this.pageSize, this.usersPage*this.pageSize);
        pageUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.name || ''}</td>
                <td>${user.role}</td>
                <td>${user.status || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.usersModule.editUser(${user.id})">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.usersModule.deleteUser(${user.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        // Pagination
        this.renderPagination('users', this.users.length);
    }

    // --- PROJECTS ---
    async loadProjects() {
        try {
            const res = await fetch('/api/projects');
            this.projects = await res.json();
            this.renderProjectsTable();
        } catch (error) {
            this.showNotification('Lỗi khi tải danh sách dự án', 'error');
        }
    }
    renderProjectsTable() {
        const tbody = document.getElementById('projectsTableBody');
        tbody.innerHTML = '';
        const pageProjects = this.projects.slice((this.projectsPage-1)*this.pageSize, this.projectsPage*this.pageSize);
        pageProjects.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.id}</td>
                <td>${project.code}</td>
                <td>${project.name}</td>
                <td>${project.description || ''}</td>
                <td>${project.parcel_count || ''}</td>
                <td>${project.created_at ? new Date(project.created_at).toLocaleDateString() : ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.projectsModule.editProject(${project.id})">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.projectsModule.deleteProject(${project.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        // Pagination
        this.renderPagination('projects', this.projects.length);
    }

    // --- PARCELS ---
    async loadParcels() {
        try {
            const res = await fetch('/api/parcels');
            this.parcels = await res.json();
            this.renderParcelsTable();
        } catch (error) {
            this.showNotification('Lỗi khi tải danh sách thửa đất', 'error');
        }
    }
    renderParcelsTable() {
        const tbody = document.getElementById('parcelsTableBody');
        tbody.innerHTML = '';
        const pageParcels = this.parcels.slice((this.parcelsPage-1)*this.pageSize, this.parcelsPage*this.pageSize);
        pageParcels.forEach(parcel => {
            const project = this.projects.find(p => p.id === parcel.project_id);
            const projectName = project ? project.name : '';
            const projectCode = project ? project.code : '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${parcel.id}</td>
                <td>${parcel.parcel_code || ''}</td>
                <td>${parcel.title}</td>
                <td>${projectCode}</td>
                <td>${projectName}</td>
                <td>${parcel.area || 0} m²</td>
                <td>${parcel.person_in_charge || ''}</td>
                <td>${parcel.legal_status || ''}</td>
                <td>${parcel.clearance_status || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.parcelsModule.editParcel(${parcel.id})">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.parcelsModule.deleteParcel(${parcel.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        // Pagination
        this.renderPagination('parcels', this.parcels.length);
    }

    // --- PERMISSIONS ---
    async loadPermissions() {
        try {
            const res = await fetch('/api/permissions');
            this.permissions = await res.json();
            this.renderPermissionsTable();
        } catch (error) {
            this.showNotification('Lỗi khi tải danh sách phân quyền', 'error');
        }
    }
    renderPermissionsTable() {
        const tbody = document.getElementById('permissionsTableBody');
        tbody.innerHTML = '';
        const pagePerms = this.permissions.slice((this.permissionsPage-1)*this.pageSize, this.permissionsPage*this.pageSize);
        pagePerms.forEach(perm => {
            const user = this.users.find(u => u.id === perm.user_id);
            const project = this.projects.find(p => p.id === perm.project_id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user ? user.email : perm.user_id}</td>
                <td>${project ? project.name : perm.project_id}</td>
                <td>${perm.can_view ? '✔️' : ''}</td>
                <td>${perm.can_edit ? '✔️' : ''}</td>
                <td>${perm.created_at ? new Date(perm.created_at).toLocaleDateString() : ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.permissionsModule.editPermission(${perm.id})">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.permissionsModule.deletePermission(${perm.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        // Pagination
        this.renderPagination('permissions', this.permissions.length);
    }

    // --- PAGINATION RENDER ---
    renderPagination(type, total) {
        const page = this[`${type}Page`];
        const pageSize = this.pageSize;
        const totalPages = Math.ceil(total / pageSize);
        const container = document.getElementById(`${type}Pagination`);
        container.innerHTML = '';
        if (totalPages <= 1) return;
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = 'page-btn' + (i === page ? ' active' : '');
            btn.setAttribute('data-page', i);
            btn.textContent = i;
            container.appendChild(btn);
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