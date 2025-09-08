// Module quản lý phân quyền
export default class AdminPermissions {
  constructor(panel) {
    this.panel = panel;
  }
  async load() { await this.panel.loadPermissions(); }
  render() { this.panel.renderPermissionsTable(); }
    async addPermission() {
      const userId = document.getElementById('permissionUser').value;
      const projectId = document.getElementById('permissionProject').value;
      const canView = document.getElementById('permissionView').checked;
      const canEdit = document.getElementById('permissionEdit').checked;
      if (!userId || !projectId) {
        this.panel.showNotification('Vui lòng nhập đầy đủ thông tin phân quyền!', 'warning');
        return;
      }
      try {
        const response = await fetch('/api/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, project_id: projectId, can_view: canView, can_edit: canEdit })
        });
        if (!response.ok) throw new Error('Lỗi khi thêm phân quyền');
        this.panel.showNotification('Thêm phân quyền thành công!', 'success');
        this.panel.closeModal('addPermissionModal');
        await this.panel.loadPermissions();
      } catch (error) {
        this.panel.showNotification('Lỗi khi thêm phân quyền', 'error');
      }
    }

    openEditPermission(permissionId) {
      const permission = this.panel.permissions.find(p => p.id === permissionId);
      if (!permission) return;
      // Populate user/project lists
      const userSelect = document.getElementById('editPermissionUser');
      const projectSelect = document.getElementById('editPermissionProject');
      userSelect.innerHTML = '<option value="">Chọn người dùng</option>';
      projectSelect.innerHTML = '<option value="">Chọn dự án</option>';
      this.panel.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.email || user.username;
        if (user.id === permission.user_id) option.selected = true;
        userSelect.appendChild(option);
      });
      this.panel.projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        if (project.id === permission.project_id) option.selected = true;
        projectSelect.appendChild(option);
      });
      // Set checkboxes
      document.getElementById('editPermissionView').checked = !!permission.can_view;
      document.getElementById('editPermissionEdit').checked = !!permission.can_edit;
      document.getElementById('editPermissionId').value = permission.id;
      this.panel.showModal('editPermissionModal');
    }

    async saveEditPermission() {
      const id = document.getElementById('editPermissionId').value;
      const userId = document.getElementById('editPermissionUser').value;
      const projectId = document.getElementById('editPermissionProject').value;
      const canView = document.getElementById('editPermissionView').checked;
      const canEdit = document.getElementById('editPermissionEdit').checked;
      if (!userId || !projectId) {
        this.panel.showNotification('Vui lòng nhập đầy đủ thông tin phân quyền!', 'warning');
        return;
      }
      try {
        const response = await fetch(`/api/permissions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, project_id: projectId, can_view: canView, can_edit: canEdit })
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
      // For add modal
      const userSelect = document.getElementById('permissionUser');
      const projectSelect = document.getElementById('permissionProject');
      userSelect.innerHTML = '<option value="">Chọn người dùng</option>';
      projectSelect.innerHTML = '<option value="">Chọn dự án</option>';
      this.panel.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.email || user.username;
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
