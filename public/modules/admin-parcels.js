// Module quản lý thửa đất
export default class AdminParcels {
  // Phân trang: mặc định 25 item/page
  page = 1;
  itemsPerPage = 25;
  totalPages = 1;

  setPage(page) {
    this.page = page;
    this.render();
  }

  getPagedParcels() {
    const start = (this.page - 1) * this.itemsPerPage;
    return (this.panel.filteredParcels || this.panel.parcels || []).slice(start, start + this.itemsPerPage);
  }

  renderPagination() {
    const total = (this.panel.filteredParcels || this.panel.parcels || []).length;
    this.totalPages = Math.ceil(total / this.itemsPerPage) || 1;
    const $pagination = $("#parcelsPagination");
    $pagination.empty();
    if (this.totalPages <= 1) return;
    let html = '';
    html += `<li class="page-item${this.page === 1 ? ' disabled' : ''}"><a class="page-link" href="#" data-page="${this.page - 1}"><i class="fas fa-angle-left"></i></a></li>`;
    for (let i = 1; i <= this.totalPages; i++) {
      html += `<li class="page-item${i === this.page ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    html += `<li class="page-item${this.page === this.totalPages ? ' disabled' : ''}"><a class="page-link" href="#" data-page="${this.page + 1}"><i class="fas fa-angle-right"></i></a></li>`;
    $pagination.html(html);
    $pagination.find('a.page-link').off('click').on('click', (e) => {
      e.preventDefault();
      const p = parseInt($(e.target).closest('a').data('page'));
      if (p >= 1 && p <= this.totalPages && p !== this.page) this.setPage(p);
    });
  }
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
    // Chuyển đổi dữ liệu sang định dạng phù hợp (đầy đủ trường)
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
      'Mô tả': parcel.description,
      'Mục đích sử dụng đất': parcel.land_use_purpose,
      'Chủ hộ': parcel.owner,
      'Số tờ': parcel.sheet_number,
      'Số thửa': parcel.parcel_number,
      'Số sổ đỏ': parcel.red_book_number,
      'Diện tích đất mua': parcel.purchased_area,
      'Diện tích đất ngoài': parcel.outside_area,
      'Cánh đồng': parcel.field,
      'Địa chỉ đầy đủ': parcel.full_address,
      'Thôn/xóm': parcel.hamlet,
      'Xã/phường': parcel.ward,
      'Tỉnh/thành': parcel.province,
      'Đơn giá mua dự kiến': parcel.expected_unit_price,
      'Thành tiền mua dự kiến': parcel.expected_total_price,
      'Phí môi giới dự kiến': parcel.expected_broker_fee,
      'Phí công chứng dự kiến': parcel.expected_notary_fee,
      'Tổng chi phí dự kiến': parcel.expected_total_cost,
      'Tình trạng giao dịch': parcel.transaction_status,
      'Diện tích đã mua': parcel.purchased_area_actual,
      'Diện tích ngoài đã mua': parcel.outside_area_actual,
      'Tổng diện tích đã mua': parcel.total_purchased_area,
      'Tình trạng hồ sơ chuyển nhượng': parcel.transfer_doc_status,
      'Tình trạng sang tên': parcel.name_transfer_status,
      'Người nhận chuyển nhượng': parcel.transferee,
      'Đơn giá mua': parcel.unit_price,
      'Thành tiền mua': parcel.total_price,
      'Đặt cọc': parcel.deposit,
      'Thanh toán': parcel.payment,
      'Phí môi giới': parcel.broker_fee,
      'Phí công chứng': parcel.notary_fee,
      'Tổng chi phí': parcel.total_cost,
      'Chi phí khác': parcel.other_cost,
      'Thưởng sản lượng': parcel.yield_bonus,
      'Thưởng KPI': parcel.kpi_bonus,
      'Tổng thưởng': parcel.total_bonus
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
    // Đọc file excel client-side, cập nhật từng thửa theo mã thửa
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = window.XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
      let success = 0, fail = 0;
      for (const row of rows) {
        const code = row['Mã thửa đất'] || row['parcel_code'] || row['ma_thua'] || row['Ma thua'];
        if (!code) continue;
        // Tìm parcel theo mã thửa
        const parcel = this.panel.parcels.find(p => p.parcel_code == code);
        if (!parcel) { fail++; continue; }
        // Map các trường mới
        const updateData = {
          parcel_code: code,
          title: row['Tiêu đề'] || row['title'] || parcel.title,
          project_id: row['Mã dự án'] || row['project_id'] || parcel.project_id,
          area: parseFloat(row['Diện tích'] || row['area'] || parcel.area) || 0,
          description: row['Mô tả'] || row['description'] || parcel.description,
          person_in_charge: row['Người phụ trách'] || row['person_in_charge'] || parcel.person_in_charge,
          legal_status: row['Tình trạng pháp lý'] || row['legal_status'] || parcel.legal_status,
          clearance_status: row['Tình trạng GPMB'] || row['clearance_status'] || parcel.clearance_status,
          parcel_color: row['Màu sắc'] || row['parcel_color'] || parcel.parcel_color,
          // Các trường mới:
          land_use_purpose: row['Mục đích sử dụng đất'] || row['land_use_purpose'] || parcel.land_use_purpose,
          owner: row['Chủ hộ'] || row['owner'] || parcel.owner,
          sheet_number: row['Số tờ'] || row['sheet_number'] || parcel.sheet_number,
          parcel_number: row['Số thửa'] || row['parcel_number'] || parcel.parcel_number,
          red_book_number: row['Số sổ đỏ'] || row['red_book_number'] || parcel.red_book_number,
          purchased_area: row['Diện tích đất mua'] || row['purchased_area'] || parcel.purchased_area,
          outside_area: row['Diện tích đất ngoài'] || row['outside_area'] || parcel.outside_area,
          field: row['Cánh đồng'] || row['field'] || parcel.field,
          full_address: row['Địa chỉ đầy đủ'] || row['full_address'] || parcel.full_address,
          hamlet: row['Thôn/xóm'] || row['hamlet'] || parcel.hamlet,
          ward: row['Xã/phường'] || row['ward'] || parcel.ward,
          province: row['Tỉnh/thành'] || row['province'] || parcel.province,
          expected_unit_price: row['Đơn giá mua dự kiến'] || row['expected_unit_price'] || parcel.expected_unit_price,
          expected_total_price: row['Thành tiền mua dự kiến'] || row['expected_total_price'] || parcel.expected_total_price,
          expected_broker_fee: row['Phí môi giới dự kiến'] || row['expected_broker_fee'] || parcel.expected_broker_fee,
          expected_notary_fee: row['Phí công chứng dự kiến'] || row['expected_notary_fee'] || parcel.expected_notary_fee,
          expected_total_cost: row['Tổng chi phí dự kiến'] || row['expected_total_cost'] || parcel.expected_total_cost,
          transaction_status: row['Tình trạng giao dịch'] || row['transaction_status'] || parcel.transaction_status,
          purchased_area_actual: row['Diện tích đã mua'] || row['purchased_area_actual'] || parcel.purchased_area_actual,
          outside_area_actual: row['Diện tích ngoài đã mua'] || row['outside_area_actual'] || parcel.outside_area_actual,
          total_purchased_area: row['Tổng diện tích đã mua'] || row['total_purchased_area'] || parcel.total_purchased_area,
          transfer_doc_status: row['Tình trạng hồ sơ chuyển nhượng'] || row['transfer_doc_status'] || parcel.transfer_doc_status,
          name_transfer_status: row['Tình trạng sang tên'] || row['name_transfer_status'] || parcel.name_transfer_status,
          transferee: row['Người nhận chuyển nhượng'] || row['transferee'] || parcel.transferee,
          unit_price: row['Đơn giá mua'] || row['unit_price'] || parcel.unit_price,
          total_price: row['Thành tiền mua'] || row['total_price'] || parcel.total_price,
          deposit: row['Đặt cọc'] || row['deposit'] || parcel.deposit,
          payment: row['Thanh toán'] || row['payment'] || parcel.payment,
          broker_fee: row['Phí môi giới'] || row['broker_fee'] || parcel.broker_fee,
          notary_fee: row['Phí công chứng'] || row['notary_fee'] || parcel.notary_fee,
          total_cost: row['Tổng chi phí'] || row['total_cost'] || parcel.total_cost,
          other_cost: row['Chi phí khác'] || row['other_cost'] || parcel.other_cost,
          yield_bonus: row['Thưởng sản lượng'] || row['yield_bonus'] || parcel.yield_bonus,
          kpi_bonus: row['Thưởng KPI'] || row['kpi_bonus'] || parcel.kpi_bonus,
          total_bonus: row['Tổng thưởng'] || row['total_bonus'] || parcel.total_bonus,
        };
        try {
          const response = await fetch(`/api/parcels/${parcel.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });
          if (response.ok) success++; else fail++;
        } catch (e) { fail++; }
      }
      this.panel.showNotification(`Import hoàn tất: ${success} thành công, ${fail} lỗi`, success > 0 ? 'success' : 'error');
      this.panel.closeModal('importExcelModal');
      document.getElementById('importExcelForm').reset();
      await this.panel.loadParcels();
      await this.panel.loadDashboardData();
    this.panel.renderParcelsTable();
    this.renderPagination();
    };
    reader.readAsArrayBuffer(file);
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
    // Các trường mới:
    document.getElementById('editOwner').value = parcel.owner || '';
    document.getElementById('editSheetNumber').value = parcel.sheet_number || '';
    document.getElementById('editParcelNumber').value = parcel.parcel_number || '';
    document.getElementById('editRedBookNumber').value = parcel.red_book_number || '';
    document.getElementById('editPurchasedArea').value = parcel.purchased_area || '';
    document.getElementById('editOutsideArea').value = parcel.outside_area || '';
    document.getElementById('editField').value = parcel.field || '';
    document.getElementById('editFullAddress').value = parcel.full_address || '';
    document.getElementById('editHamlet').value = parcel.hamlet || '';
    document.getElementById('editWard').value = parcel.ward || '';
    document.getElementById('editProvince').value = parcel.province || '';
    document.getElementById('editExpectedUnitPrice').value = parcel.expected_unit_price || '';
    document.getElementById('editExpectedTotalPrice').value = parcel.expected_total_price || '';
    document.getElementById('editExpectedBrokerFee').value = parcel.expected_broker_fee || '';
    document.getElementById('editExpectedNotaryFee').value = parcel.expected_notary_fee || '';
    document.getElementById('editExpectedTotalCost').value = parcel.expected_total_cost || '';
    document.getElementById('editTransactionStatus').value = parcel.transaction_status || '';
    document.getElementById('editPurchasedAreaActual').value = parcel.purchased_area_actual || '';
    document.getElementById('editOutsideAreaActual').value = parcel.outside_area_actual || '';
    document.getElementById('editTotalPurchasedArea').value = parcel.total_purchased_area || '';
    document.getElementById('editTransferDocStatus').value = parcel.transfer_doc_status || '';
    document.getElementById('editNameTransferStatus').value = parcel.name_transfer_status || '';
    document.getElementById('editTransferee').value = parcel.transferee || '';
    document.getElementById('editUnitPrice').value = parcel.unit_price || '';
    document.getElementById('editTotalPrice').value = parcel.total_price || '';
    document.getElementById('editDeposit').value = parcel.deposit || '';
    document.getElementById('editPayment').value = parcel.payment || '';
    document.getElementById('editBrokerFee').value = parcel.broker_fee || '';
    document.getElementById('editNotaryFee').value = parcel.notary_fee || '';
    document.getElementById('editTotalCost').value = parcel.total_cost || '';
    document.getElementById('editOtherCost').value = parcel.other_cost || '';
    document.getElementById('editYieldBonus').value = parcel.yield_bonus || '';
    document.getElementById('editKpiBonus').value = parcel.kpi_bonus || '';
    document.getElementById('editTotalBonus').value = parcel.total_bonus || '';

    // Fill select options từ constants (nếu chưa có)
    // Đảm bảo constants đã được import vào file này
    if (window.LAND_USE_PURPOSES) {
      const landUseSelect = document.getElementById('editLandUsePurpose');
      landUseSelect.innerHTML = '<option value="">Chọn mục đích</option>';
      window.LAND_USE_PURPOSES.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (parcel.land_use_purpose === opt.value) option.selected = true;
        landUseSelect.appendChild(option);
      });
    }
    if (window.TRANSACTION_STATUSES) {
      const tranSelect = document.getElementById('editTransactionStatus');
      tranSelect.innerHTML = '<option value="">Chọn tình trạng</option>';
      window.TRANSACTION_STATUSES.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (parcel.transaction_status === opt.value) option.selected = true;
        tranSelect.appendChild(option);
      });
    }
    if (window.TRANSFER_DOC_STATUSES) {
      const docSelect = document.getElementById('editTransferDocStatus');
      docSelect.innerHTML = '<option value="">Chọn tình trạng</option>';
      window.TRANSFER_DOC_STATUSES.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (parcel.transfer_doc_status === opt.value) option.selected = true;
        docSelect.appendChild(option);
      });
    }
    if (window.NAME_TRANSFER_STATUSES) {
      const nameSelect = document.getElementById('editNameTransferStatus');
      nameSelect.innerHTML = '<option value="">Chọn tình trạng</option>';
      window.NAME_TRANSFER_STATUSES.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (parcel.name_transfer_status === opt.value) option.selected = true;
        nameSelect.appendChild(option);
      });
    }
    // Dự án
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
  // Phân trang dữ liệu
  const paged = this.getPagedParcels();
  this.renderFilteredParcels(paged);
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
