// Module quản lý phân quyền
export default class AdminPermissions {
  constructor(panel) {
    this.panel = panel;
  }
  async load() { await this.panel.loadPermissions(); }
  render() { this.panel.renderPermissionsTable(); }
    async addPermission() {
      const userId = document.getElementById('permissionUserId').value;
      const projectId = document.getElementById('permissionProjectId').value;
      const role = document.getElementById('permissionRole').value;
      if (!userId || !projectId || !role) {
        this.panel.showNotification('Vui lòng nhập đầy đủ thông tin phân quyền!', 'warning');
        return;
      }
      try {
        const response = await fetch('/api/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, project_id: projectId, role })
        });
        if (!response.ok) throw new Error('Lỗi khi thêm phân quyền');
        this.panel.showNotification('Thêm phân quyền thành công!', 'success');
        this.panel.closeModal('addPermissionModal');
        await this.panel.loadPermissions();
      } catch (error) {
        this.panel.showNotification('Lỗi khi thêm phân quyền', 'error');
      }
    }

    editPermission(permissionId) {
      const permission = this.panel.permissions.find(p => p.id === permissionId);
      if (!permission) return;
      document.getElementById('editPermissionId').value = permission.id;
      document.getElementById('editPermissionUserId').value = permission.user_id;
      document.getElementById('editPermissionProjectId').value = permission.project_id;
      document.getElementById('editPermissionRole').value = permission.role;
      this.panel.showModal('editPermissionModal');
    }

    async saveEditPermission() {
      const id = document.getElementById('editPermissionId').value;
      const userId = document.getElementById('editPermissionUserId').value;
      const projectId = document.getElementById('editPermissionProjectId').value;
      const role = document.getElementById('editPermissionRole').value;
      if (!userId || !projectId || !role) {
        this.panel.showNotification('Vui lòng nhập đầy đủ thông tin phân quyền!', 'warning');
        return;
      }
      try {
        const response = await fetch(`/api/permissions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, project_id: projectId, role })
        });
        if (!response.ok) throw new Error('Lỗi khi cập nhật phân quyền');
        this.panel.showNotification('Cập nhật phân quyền thành công!', 'success');
        this.panel.closeModal('editPermissionModal');
        await this.panel.loadPermissions();
      } catch (error) {
        this.panel.showNotification('Lỗi khi cập nhật phân quyền', 'error');
      }
    }

    async deletePermission(permissionId) {
      if (!confirm('Bạn có chắc muốn xóa phân quyền này?')) return;
      try {
        const response = await fetch(`/api/permissions/${permissionId}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Lỗi khi xóa phân quyền');
        this.panel.showNotification('Xóa phân quyền thành công!', 'success');
        await this.panel.loadPermissions();
      } catch (error) {
        this.panel.showNotification('Lỗi khi xóa phân quyền', 'error');
      }
    }

    populatePermissionModal() {
      const userSelect = document.getElementById('permissionUserId');
      const projectSelect = document.getElementById('permissionProjectId');
      userSelect.innerHTML = '<option value="">Chọn người dùng</option>';
      projectSelect.innerHTML = '<option value="">Chọn dự án</option>';
      this.panel.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.username;
        userSelect.appendChild(option);
      });
      this.panel.projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
      });
    }

    handlePaginationClick(e) {
      if (e.target.classList.contains('page-btn')) {
        const page = parseInt(e.target.getAttribute('data-page'));
        if (!isNaN(page)) {
          this.panel.permissionsPage = page;
          this.panel.renderPermissionsTable();
        }
      }
    }
}
