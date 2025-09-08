// TADT Map - Quản lý thửa đất
class TadtMap {
    constructor() {
        this.map = null;
        this.parcelsLayer = null;
        this.drawnItems = null;
        this.drawControl = null;
        this.selectedParcel = null;
        this.parcels = [];
        this.projects = [];
        
        this.init();
    }

    // Khởi tạo ứng dụng
    init() {
        this.initMap();
        this.initDrawingTools();
        this.bindEvents();
        this.loadParcels();
    }

    // Khởi tạo bản đồ Leaflet
    initMap() {
        
        // Tạo bản đồ với tọa độ mặc định (Hà Nội)
        this.map = L.map('map').setView([21.0999, 105.686332], 15);

        this.map.on('zoomend moveend', () => {
            // Xóa các label cũ
            if (this.parcelLabels) {
                this.parcelLabels.forEach(label => this.map.removeLayer(label));
            }
            this.parcelLabels = [];
            // Vẽ lại label cho từng thửa đất
            const bounds = this.map.getBounds();
            this.parcelsLayer.eachLayer((layer) => {
                // if (!layer.getBounds || !layer.feature) return;
                const center = layer.getBounds().getCenter();
                if (!bounds.contains(center)) return; // Bỏ qua nếu ngoài viewport
                if (layer.feature) {
                    this.addParcelLabel(layer, layer.feature.properties);
                }
            });
        });
        // Thêm tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 25,
            attribution: '© TDEMap'

        }).addTo(this.map);

        // Tạo layer cho các thửa đất
        this.parcelsLayer = L.geoJSON(null, {
            style: (feature) => this.getParcelStyle(feature),
            onEachFeature: (feature, layer) => this.onEachParcelFeature(feature, layer)
        }).addTo(this.map);

        // Tạo layer cho các polygon được vẽ
        this.drawnItems = new L.FeatureGroup();
        this.map.addLayer(this.drawnItems);
        //  this.map.on('zoomend', () => {
        //     const zoom = this.map.getZoom();
        //     let weight = 2;
        //     if (zoom >= 18) weight = 0.8;
        //     else if (zoom >= 16) weight = 0.6;
        //     else weight = 0.3;
        //     this.parcelsLayer.eachLayer(layer => {
        //         if (layer.setStyle) {
        //             layer.setStyle({ weight });
        //         }
        //     });

        //      //     const zoom = this.map.getZoom();
        //     // Xóa toàn bộ tooltip cũ
        //     // Xóa toàn bộ tooltip cũ
        //     if (this.parcelTooltips && this.parcelTooltips.length) {
        //         this.parcelTooltips.forEach(tip => {
        //             // if (tip.unbindTooltip) tip.unbindTooltip();
        //             if (tip.closeTooltip) tip.closeTooltip();
        //         });
        //         this.parcelTooltips = [];
        //     }
        //     if (zoom >= 18) {
        //         // Thêm lại tooltip cho các thửa đất
        //         this.parcelsLayer.eachLayer(layer => {
        //             if (layer.feature && layer.feature.properties && layer.feature.properties.parcel_code) {
        //                 layer.bindTooltip(layer.feature.properties.parcel_code, {
        //                     permanent: true,
        //                     direction: 'center',
        //                     className: 'parcel-label',
        //                 }).openTooltip();
        //                 this.parcelTooltips.push(layer);
        //             }
        //         });
        //     } else {
        //         // Ẩn tooltip khi zoom nhỏ hơn
        //         this.parcelsLayer.eachLayer(layer => {
        //             // if (layer.unbindTooltip) layer.unbindTooltip();
        //             if (layer.closeTooltip) layer.closeTooltip();
        //         });
        //         this.parcelTooltips = [];
        //     }
        // });
    }

    // Khởi tạo công cụ vẽ
    initDrawingTools() {
        this.drawControl = new L.Control.Draw({
            draw: {
                polygon: {
                    allowIntersection: false,
                    drawError: {
                        color: '#e1e100',
                        message: '<strong>Lỗi:</strong> Polygon không được cắt nhau!'
                    },
                    shapeOptions: {
                        color: '#3388ff',
                        weight: 0.8

                    }
                },
                polyline: false,
                circle: false,
                rectangle: false,
                circlemarker: false,
                marker: false
            },
            edit: {
                featureGroup: this.drawnItems,
                remove: false
            }
        });

        this.map.addControl(this.drawControl);

        // Xử lý sự kiện vẽ
        this.map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            this.drawnItems.addLayer(layer);
            this.createParcelFromDrawing(layer);
        });

        this.map.on(L.Draw.Event.EDITED, (e) => {
            const layers = e.layers;
            layers.eachLayer((layer) => {
                this.updateParcelGeometry(layer);
            });
        });
    }

    // Bind các sự kiện
    bindEvents() {
        // Import button
        document.getElementById('importBtn').addEventListener('click', () => {
            this.showImportModal();
        });

        // Login button
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showLoginModal();
        });

        // Add parcel button - removed from header, still available via drawing controls
        // Users can still add parcels by drawing on the map

        // Drawing controls
        document.getElementById('drawPolygonBtn').addEventListener('click', () => {
            this.startDrawing();
        });

        document.getElementById('editBtn').addEventListener('click', () => {
            this.startEditing();
        });

        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.deleteSelectedParcel();
        });

        // Filters
        document.getElementById('projectFilter').addEventListener('change', () => {
            this.filterParcels();
        });

        document.getElementById('personInChargeFilter').addEventListener('change', () => {
            this.filterParcels();
        });

        document.getElementById('legalStatusFilter').addEventListener('change', () => {
            this.filterParcels();
        });

        document.getElementById('clearanceStatusFilter').addEventListener('change', () => {
            this.filterParcels();
        });

        // Toggle filters button
        document.getElementById('toggleFiltersBtn').addEventListener('click', () => {
            this.toggleFilters();
        });

        // Toggle sidebar button (mobile)
        document.getElementById('sidebarToggleBtn').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Color picker events
        this.bindColorPickerEvents();

        // Modal events
        this.bindModalEvents();
    }

    // Bind sự kiện color picker
    bindColorPickerEvents() {
        const colorInput = document.getElementById('parcelColor');
        const colorPreview = document.getElementById('colorPreview');
        const colorValue = document.getElementById('colorValue');

        if (colorInput && colorPreview && colorValue) {
            // Cập nhật preview khi thay đổi màu
            colorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                this.updateColorPreview(color);
            });

            // Cập nhật preview khi thay đổi giá trị
            colorInput.addEventListener('change', (e) => {
                const color = e.target.value;
                this.updateColorPreview(color);
            });
        }
    }

    // Cập nhật color preview
    updateColorPreview(color) {
        const colorPreview = document.getElementById('colorPreview');
        const colorValue = document.getElementById('colorValue');
        
        if (colorPreview && colorValue) {
            colorPreview.style.backgroundColor = color;
            colorValue.textContent = color;
        }
    }

    // Bind sự kiện modal
    bindModalEvents() {
        // Parcel modal
        const parcelModal = document.getElementById('parcelModal');
        const closeBtn = parcelModal.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        window.closeModal = () => {
            this.closeModal();
        };

        // Import modal
        const importModal = document.getElementById('importModal');
        const importCloseBtn = importModal.querySelector('.close');
        
        importCloseBtn.addEventListener('click', () => {
            this.closeImportModal();
        });

        window.closeImportModal = () => {
            this.closeImportModal();
        };

        // Login modal
        const loginModal = document.getElementById('loginModal');
        const loginCloseBtn = loginModal.querySelector('.close');
        
        loginCloseBtn.addEventListener('click', () => {
            this.closeLoginModal();
        });

        window.closeLoginModal = () => {
            this.closeLoginModal();
        };

        // Form submit
        document.getElementById('parcelForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveParcel();
        });

        document.getElementById('importForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.importFile();
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target === parcelModal) {
                this.closeModal();
            }
            if (e.target === importModal) {
                this.closeImportModal();
            }
            if (e.target === loginModal) {
                this.closeLoginModal();
            }
        });
    }

    // Load danh sách thửa đất từ API
    async loadParcels() {
        try {
            // Lấy user hiện tại
            let currentUser = null;
            const token = localStorage.getItem('adminToken');
            if (token) {
                const resUser = await fetch('/api/auth/verify', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resUser.ok) {
                    currentUser = await resUser.json();
                }
            }
            // Lấy quyền user
            let allowedProjectIds = [];
            if (currentUser) {
                const resPerm = await fetch('/api/permissions');
                if (resPerm.ok) {
                    const perms = await resPerm.json();
                    allowedProjectIds = perms.filter(p => p.user_id == currentUser.id && p.can_view).map(p => p.project_id);
                }
            }
            // Lấy tất cả parcels
            const response = await fetch('/api/parcels');
            if (!response.ok) throw new Error('Lỗi khi tải dữ liệu');

            console.log('Zoom level:', this.map.getZoom());
            let allParcels = await response.json();
            // Nếu có phân quyền, chỉ lấy các thửa thuộc dự án user được xem
            if (allowedProjectIds.length > 0) {
                this.parcels = allParcels.filter(p => allowedProjectIds.includes(p.project_id));
            }
            if (currentUser && currentUser.role == 'superadmin') {                
                this.parcels = allParcels;
                console.log(currentUser.role);
            }           

            this.renderParcelsList();
            this.renderParcelsOnMap();
            // Load danh sách dự án và cập nhật bộ lọc
            await this.loadProjects();
            this.updateFilterOptions();
        } catch (error) {
            console.error('Lỗi:', error);
            this.showNotification('Lỗi khi tải dữ liệu thửa đất', 'error');
        }
    }

    // Load danh sách dự án
    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) throw new Error('Lỗi khi tải danh sách dự án');
            this.projects = await response.json();
            // Populate project select in modal form
            const projectSelect = document.getElementById('projectId');
            if (projectSelect) {
                projectSelect.innerHTML = '<option value="">Chọn dự án</option>';
                this.projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    projectSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Lỗi khi tải dự án:', error);
            this.projects = [];
        }
    }

    // Cập nhật các tùy chọn trong bộ lọc
    updateFilterOptions() {
        // Cập nhật filter dự án
        const projectFilter = document.getElementById('projectFilter');
        projectFilter.innerHTML = '<option value="">Tất cả dự án</option>';
        
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectFilter.appendChild(option);
        });

        // Cập nhật filter người phụ trách
        const personFilter = document.getElementById('personInChargeFilter');
        personFilter.innerHTML = '<option value="">Tất cả người phụ trách</option>';
        
        // Lấy danh sách unique người phụ trách
        const uniquePersons = [...new Set(this.parcels.map(p => p.person_in_charge).filter(Boolean))];
        uniquePersons.forEach(person => {
            const option = document.createElement('option');
            option.value = person;
            option.textContent = person;
            personFilter.appendChild(option);
        });
    }

    // Render danh sách thửa đất trong sidebar
    renderParcelsList() {
        const parcelsList = document.getElementById('parcelsList');
        parcelsList.innerHTML = '';

        if (this.parcels.length === 0) {
            parcelsList.innerHTML = '<p class="no-data">Chưa có thửa đất nào</p>';
            return;
        }

        this.parcels.forEach(parcel => {
            const parcelItem = this.createParcelListItem(parcel);
            parcelsList.appendChild(parcelItem);
        });
    }

    // Tạo item thửa đất trong sidebar
    createParcelListItem(parcel) {
        const div = document.createElement('div');
        div.className = 'parcel-item';
        div.dataset.id = parcel.id;
        
        // Tìm tên dự án
        const project = this.projects.find(p => p.id === parcel.project_id);
        const projectName = project ? project.name : 'Không có dự án';
        
        div.innerHTML = `
            <div class="parcel-title">${parcel.title}</div>
            <div class="parcel-info">Dự án: ${projectName}</div>
            <div class="parcel-info">Diện tích: ${parcel.area || 0} m²</div>
            <div class="parcel-info">Người phụ trách: ${parcel.person_in_charge || 'Chưa có'}</div>
            <div class="parcel-status status-legal status-legal-${parcel.legal_status}">${parcel.legal_status}</div>
            <div class="parcel-status status-clearance status-clearance-${parcel.clearance_status}">${parcel.clearance_status}</div>
        `;

        div.addEventListener('click', () => {
            this.selectParcel(parcel.id);
        });

        return div;
    }

    // Render thửa đất lên bản đồ
    renderParcelsOnMap() {
        // Xóa layer cũ
        this.parcelsLayer.clearLayers();
        // Xóa các label cũ nếu có
        if (this.parcelLabels) {
            this.parcelLabels.forEach(label => this.map.removeLayer(label));
        }
        this.parcelLabels = [];

        // Thêm các thửa đất mới
        const bounds = this.map.getBounds();          
        this.parcels.forEach(parcel => {
            try {
                const geometry = JSON.parse(parcel.geometry);
                const feature = {
                    type: 'Feature',
                    properties: parcel,
                    geometry: geometry
                };
                const layer = this.parcelsLayer.addData(feature).getLayers().slice(-1)[0];
                // Vẽ label mã thửa và diện tích
                const center = layer.getBounds().getCenter();
                if (!bounds.contains(center)) return; // Bỏ qua nếu ngoài viewport
                if (layer.feature) {
                    this.addParcelLabel(layer, layer.feature.properties);
                }
                // this.addParcelTooltip(layer, parcel);
                // this.addParcelLabel(layer, parcel);

            } catch (error) {
                console.error('Lỗi parse geometry cho thửa đất:', parcel.id, error);
            }
        });
    }
    addParcelTextPath(layer, parcel) {
        if (!layer.getLatLngs) return;
        if (!parcel.parcel_code) return;
        // Chỉ hiện ở mức zoom tối đa (ví dụ 18 trở lên)
        if (this.map.getZoom() < 18) return;

        // Lấy cạnh đầu tiên của polygon
        const latlngs = layer.getLatLngs()[0];
        if (!latlngs || latlngs.length < 2) return;

        // Tạo polyline từ cạnh đầu tiên
        const polyline = L.polyline([latlngs[0], latlngs[1]], {color: 'transparent'}).addTo(this.map);

        // Vẽ textPath
        polyline.setText(parcel.parcel_code, {
            repeat: false,
            center: true,
            offset: -2,
            attributes: {
                fill: '#222',
                'font-size': '8px',                
                'paint-order': 'stroke',
                'stroke': '#fff',
                'stroke-width': 0
            }
        });

        this.parcelLabels.push(polyline);
    }
    updateParcelTextPaths() {
        // Xóa các textPath cũ
        if (this.parcelLabels) {
            this.parcelLabels.forEach(label => {
                if (label && this.map.hasLayer(label)) this.map.removeLayer(label);
            });
        }
        this.parcelLabels = [];

        // Chỉ hiện ở mức zoom tối đa
        if (this.map.getZoom() < 18) return;

        this.parcelsLayer.eachLayer((layer) => {
            if (!layer.feature) return;
            this.addParcelTextPath(layer, layer.feature.properties);
        });
    }
    addParcelTooltip(layer, parcel) {
        console.log('Zoom hiện tại:', this.map.getZoom());
        if (!this.map || !this.map.getZoom || this.map.getZoom() < 18) return;
        if (!layer.getBounds || !parcel.parcel_code) return;
        layer.bindTooltip(parcel.parcel_code, {
            permanent: true,
            direction: "center",
            className: "parcel-label",
            opacity: 0.9
        }).openTooltip();


        this.parcelLabels.push(label);
    }

    addParcelLabel(layer, parcel) {
        console.log('Zoom hiện tại:', this.map.getZoom());
        if (!this.map || !this.map.getZoom || this.map.getZoom() < 19) return;
        if (!layer.getBounds || !parcel.parcel_code) return;
        const center = layer.getBounds().getCenter();

        // Không nền, chữ nhỏ, căn giữa
        let title = parcel.parcel_code || '';
        switch (this.map.getZoom()){
            case 20: title += `<br/>${parcel.description || ''}`; break;
            case 21: title += `<br/>${parcel.description || ''} <br/>${parcel.area || ''}m2`; break;
            case 22: title += `<br/>${parcel.description || ''} <br/>${parcel.area || ''}m2 <br/>${parcel.legal_status || ''} - ${parcel.clearance_status || ''}`; break;
            default: title += ''; break;
        }
        const label = L.marker(center, {
            icon: L.divIcon({
                className: 'parcel-label',
                html: `<span style=" font-size: 10px;
                color: #616161ff;               
                white-space: nowrap;
                text-align: center;">${title}
                </span>
                `,
                iconSize: [100, 20]

            }),
            interactive: false
        }).addTo(this.map);

        this.parcelLabels.push(label);
    }
    updateParcelLabels() {
        // Xóa các label cũ
        if (this.parcelLabels) {
            this.parcelLabels.forEach(label => this.map.removeLayer(label));
        }
        this.parcelLabels = [];

        // Chỉ hiện ở mức zoom tối đa (ví dụ: 18 trở lên)
        if (!this.map || this.map.getZoom() < 19) return;

        const bounds = this.map.getBounds();

        this.parcelsLayer.eachLayer((layer) => {
            if (!layer.getBounds || !layer.feature) return;
            const center = layer.getBounds().getCenter();
            if (!bounds.contains(center)) return; // Bỏ qua nếu ngoài viewport

            this.addParcelLabel(layer, layer.feature.properties);
        });
    }

    // Xử lý mỗi feature thửa đất
    onEachParcelFeature(feature, layer) {
        const parcel = feature.properties;
        // Tạo popup
        const popupContent = this.createParcelPopup(parcel);
        // Thay vì click, dùng mouseover/mouseout để hiện popup
        // layer.on('mouseover', function(e) {
        //     layer.openPopup();
        // });
        // layer.on('mouseout', function(e) {
        //     layer.closePopup();
        // });
        layer.bindPopup(popupContent);
        // Double click để edit
        layer.on('dblclick', () => {
            this.editParcel(parcel.id);
        });
    }

    // Tạo popup cho thửa đất
    createParcelPopup(parcel) {
        // Lấy tên dự án
        let projectName = 'Không có dự án';
        if (this.projects && parcel.project_id) {
            const project = this.projects.find(p => p.id == parcel.project_id);
            if (project) projectName = project.name;
        }
        return `
            <div class="popup-content">
                <h3>${parcel.title}</h3>
                <p><strong>Mã thửa:</strong> ${parcel.parcel_code || ''}</p>
                <p><strong>Dự án:</strong> ${projectName}</p>
                <p><strong>Diện tích:</strong> ${parcel.area || 0} m²</p>
                <p><strong>Mô tả:</strong> ${parcel.description || 'Chưa có'}</p>
                <p><strong>Người phụ trách:</strong> ${parcel.person_in_charge || 'Chưa có'}</p>
                <p><strong>Tình trạng pháp lý:</strong> ${parcel.legal_status}</p>
                <p><strong>Tình trạng GPMB:</strong> ${parcel.clearance_status}</p>
                <div class="popup-actions">
                    <button class="btn btn-primary btn-sm" onclick="tadtMap.editParcel(${parcel.id})">Sửa</button>
                    <button class="btn btn-danger btn-sm" onclick="tadtMap.deleteParcel(${parcel.id})">Xóa</button>
                </div>
            </div>
        `;
    }

    // Lấy style cho thửa đất
    getParcelStyle(feature) {
        const parcel = feature.properties;
        
        // Sử dụng màu tùy chỉnh nếu có, nếu không thì dùng màu mặc định theo trạng thái
        let fillColor = parcel.parcel_color || '#3388ff';
        
        // Nếu không có màu tùy chỉnh, sử dụng màu theo trạng thái
        if (!parcel.parcel_color) {
            if (parcel.legal_status === 'Đã xong') {
                fillColor = '#51cf66'; // Xanh lá
            } else if (parcel.legal_status === 'Đang xin') {
                fillColor = '#ffd43b'; // Vàng
            } else {
                fillColor = '#ff6b6b'; // Đỏ
            }
        }

        return {
            fillColor: fillColor,

            weight: 0.3,

            opacity: 1,
            color: '#495057',
            fillOpacity: 0.7
        };
    }

    // Chọn thửa đất
    selectParcel(parcelId) {
        // Bỏ chọn thửa đất cũ
        if (this.selectedParcel) {
            const oldItem = document.querySelector(`.parcel-item[data-id="${this.selectedParcel}"]`);
            if (oldItem) oldItem.classList.remove('selected');
        }

        // Chọn thửa đất mới
        this.selectedParcel = parcelId;
        const newItem = document.querySelector(`.parcel-item[data-id="${parcelId}"]`);
        if (newItem) newItem.classList.add('selected');

        // Tìm và highlight trên bản đồ
        this.parcelsLayer.eachLayer((layer) => {
            if (layer.feature && layer.feature.properties.id === parcelId) {
                this.highlightParcel(layer);
            }
        });
    }

    // Highlight thửa đất trên bản đồ
    highlightParcel(layer) {
        // Reset style cho tất cả
        this.parcelsLayer.eachLayer((l) => {
            if (l.feature) {
                l.setStyle(this.getParcelStyle(l.feature));
            }
        });

        // Highlight thửa đất được chọn
        layer.setStyle({
            weight: 2,
            color: '#007bff',
            fillOpacity: 0.9
        });

        // Zoom vừa đủ để nhìn rõ polygon và label, không giới hạn zoom
        const bounds = layer.getBounds();
        let targetZoom = this.map.getBoundsZoom(bounds, true);
        // Nếu polygon nhỏ, zoom to hơn nữa
        if (targetZoom < 18) targetZoom = Math.min(18, targetZoom + 2);
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: targetZoom });
    }

    // Hiển thị modal thêm thửa đất
    showAddParcelModal() {
        const modal = document.getElementById('parcelModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('parcelForm');
        const parcelId = document.getElementById('parcelId');

        modalTitle.textContent = 'Thêm thửa đất mới';
        form.reset();
        parcelId.value = '';
        
        // Reset color preview về màu mặc định
        this.updateColorPreview('#3388ff');
        
        modal.style.display = 'block';
    }

    // Hiển thị modal import
    showImportModal() {
        const modal = document.getElementById('importModal') || document.getElementById('importExcelModal');
        // Populate project select
        const projectSelect = document.getElementById('importProject');
        if (projectSelect && this.projects && this.projects.length) {
            projectSelect.innerHTML = '<option value="">-- Chọn dự án --</option>';
            this.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                projectSelect.appendChild(option);
            });
        }
        modal.style.display = 'block';
    }

    // Hiển thị modal login
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.style.display = 'block';
        
        // Bind login form event
        const loginForm = document.getElementById('loginForm');
        loginForm.onsubmit = (e) => this.handleLogin(e);
    }

    // Xử lý đăng nhập
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                if (data.role === 'superadmin' || data.role === 'admin') {
                    // Store session token instead of user ID
                    localStorage.setItem('adminToken', data.sessionToken);
                    this.showNotification('Đăng nhập thành công!', 'success');
                    this.closeLoginModal();
                    
                    // Redirect to admin panel
                    setTimeout(() => {
                        window.location.href = '/index.html';
                    }, 1000);
                } else {
                    this.showNotification('Bạn không có quyền truy cập trang admin', 'warning');
                }
            } else {
                this.showNotification(data.error || 'Đăng nhập thất bại', 'error');
            }
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            this.showNotification('Lỗi kết nối server', 'error');
        }
    }

    // Đóng modal
    closeModal() {
        const modal = document.getElementById('parcelModal');
        modal.style.display = 'none';
        
        // Xóa polygon khỏi drawing layer khi đóng modal
        this.drawnItems.clearLayers();
    }

    // Đóng modal import
    closeImportModal() {
        const modal = document.getElementById('importModal');
        modal.style.display = 'none';
    }

    // Đóng modal login
    closeLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.style.display = 'none';
        
        // Reset form
        document.getElementById('loginForm').reset();
    }

    // Lưu thửa đất
    async saveParcel() {
        const formData = new FormData(document.getElementById('parcelForm'));
        const parcelId = document.getElementById('parcelId').value;
        // Lấy dữ liệu từ form
        const parcelData = {
            parcel_code: formData.get('parcelCode'),
            project_id: formData.get('projectId') || null,
            title: formData.get('title'),
            area: parseFloat(formData.get('area')) || 0,
            description: formData.get('description'),
            person_in_charge: formData.get('personInCharge'),
            legal_status: formData.get('legalStatus'),
            clearance_status: formData.get('clearanceStatus'),
            parcel_color: formData.get('parcelColor'),
            attachment: formData.get('attachment') || '',
            geometry: this.getCurrentGeometry()
        };
        // Nếu đang sửa thửa đất và không có geometry mới, sử dụng geometry cũ
        if (!parcelData.geometry && parcelId) {
            const existingParcel = this.parcels.find(p => p.id == parcelId);
            if (existingParcel) {
                parcelData.geometry = existingParcel.geometry;
            }
        }
        // Kiểm tra các trường bắt buộc
        if (!parcelData.parcel_code || !parcelData.title || !parcelData.geometry) {
            this.showNotification('Vui lòng nhập đầy đủ mã thửa, tiêu đề và vẽ polygon!', 'warning');
            return;
        }
        try {
            let response;
            if (parcelId) {
                // Update
                response = await fetch(`/api/parcels/${parcelId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parcelData)
                });
            } else {
                // Create
                response = await fetch('/api/parcels', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parcelData)
                });
            }
            if (!response.ok) throw new Error('Lỗi khi lưu thửa đất');
            const savedParcel = await response.json();
            this.showNotification('Lưu thửa đất thành công!', 'success');
            this.closeModal();
            this.loadParcels();
            this.clearDrawing();
        } catch (error) {
            console.error('Lỗi:', error);
            this.showNotification('Lỗi khi lưu thửa đất', 'error');
        }
    }

    // Lấy geometry hiện tại từ drawing
    getCurrentGeometry() {
        if (this.drawnItems.getLayers().length === 0) return null;
        
        const layer = this.drawnItems.getLayers()[0];
        const coords = layer.getLatLngs()[0].map(latLng => [latLng.lng, latLng.lat]);
        
        return JSON.stringify({
            type: 'Polygon',
            coordinates: [coords]
        });
    }

    // Tạo thửa đất từ drawing
    createParcelFromDrawing(layer) {
        // Xóa các layer cũ
        this.drawnItems.clearLayers();
        
        // Thêm layer mới
        this.drawnItems.addLayer(layer);
        
        // Hiển thị modal để nhập thông tin
        this.showAddParcelModal();
    }

    // Cập nhật geometry của thửa đất
    updateParcelGeometry(layer) {
        if (!this.selectedParcel) return;
        
        const coords = layer.getLatLngs()[0].map(latLng => [latLng.lng, latLng.lat]);
        const geometry = JSON.stringify({
            type: 'Polygon',
            coordinates: [coords]
        });

        // Cập nhật vào database
        this.updateParcelGeometryInDB(this.selectedParcel, geometry);
    }

    // Cập nhật geometry vào database
    async updateParcelGeometryInDB(parcelId, geometry) {
        try {
            const parcel = this.parcels.find(p => p.id === parcelId);
            if (!parcel) return;

            const response = await fetch(`/api/parcels/${parcelId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...parcel,
                    geometry: geometry
                })
            });

            if (response.ok) {
                this.showNotification('Cập nhật hình dạng thành công!', 'success');
                this.loadParcels();
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật geometry:', error);
        }
    }

    // Edit thửa đất
    editParcel(parcelId) {
    const parcel = this.parcels.find(p => p.id === parcelId);
    if (!parcel) return;
    // Điền form
    document.getElementById('parcelId').value = parcel.id;
    document.getElementById('parcelCode').value = parcel.parcel_code || '';
    document.getElementById('projectId').value = parcel.project_id || '';
    document.getElementById('title').value = parcel.title;
    document.getElementById('area').value = parcel.area || '';
    document.getElementById('description').value = parcel.description || '';
    document.getElementById('personInCharge').value = parcel.person_in_charge || '';
    document.getElementById('legalStatus').value = parcel.legal_status;
    document.getElementById('clearanceStatus').value = parcel.clearance_status;
    document.getElementById('parcelColor').value = parcel.parcel_color || '#3388ff';
    // Cập nhật color preview
    this.updateColorPreview(parcel.parcel_color || '#3388ff');
    // Hiển thị file đính kèm hiện tại
    this.displayCurrentAttachments(parcel.attachment);
    // Hiển thị polygon hiện có trên drawing layer để người dùng có thể chỉnh sửa
    this.displayExistingParcelForEdit(parcel);
    // Hiển thị modal
    document.getElementById('modalTitle').textContent = 'Sửa thửa đất';
    document.getElementById('parcelModal').style.display = 'block';
    // Select thửa đất
    this.selectParcel(parcelId);
    }

    // Xóa thửa đất
    async deleteParcel(parcelId) {
        if (!confirm('Bạn có chắc chắn muốn xóa thửa đất này?')) return;

        try {
            const response = await fetch(`/api/parcels/${parcelId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Lỗi khi xóa thửa đất');

            this.showNotification('Đã xóa thửa đất thành công!', 'success');
            this.loadParcels();
            
            if (this.selectedParcel === parcelId) {
                this.selectedParcel = null;
            }
        } catch (error) {
            console.error('Lỗi:', error);
            this.showNotification('Lỗi khi xóa thửa đất', 'error');
        }
    }

    // Xóa thửa đất được chọn
    deleteSelectedParcel() {
        if (this.selectedParcel) {
            this.deleteParcel(this.selectedParcel);
        } else {
            this.showNotification('Vui lòng chọn thửa đất để xóa', 'warning');
        }
    }

    // Import file
    async importFile() {
    const formData = new FormData(document.getElementById('importForm') || document.getElementById('importExcelForm'));
    const importProjectId = document.getElementById('importProject') ? document.getElementById('importProject').value : '';
        const file = formData.get('importFile');
        const title = formData.get('importTitle');

        if (!file) {
            this.showNotification('Vui lòng chọn file', 'warning');
            return;
        }

        try {
            let geojson;

            if (file.name.toLowerCase().endsWith('.geojson') || file.name.toLowerCase().endsWith('.json')) {
                // Handle GeoJSON files
                const text = await file.text();
                try {
                    geojson = JSON.parse(text);
                } catch (parseError) {
                    this.showNotification('File JSON không hợp lệ', 'error');
                    console.error('Lỗi parse JSON:', parseError);
                    return;
                }
            } else if (file.name.toLowerCase().endsWith('.dxf')) {
                // Handle DXF files
                this.showNotification('Đang xử lý file DXF...', 'info');
                
                const dxfFormData = new FormData();
                dxfFormData.append('file', file);
                
                const response = await fetch('/api/parse-dxf', {
                    method: 'POST',
                    body: dxfFormData
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Lỗi khi parse file DXF');
                }
                
                geojson = await response.json();
                this.showNotification(`Đã parse thành công ${geojson.features.length} thửa đất từ DXF`, 'success');
            } else {
                this.showNotification('Định dạng file không được hỗ trợ. Chỉ hỗ trợ .dxf, .geojson, .json', 'error');
                return;
            }

            // Kiểm tra cấu trúc GeoJSON
            if (!geojson || typeof geojson !== 'object') {
                this.showNotification('File không hợp lệ', 'error');
                return;
            }

            // Xử lý GeoJSON
            console.log('GeoJSON:', geojson);
            if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
                if (geojson.features.length === 0) {
                    this.showNotification('File không có feature nào', 'warning');
                    return;
                }
                await this.importGeoJSONFeatures(geojson.features, title, importProjectId);
            } else if (geojson.type === 'Feature') {
                await this.importGeoJSONFeatures([geojson], title, importProjectId);
            } else {
                this.showNotification('File không hợp lệ. Cần có type là FeatureCollection hoặc Feature', 'error');
                return;
            }

            this.closeImportModal();
        } catch (error) {
            console.error('Lỗi import:', error);
            this.showNotification('Lỗi khi import file: ' + error.message, 'error');
        }
    }

    // Import các feature từ GeoJSON
    async importGeoJSONFeatures(features, baseTitle, importProjectId) {
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            if (feature.geometry && feature.geometry.type === 'Polygon') {
                try {
                    // Sử dụng thông tin từ properties nếu có
                    const properties = feature.properties || {};
                    const parcelData = {
                                title: properties.title || `${baseTitle}-${i + 1}`,
                                parcel_code: properties.parcel_code || `${baseTitle}-${i + 1}`,
                                area: properties.area || this.calculateArea(feature.geometry),
                                description: properties.description || `EntityHandle: ${properties.EntityHandle}` || '',
                                person_in_charge: properties.person_in_charge || '',
                                legal_status: properties.legal_status || '',
                                clearance_status: properties.clearance_status || '',
                                parcel_color: properties.parcel_color || '#dadadaff',
                                attachment: '',
                                geometry: JSON.stringify(feature.geometry),
                                project_id: importProjectId || properties.project_id || null
                            };
                    const response = await fetch('/api/parcels', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(parcelData)
                    });
                    if (response.ok) {
                        successCount++;
                        console.log(`Import thành công: ${parcelData.title}`);
                    } else {
                        const errorData = await response.json();
                        console.error(`Lỗi khi import ${parcelData.title}:`, errorData);
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`Lỗi khi import feature ${i + 1}:`, error);
                }
            } else {
                console.warn(`Feature ${i + 1} không phải Polygon hoặc thiếu geometry:`, feature);
                errorCount++;
            }
        }

        if (successCount > 0) {
            this.showNotification(
                `Import hoàn tất: ${successCount} thành công, ${errorCount} lỗi`, 
                'success'
            );
            // Reload danh sách thửa đất sau khi import thành công
            this.loadParcels();
        } else {
            this.showNotification(
                `Import thất bại: ${errorCount} lỗi`, 
                'error'
            );
        }
    }

    // Tính diện tích polygon
    calculateArea(geometry) {
        // Sử dụng công thức shoelace để tính diện tích
        if (geometry.type !== 'Polygon' || !geometry.coordinates || !geometry.coordinates[0]) {
            return 0;
        }

        const coords = geometry.coordinates[0];
        let area = 0;
        
        for (let i = 0; i < coords.length - 1; i++) {
            area += coords[i][0] * coords[i + 1][1];
            area -= coords[i + 1][0] * coords[i][1];
        }
        
        area = Math.abs(area) / 2;
        
        // Chuyển đổi từ độ sang mét (xấp xỉ)
        // 1 độ ≈ 111,000 mét
        return Math.round(area * 111000 * 111000);
    }

    // Bắt đầu vẽ
    startDrawing() {
        this.drawControl._toolbars.draw._modes.polygon.handler.enable();
    }

    // Bắt đầu chỉnh sửa
    startEditing() {
        if (this.selectedParcel) {
            this.drawControl._toolbars.edit._modes.edit.handler.enable();
        } else {
            this.showNotification('Vui lòng chọn thửa đất để sửa', 'warning');
        }
    }

    // Xóa drawing
    clearDrawing() {
        this.drawnItems.clearLayers();
    }

    // Lọc thửa đất
    filterParcels() {
        const projectFilter = document.getElementById('projectFilter').value;
        const personFilter = document.getElementById('personInChargeFilter').value;
        const legalFilter = document.getElementById('legalStatusFilter').value;
        const clearanceFilter = document.getElementById('clearanceStatusFilter').value;

        const filteredParcels = this.parcels.filter(parcel => {
            const projectMatch = !projectFilter || parcel.project_id == projectFilter;
            const personMatch = !personFilter || parcel.person_in_charge === personFilter;
            const legalMatch = !legalFilter || parcel.legal_status === legalFilter;
            const clearanceMatch = !clearanceFilter || parcel.clearance_status === clearanceFilter;
            return projectMatch && personMatch && legalMatch && clearanceMatch;
        });

        this.renderFilteredParcels(filteredParcels);
    }

    // Toggle hiển thị bộ lọc
    toggleFilters() {
        const filterControls = document.getElementById('filterControls');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (filterControls.classList.contains('show')) {
            filterControls.classList.remove('show');
            toggleIcon.textContent = '▼';
        } else {
            filterControls.classList.add('show');
            toggleIcon.textContent = '▲';
        }
    }

    // Toggle sidebar trên mobile
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebarToggleBtn');
        
        if (sidebar.classList.contains('expanded')) {
            sidebar.classList.remove('expanded');
            toggleBtn.textContent = '▼';
        } else {
            sidebar.classList.add('expanded');
            toggleBtn.textContent = '▲';
        }
    }

    // Render thửa đất đã lọc
    renderFilteredParcels(filteredParcels) {
        const parcelsList = document.getElementById('parcelsList');
        parcelsList.innerHTML = '';

        if (filteredParcels.length === 0) {
            parcelsList.innerHTML = '<p class="no-data">Không tìm thấy thửa đất nào</p>';
            return;
        }

        filteredParcels.forEach(parcel => {
            const parcelItem = this.createParcelListItem(parcel);
            parcelsList.appendChild(parcelItem);
        });
    }

    // Hiển thị polygon hiện có trên drawing layer để chỉnh sửa
    displayExistingParcelForEdit(parcel) {
        try {
            // Xóa các layer cũ trong drawing
            this.drawnItems.clearLayers();
            
            // Parse geometry từ parcel
            const geometry = JSON.parse(parcel.geometry);
            
            if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates[0]) {
                // Tạo polygon từ coordinates
                const coords = geometry.coordinates[0].map(coord => [coord[1], coord[0]]); // [lat, lng]
                const polygon = L.polygon(coords, {
                    color: parcel.parcel_color || '#3388ff',
                    weight: 0.8,
                    fillOpacity: 0.3
                });
                
                // Thêm vào drawing layer
                this.drawnItems.addLayer(polygon);
                
                // Zoom đến polygon
                this.map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
            }
        } catch (error) {
            console.error('Lỗi khi hiển thị polygon để chỉnh sửa:', error);
        }
    }

    // Hiển thị file đính kèm hiện tại
    displayCurrentAttachments(attachmentString) {
        const currentAttachment = document.getElementById('currentAttachment');
        
        if (!attachmentString) {
            currentAttachment.innerHTML = '';
            return;
        }

        try {
            const attachments = JSON.parse(attachmentString);
            let html = '';
            
            if (Array.isArray(attachments)) {
                attachments.forEach(attachment => {
                    html += this.createAttachmentItem(attachment);
                });
            } else if (typeof attachments === 'object') {
                html += this.createAttachmentItem(attachment);
            } else {
                // Nếu là string đơn giản
                html += this.createAttachmentItem({ filename: attachmentString, path: attachmentString });
            }
            
            currentAttachment.innerHTML = html;
        } catch (error) {
            // Nếu không parse được JSON, hiển thị như string đơn giản
            currentAttachment.innerHTML = this.createAttachmentItem({ filename: attachmentString, path: attachmentString });
        }
    }

    // Tạo HTML cho item file đính kèm
    createAttachmentItem(attachment) {
        const filename = attachment.filename || attachment.path || 'Unknown file';
        const path = attachment.path || attachment.filename || '';
        const size = attachment.size || '';
        
        return `
            <div class="attachment-item">
                <div class="file-icon">📎</div>
                <div class="file-info">
                    <div class="file-name">${filename}</div>
                    ${size ? `<div class="file-size">${this.formatFileSize(size)}</div>` : ''}
                </div>
                <div class="file-actions">
                    <button type="button" class="btn btn-primary btn-sm" onclick="tadtMap.downloadFile('${path}')">Tải</button>
                    <button type="button" class="btn btn-info btn-sm" onclick="tadtMap.viewFile('${path}')">Xem</button>
                </div>
            </div>
        `;
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Tải file
    downloadFile(filePath) {
        const link = document.createElement('a');
        link.href = `/uploads/${filePath}`;
        link.download = filePath.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Xem file
    viewFile(filePath) {
        const fileUrl = `/uploads/${filePath}`;
        const fileExtension = filePath.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
            // Mở ảnh trong tab mới
            window.open(fileUrl, '_blank');
        } else if (['pdf'].includes(fileExtension)) {
            // Mở PDF trong tab mới
            window.open(fileUrl, '_blank');
        } else {
            // Tải file xuống
            this.downloadFile(filePath);
        }
    }

    // Hiển thị thông báo
    showNotification(message, type = 'info') {
        // Tạo notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style cho notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '3000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Màu sắc theo type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;

        // Thêm vào DOM
        document.body.appendChild(notification);

        // Hiển thị
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Tự động ẩn sau 3 giây
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Khởi tạo ứng dụng khi trang đã load
document.addEventListener('DOMContentLoaded', () => {
    window.tadtMap = new TadtMap();
});

// Global functions cho popup
function editParcel(id) {
    if (window.tadtMap) {
        window.tadtMap.editParcel(id);
    }
}

function deleteParcel(id) {
    if (window.tadtMap) {
        window.tadtMap.deleteParcel(id);
    }
}