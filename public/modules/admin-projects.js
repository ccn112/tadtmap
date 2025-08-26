// Module quản lý dự án
export default class AdminProjects {
  constructor(panel) {
    this.panel = panel;
  }
  async load() { await this.panel.loadProjects(); }
  render() { this.panel.renderProjectsTable(); }
  async load() { await this.panel.loadProjects(); }
  render() { this.panel.renderProjectsTable(); }

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
        this.panel.showNotification('Thêm dự án thành công', 'success');
        this.panel.closeModal('addProjectModal');
        document.getElementById('addProjectForm').reset();
        this.panel.loadProjects();
        this.panel.loadDashboardData();
      } else {
        throw new Error('Lỗi khi thêm dự án');
      }
    } catch (error) {
      console.error('Error:', error);
      this.panel.showNotification('Lỗi khi thêm dự án', 'error');
    }
  }

  editProject(projectId) {
    this.panel.showNotification('Chức năng sửa dự án đang phát triển');
  }

  deleteProject(projectId) {
    if (confirm('Bạn có chắc muốn xóa dự án này?')) {
      this.panel.showNotification('Chức năng xóa dự án đang phát triển');
    }
  }

  handlePaginationClick(e, type) {
    if (e.target.classList.contains('page-btn')) {
      const page = parseInt(e.target.getAttribute('data-page'));
      if (!isNaN(page)) {
        this.panel[type + 'Page'] = page;
        this.panel.renderProjectsTable();
      }
    }
  }
}
