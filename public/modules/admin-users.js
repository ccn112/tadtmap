// Module quản lý người dùng
export default class AdminUsers {
  constructor(panel) {
    this.panel = panel;
  }
  async load() { await this.panel.loadUsers(); }
  render() { this.panel.renderUsersTable(); }
  async load() { await this.panel.loadUsers(); }
  render() { this.panel.renderUsersTable(); }

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
        this.panel.showNotification('Thêm người dùng thành công', 'success');
        this.panel.closeModal('addUserModal');
        document.getElementById('addUserForm').reset();
        this.panel.loadUsers();
        this.panel.loadDashboardData();
      } else {
        throw new Error('Lỗi khi thêm người dùng');
      }
    } catch (error) {
      console.error('Error:', error);
      this.panel.showNotification('Lỗi khi thêm người dùng', 'error');
    }
  }

  editUser(userId) {
    this.panel.showNotification('Chức năng sửa người dùng đang phát triển');
  }

  deleteUser(userId) {
    if (confirm('Bạn có chắc muốn xóa người dùng này?')) {
      this.panel.showNotification('Chức năng xóa người dùng đang phát triển');
    }
  }

  handlePaginationClick(e, type) {
    if (e.target.classList.contains('page-btn')) {
      const page = parseInt(e.target.getAttribute('data-page'));
      if (!isNaN(page)) {
        this.panel[type + 'Page'] = page;
        this.panel.renderUsersTable();
      }
    }
  }
}
