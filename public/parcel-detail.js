// Hiển thị chi tiết thửa đất theo id trên URL (?id=...)
async function fetchParcelDetail(id) {
    const res = await fetch(`/api/parcels/${id}`);
    if (!res.ok) throw new Error('Không tìm thấy thửa đất');
    return await res.json();
}

function renderDetail(parcel) {
    const numberFields = [
        'area','purchased_area','outside_area','expected_unit_price','expected_total_price','expected_broker_fee','expected_notary_fee','expected_total_cost','purchased_area_actual','outside_area_actual','total_purchased_area','unit_price','total_price','deposit','payment','broker_fee','notary_fee','total_cost','other_cost','yield_bonus','kpi_bonus','total_bonus','sheet_number','parcel_number'
    ];
    const fields = [
        { label: 'ID', key: 'id' },
        { label: 'Mã thửa đất', key: 'parcel_code' },
        { label: 'Tiêu đề', key: 'title' },
        { label: 'Mã dự án', key: 'project_id' },
        { label: 'Diện tích', key: 'area', suffix: 'm²' },
        { label: 'Người phụ trách', key: 'person_in_charge' },
        { label: 'Tình trạng pháp lý', key: 'legal_status' },
        { label: 'Tình trạng GPMB', key: 'clearance_status' },
        { label: 'Mục đích sử dụng đất', key: 'land_use_purpose' },
        { label: 'Chủ hộ', key: 'owner' },
        { label: 'Số tờ', key: 'sheet_number' },
        { label: 'Số thửa', key: 'parcel_number' },
        { label: 'Số sổ đỏ', key: 'red_book_number' },
        { label: 'Diện tích đất mua', key: 'purchased_area', suffix: 'm²' },
        { label: 'Diện tích đất ngoài', key: 'outside_area', suffix: 'm²' },
        { label: 'Cánh đồng', key: 'field' },
        { label: 'Địa chỉ đầy đủ', key: 'full_address' },
        { label: 'Thôn/xóm', key: 'hamlet' },
        { label: 'Xã/phường', key: 'ward' },
        { label: 'Tỉnh/thành', key: 'province' },
        { label: 'Đơn giá mua dự kiến', key: 'expected_unit_price' },
        { label: 'Thành tiền mua dự kiến', key: 'expected_total_price' },
        { label: 'Phí môi giới dự kiến', key: 'expected_broker_fee' },
        { label: 'Phí công chứng dự kiến', key: 'expected_notary_fee' },
        { label: 'Tổng chi phí dự kiến', key: 'expected_total_cost' },
        { label: 'Tình trạng giao dịch', key: 'transaction_status' },
        { label: 'Diện tích đã mua', key: 'purchased_area_actual', suffix: 'm²' },
        { label: 'Diện tích ngoài đã mua', key: 'outside_area_actual', suffix: 'm²' },
        { label: 'Tổng diện tích đã mua', key: 'total_purchased_area', suffix: 'm²' },
        { label: 'Tình trạng hồ sơ chuyển nhượng', key: 'transfer_doc_status' },
        { label: 'Tình trạng sang tên', key: 'name_transfer_status' },
        { label: 'Người nhận chuyển nhượng', key: 'transferee' },
        { label: 'Đơn giá mua', key: 'unit_price' },
        { label: 'Thành tiền mua', key: 'total_price' },
        { label: 'Đặt cọc', key: 'deposit' },
        { label: 'Thanh toán', key: 'payment' },
        { label: 'Phí môi giới', key: 'broker_fee' },
        { label: 'Phí công chứng', key: 'notary_fee' },
        { label: 'Tổng chi phí', key: 'total_cost' },
        { label: 'Chi phí khác', key: 'other_cost' },
        { label: 'Thưởng sản lượng', key: 'yield_bonus' },
        { label: 'Thưởng KPI', key: 'kpi_bonus' },
        { label: 'Tổng thưởng', key: 'total_bonus' },
        { label: 'Mô tả', key: 'description' },
        { label: 'Màu sắc thửa đất', key: 'parcel_color', render: v => `<span style='display:inline-block;width:24px;height:24px;background:${v};border:1px solid #ccc;'></span> ${v}` },
        { label: 'Ngày tạo', key: 'created_at' },
        { label: 'Ngày cập nhật', key: 'updated_at' },
        { label: 'Tệp đính kèm', key: 'attachment', render: v => v ? `<a href="${v}" target="_blank">${v}</a>` : '' },
        { label: 'GeoJSON', key: 'geometry', render: v => v ? `<details><summary>Xem</summary><pre style='max-height:200px;overflow:auto;'>${v}</pre></details>` : '' },
    ];
    let html = '<table class="table table-bordered table-striped">';
    for (const f of fields) {
        let val = parcel[f.key];
        if (f.render) val = f.render(val);
        else if (val == null || val === '') val = '<span class="text-muted">(trống)</span>';
        else if (numberFields.includes(f.key)) val = Number(val).toLocaleString('vi-VN');
        if (f.suffix && val && val.indexOf(f.suffix) === -1) val = val + ' ' + f.suffix;
        html += `<tr><th style="width:220px;">${f.label}</th><td>${val}</td></tr>`;
    }
    html += '</table>';
    html += '<div class="mt-3"><button class="btn btn-primary" id="editBtn"><i class="fas fa-edit"></i> Sửa</button></div>';
    document.getElementById('parcelDetailBody').innerHTML = html;
    document.getElementById('editBtn').onclick = () => renderEditForm(parcel);
}

function renderEditForm(parcel) {
    // Tạo form với tất cả trường, điền sẵn dữ liệu
    const numberFields = [
        'area','purchased_area','outside_area','expected_unit_price','expected_total_price','expected_broker_fee','expected_notary_fee','expected_total_cost','purchased_area_actual','outside_area_actual','total_purchased_area','unit_price','total_price','deposit','payment','broker_fee','notary_fee','total_cost','other_cost','yield_bonus','kpi_bonus','total_bonus','sheet_number','parcel_number'
    ];
    const fields = [
        { label: 'Mã thửa đất', key: 'parcel_code', required: true },
        { label: 'Tiêu đề', key: 'title', required: true },
        { label: 'Mã dự án', key: 'project_id' },
        { label: 'Diện tích', key: 'area', type: 'number' },
        { label: 'Người phụ trách', key: 'person_in_charge' },
        { label: 'Tình trạng pháp lý', key: 'legal_status' },
        { label: 'Tình trạng GPMB', key: 'clearance_status' },
        { label: 'Mục đích sử dụng đất', key: 'land_use_purpose' },
        { label: 'Chủ hộ', key: 'owner' },
        { label: 'Số tờ', key: 'sheet_number', type: 'number' },
        { label: 'Số thửa', key: 'parcel_number', type: 'number' },
        { label: 'Số sổ đỏ', key: 'red_book_number' },
        { label: 'Diện tích đất mua', key: 'purchased_area', type: 'number' },
        { label: 'Diện tích đất ngoài', key: 'outside_area', type: 'number' },
        { label: 'Cánh đồng', key: 'field' },
        { label: 'Địa chỉ đầy đủ', key: 'full_address' },
        { label: 'Thôn/xóm', key: 'hamlet' },
        { label: 'Xã/phường', key: 'ward' },
        { label: 'Tỉnh/thành', key: 'province' },
        { label: 'Đơn giá mua dự kiến', key: 'expected_unit_price', type: 'number' },
        { label: 'Thành tiền mua dự kiến', key: 'expected_total_price', type: 'number' },
        { label: 'Phí môi giới dự kiến', key: 'expected_broker_fee', type: 'number' },
        { label: 'Phí công chứng dự kiến', key: 'expected_notary_fee', type: 'number' },
        { label: 'Tổng chi phí dự kiến', key: 'expected_total_cost', type: 'number' },
        { label: 'Tình trạng giao dịch', key: 'transaction_status' },
        { label: 'Diện tích đã mua', key: 'purchased_area_actual', type: 'number' },
        { label: 'Diện tích ngoài đã mua', key: 'outside_area_actual', type: 'number' },
        { label: 'Tổng diện tích đã mua', key: 'total_purchased_area', type: 'number' },
        { label: 'Tình trạng hồ sơ chuyển nhượng', key: 'transfer_doc_status' },
        { label: 'Tình trạng sang tên', key: 'name_transfer_status' },
        { label: 'Người nhận chuyển nhượng', key: 'transferee' },
        { label: 'Đơn giá mua', key: 'unit_price', type: 'number' },
        { label: 'Thành tiền mua', key: 'total_price', type: 'number' },
        { label: 'Đặt cọc', key: 'deposit', type: 'number' },
        { label: 'Thanh toán', key: 'payment', type: 'number' },
        { label: 'Phí môi giới', key: 'broker_fee', type: 'number' },
        { label: 'Phí công chứng', key: 'notary_fee', type: 'number' },
        { label: 'Tổng chi phí', key: 'total_cost', type: 'number' },
        { label: 'Chi phí khác', key: 'other_cost', type: 'number' },
        { label: 'Thưởng sản lượng', key: 'yield_bonus', type: 'number' },
        { label: 'Thưởng KPI', key: 'kpi_bonus', type: 'number' },
        { label: 'Tổng thưởng', key: 'total_bonus', type: 'number' },
        { label: 'Mô tả', key: 'description' },
        { label: 'Màu sắc thửa đất', key: 'parcel_color', type: 'color' },
        { label: 'Tệp đính kèm', key: 'attachment' },
        { label: 'GeoJSON', key: 'geometry' },
    ];
    let html = `<form id="editParcelFormDetail">`;
    for (const f of fields) {
        let val = parcel[f.key] ?? '';
        let inputType = f.type || (numberFields.includes(f.key) ? 'number' : 'text');
        if (inputType === 'color') {
            html += `<div class="form-group"><label>${f.label}</label><input class="form-control" type="color" name="${f.key}" value="${val || '#3388ff'}"></div>`;
        } else if (f.key === 'geometry') {
            html += `<div class="form-group"><label>${f.label}</label><textarea class="form-control" name="${f.key}" rows="3">${val}</textarea></div>`;
        } else if (f.key === 'description') {
            html += `<div class="form-group"><label>${f.label}</label><textarea class="form-control" name="${f.key}" rows="2">${val}</textarea></div>`;
        } else if (inputType === 'number') {
            html += `<div class="form-group"><label>${f.label}</label><input class="form-control" type="number" name="${f.key}" value="${val}"></div>`;
        } else {
            html += `<div class="form-group"><label>${f.label}${f.required ? ' *' : ''}</label><input class="form-control" type="text" name="${f.key}" value="${val}" ${f.required ? 'required' : ''}></div>`;
        }
    }
    html += `<div class="form-actions mt-3"><button type="submit" class="btn btn-success">Lưu</button> <button type="button" class="btn btn-secondary" id="cancelEditBtn">Hủy</button></div></form>`;
    document.getElementById('parcelDetailBody').innerHTML = html;
    document.getElementById('cancelEditBtn').onclick = () => renderDetail(parcel);
    document.getElementById('editParcelFormDetail').onsubmit = async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {};
        for (const [k, v] of formData.entries()) {
            if (numberFields.includes(k)) data[k] = v === '' ? null : Number(v);
            else data[k] = v;
        }
        try {
            const res = await fetch(`/api/parcels/${parcel.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Lưu thất bại');
            const updated = await res.json();
            renderDetail(updated);
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };
}


function getIdFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get('id');
}

;(async function() {
    const id = getIdFromUrl();
    if (!id) {
        document.getElementById('parcelDetailBody').innerHTML = '<div class="alert alert-danger">Không tìm thấy ID thửa đất trên URL!</div>';
        return;
    }
    try {
        const parcel = await fetchParcelDetail(id);
        renderDetail(parcel);
    } catch (e) {
        document.getElementById('parcelDetailBody').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
})();
