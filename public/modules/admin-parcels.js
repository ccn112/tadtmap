// Module quản lý thửa đất
export default class AdminParcels {
  constructor(panel) {
    this.panel = panel;
  }
  async load() { await this.panel.loadParcels(); }
  render() { this.panel.renderParcelsTable(); }

  async exportExcel() {
    // Sử dụng SheetJS để xuất file Excel
    if (!window.XLSX) {
      this.panel.showNotification('Thiếu thư viện xuất Excel. Vui lòng liên hệ quản trị!', 'error');
      return;
    }
    const parcels = this.panel.parcels || [];
    if (!parcels.length) {
      this.panel.showNotification('Không có dữ liệu để xuất!', 'warning');
      return;
    }
    // Chuyển đổi dữ liệu sang định dạng phù hợp
    const data = parcels.map(parcel => ({
      'ID': parcel.id,
      'Mã thửa đất': parcel.parcel_code,
      'Tiêu đề': parcel.title,
      'Mã dự án': parcel.project_id,
      'Diện tích': parcel.area,
      'Người phụ trách': parcel.person_in_charge,
      'Tình trạng pháp lý': parcel.legal_status,
      'Tình trạng GPMB': parcel.clearance_status,
      'Màu sắc': parcel.parcel_color,
      'Mô tả': parcel.description
    }));
    // Tạo workbook và worksheet
    const ws = window.XLSX.utils.json_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Parcels');
    // Xuất file
    window.XLSX.writeFile(wb, 'danh_sach_thua_dat.xlsx');
  }

  async saveEditParcel() {
    const id = document.getElementById('editParcelId').value;
    const data = {
      parcel_code: document.getElementById('editParcelCode').value,
      project_id: document.getElementById('editProjectId').value || null,
      title: document.getElementById('editTitle').value,
      area: parseFloat(document.getElementById('editArea').value) || 0,
      description: document.getElementById('editDescription').value,
      person_in_charge: document.getElementById('editPersonInCharge').value,
      legal_status: document.getElementById('editLegalStatus').value,
      clearance_status: document.getElementById('editClearanceStatus').value,
      parcel_color: document.getElementById('editParcelColor').value
    };
    if (!data.parcel_code || !data.title) {
      this.panel.showNotification('Vui lòng nhập đầy đủ mã thửa và tiêu đề!', 'warning');
      return;
    }
    const parcel = this.panel.parcels.find(p => p.id == id);
    if (parcel) data.geometry = parcel.geometry;
    try {
      const response = await fetch(`/api/parcels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Lỗi khi cập nhật thửa đất');
      this.panel.showNotification('Cập nhật thửa đất thành công!', 'success');
      this.panel.closeModal('editParcelModal');
      await this.panel.loadParcels();
    } catch (error) {
      this.panel.showNotification('Lỗi khi cập nhật thửa đất', 'error');
    }
  }

  async importExcel() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    if (!file) {
      this.panel.showNotification('Vui lòng chọn file Excel', 'error');
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
        this.panel.showNotification(result.message, 'success');
        this.panel.closeModal('importExcelModal');
        document.getElementById('importExcelForm').reset();
        await this.panel.loadParcels();
        await this.panel.loadDashboardData();
        this.panel.renderParcelsTable();
      } else {
        throw new Error(result.error || 'Lỗi khi import Excel');
      }
    } catch (error) {
      console.error('Error:', error);
      this.panel.showNotification('Lỗi khi import Excel: ' + error.message, 'error');
    }
  }

  async importDxf() {
    const fileInput = document.getElementById('dxfFile');
    const file = fileInput.files[0];
    const projectId = document.getElementById('dxfProjectId').value || null;
    if (!file) {
      this.panel.showNotification('Vui lòng chọn file DXF', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/parse-dxf', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Lỗi khi parse DXF');
      }
      const geojson = await response.json();
      console.log('Parsed GeoJSON:', geojson);
      if (!geojson || !geojson.features || !Array.isArray(geojson.features)) {
        this.panel.showNotification('File DXF không hợp lệ hoặc không có dữ liệu', 'error');
        return;
      }
      let success = 0, fail = 0;
      for (const [i, feature] of geojson.features.entries()) {
        if (feature.geometry && feature.geometry.type === 'Polygon') {
          const properties = feature.properties || {};
          const parcelData = {
            parcel_code: `DXF${Date.now()}${i}`,
            project_id: projectId,
            title: properties.title || `DXF ${i + 1}`,
            area: properties.area || 0,
            description: properties.description || '',
            person_in_charge: properties.person_in_charge || '',
            legal_status: properties.legal_status || 'Chưa có',
            clearance_status: properties.clearance_status || 'Chưa GP',
            parcel_color: properties.parcel_color || '#3388ff',
            attachment: '',
            geometry: JSON.stringify(feature.geometry)
          };
          const res = await fetch('/api/parcels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parcelData)
          });
          if (res.ok) success++; else fail++;
        } else {
          fail++;
        }
      }
      this.panel.showNotification(`Import DXF hoàn tất: ${success} thành công, ${fail} lỗi`, success > 0 ? 'success' : 'error');
      this.panel.closeModal('importDxfModal');
      await this.panel.loadParcels();
    } catch (error) {
      this.panel.showNotification('Lỗi khi import DXF: ' + error.message, 'error');
    }
  }

  editParcel(parcelId) {
    const parcel = this.panel.parcels.find(p => p.id === parcelId);
    if (!parcel) return;
    document.getElementById('editParcelId').value = parcel.id;
    document.getElementById('editParcelCode').value = parcel.parcel_code || '';
    document.getElementById('editTitle').value = parcel.title || '';
    document.getElementById('editArea').value = parcel.area || '';
    document.getElementById('editDescription').value = parcel.description || '';
    document.getElementById('editPersonInCharge').value = parcel.person_in_charge || '';
    document.getElementById('editLegalStatus').value = parcel.legal_status || 'Chưa có';
    document.getElementById('editClearanceStatus').value = parcel.clearance_status || 'Chưa GP';
    document.getElementById('editParcelColor').value = parcel.parcel_color || '#3388ff';
    const projectSelect = document.getElementById('editProjectId');
    projectSelect.innerHTML = '<option value="">Chọn dự án</option>';
    this.panel.projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      if (project.id === parcel.project_id) option.selected = true;
      projectSelect.appendChild(option);
    });
    this.panel.showModal('editParcelModal');
  }

  deleteParcel(parcelId) {
    if (confirm('Bạn có chắc muốn xóa thửa đất này?')) {
      this.panel.showNotification('Chức năng xóa thửa đất đang phát triển');
    }
  }

  populateDxfProjectSelect() {
    const select = document.getElementById('dxfProjectId');
    select.innerHTML = '<option value="">Chọn dự án</option>';
    this.panel.projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      select.appendChild(option);
    });
  }

  filterParcels() {
    const projectFilter = document.getElementById('adminProjectFilter').value;
    const statusFilter = document.getElementById('adminStatusFilter').value;
    const filteredParcels = this.panel.parcels.filter(parcel => {
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
      const project = this.panel.projects.find(p => p.id === parcel.project_id);
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
            <button class="btn btn-sm btn-primary" onclick="adminPanel.parcelsModule.editParcel(${parcel.id})">Sửa</button>
            <button class="btn btn-sm btn-danger" onclick="adminPanel.parcelsModule.deleteParcel(${parcel.id})">Xóa</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  handlePaginationClick(e, type) {
    if (e.target.classList.contains('page-btn')) {
      const page = parseInt(e.target.getAttribute('data-page'));
      if (!isNaN(page)) {
        this.panel[type + 'Page'] = page;
        this.panel.renderParcelsTable();
      }
    }
  }
}
