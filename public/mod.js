class QuickEditMap {
    constructor() {
        this.map = null;
        this.parcels = [];
        this.parcelsLayer = null;
        this.parcelLabels = [];
        this.currentEditIdx = -1;
        this.currentEditLayer = null;
        this.lastEditedIdx = -1;
        this.editedIdxList = []; // <-- Thêm dòng này
    }

    async init() {
        this.initMap();
        await this.loadParcels();
        this.renderParcels();
        this.updateParcelLabels();

        this.map.on('zoomend moveend', () => {
            this.updateParcelLabels();
        });
    }

    initMap() {
        this.map = L.map('map').setView([21.0999, 105.686332], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 22,
            attribution: '© TDEMap'
        }).addTo(this.map);

        this.parcelsLayer = L.geoJSON(null, {
            style: feature => ({
                color: '#3388ff',
                weight: 1,
                fillOpacity: 0.2,
                fillColor: '#3388ff'
            })
        }).addTo(this.map);
    }

    async loadParcels() {
        this.parcels = await fetch('/api/parcels').then(r => r.json());
    }

    renderParcels() {
        this.parcelsLayer.clearLayers();
        this.parcels.forEach(parcel => {
            const feature = {
                type: 'Feature',
                properties: parcel,
                geometry: JSON.parse(parcel.geometry)
            };
            this.parcelsLayer.addData(feature);
        });

        // Gán sự kiện click cho từng polygon
        this.parcelsLayer.eachLayer((layer) => {
            if (!layer.feature) return;
            layer.on('click', () => {
                const idx = this.parcels.findIndex(p => p.id === layer.feature.properties.id);
                this.currentEditIdx = idx;
                this.highlightPolygon(layer);
                this.updateParcelLabels();
                // Tìm marker label tương ứng
                const label = this.parcelLabels.find(l =>
                    l.getLatLng().equals(layer.getBounds().getCenter())
                );
                this.showQuickEditPopup(label || layer, layer.feature.properties, idx, layer);
            });
        });
    }

    updateParcelLabels() {
        if (this.parcelLabels) {
            this.parcelLabels.forEach(label => this.map.removeLayer(label));
        }
        this.parcelLabels = [];

        if (!this.map || this.map.getZoom() < 19) return;

        const bounds = this.map.getBounds();

        let idx = 0;
        this.parcelsLayer.eachLayer((layer) => {
            if (!layer.getBounds || !layer.feature) return;
            const center = layer.getBounds().getCenter();
            if (!bounds.contains(center)) return;

            // Nếu là thửa vừa sửa xong, label màu đỏ
            const highlightRed = (idx === this.lastEditedIdx);
            this.addParcelLabel(layer, layer.feature.properties, idx, highlightRed);
            idx++;
        });
    }

    addParcelLabel(layer, parcel, idx, highlightRed = false) {
        if (!this.map || this.map.getZoom() < 19) return;
        if (!layer.getBounds || !parcel.parcel_code) return;
        const center = layer.getBounds().getCenter();

        // Nếu là ô đã sửa, nền vàng nhạt
        const isEdited = this.editedIdxList && this.editedIdxList.includes(idx);
        const color = highlightRed ? '#c0392b' : '#888';
        const bg = isEdited ? 'background: #fffbe6;' : '';

        const label = L.marker(center, {
            icon: L.divIcon({
                className: 'parcel-label',
                html: `<span style="
                    font-size: 12px;
                    color: ${color};
                    font-weight: 600;
                    cursor: pointer;
                    text-shadow: 0 0 2px #fff, 0 0 2px #fff;
                    white-space: nowrap;
                    text-align: center;
                    ${bg}
                    ">${parcel.parcel_code}</span>`,
                iconSize: null,
                iconAnchor: null
            }),
            interactive: false // Không cần click, click polygon là đủ
        }).addTo(this.map);

        this.parcelLabels.push(label);
    }

    highlightPolygon(layer) {
        // Reset style cho tất cả polygon
        this.parcelsLayer.eachLayer(l => {
            this.parcelsLayer.resetStyle(l);
        });
        // Đổi style cho polygon đang sửa
        layer.setStyle({
            fillColor: '#fff',
            fillOpacity: 0.8,
            color: '#ff9800',
            weight: 2
        });
        this.currentEditLayer = layer;
    }

    showQuickEditPopup(labelOrLayer, parcel, idx, polygonLayer) {
         // Đóng popup cũ nếu có
        if (this.openPopupLayer && this.openPopupLayer.closePopup) {
            this.openPopupLayer.closePopup();
        }
        this.openPopupLayer = labelOrLayer; // Gán layer mới đang mở popup
        this.currentEditIdx = idx;
        this.highlightPolygon(polygonLayer);

        const popupContent = `
            <div class="quick-edit-popup">
                <label>Mã thửa:</label>
                <input id="quick-edit-input" type="text" value="${parcel.parcel_code || ''}" />
                <div style="margin-top:8px;">
                    <button id="btn-full-edit">Sửa đầy đủ</button>
                    <button id="btn-skip">Bỏ qua</button>
                </div>
            </div>
        `;
        labelOrLayer.bindPopup(popupContent, { closeOnClick: false, autoClose: false }).openPopup();

        setTimeout(() => {
            const input = document.getElementById('quick-edit-input');
            if (input) input.focus();

            if (input) {
                input.addEventListener('keydown', async (e) => {
                    if (e.key === 'Enter') {
                        await this.saveParcelCode(parcel, input.value, labelOrLayer, idx, polygonLayer);
                    }
                });
            }

            const btnFullEdit = document.getElementById('btn-full-edit');
            if (btnFullEdit) {
                btnFullEdit.onclick = () => {
                    this.showFullEditForm(parcel, idx);
                };
            }

            const btnSkip = document.getElementById('btn-skip');
            if (btnSkip) {
                btnSkip.onclick = () => {
                    labelOrLayer.closePopup();
                    this.resetPolygonStyle();
                    this.gotoNextParcel(idx);
                };
            }
        }, 200);
    }

    async saveParcelCode(parcel, newCode, labelOrLayer, idx, polygonLayer) {
        if (parcel.parcel_code === newCode) {
            this.showToast('Không có thay đổi mã thửa.');
            labelOrLayer.closePopup();
            this.resetPolygonStyle();
            this.gotoNextParcel(idx);
            return;
        }
        parcel.parcel_code = newCode;
        try {
            const res = await fetch(`/api/qparcels/${parcel.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parcel_code: newCode })
            });
            if (res.ok) {
                this.showToast('Đã lưu mã thửa thành công! ' + newCode);
                labelOrLayer.closePopup();
                this.lastEditedIdx = idx;
                if (!this.editedIdxList.includes(idx)) this.editedIdxList.push(idx); // <-- Thêm dòng này
                this.resetPolygonStyle();
                this.updateParcelLabels();
                this.gotoNextParcel(idx);
            } else {
                this.showToast('Lỗi lưu mã thửa!', true);
            }
        } catch (e) {
            this.showToast('Lỗi kết nối máy chủ!', true);
        }
    }

    resetPolygonStyle() {
        if (this.currentEditLayer) {
            this.parcelsLayer.resetStyle(this.currentEditLayer);
            this.currentEditLayer = null;
        }
    }

    gotoNextParcel(currentIdx) {
        // Tìm thửa tiếp theo trong viewport
        for (let i = currentIdx + 1; i < this.parcels.length; i++) {
            const layer = this.getLayerByParcelId(this.parcels[i].id);
            if (layer && this.map.getBounds().contains(layer.getBounds().getCenter())) {
                this.currentEditIdx = i;
                this.highlightPolygon(layer);
                this.updateParcelLabels();
                const label = this.parcelLabels.find(l =>
                    l.getLatLng().equals(layer.getBounds().getCenter())
                );
                this.showQuickEditPopup(label || layer, this.parcels[i], i, layer);
                return;
            }
        }
        this.showToast('Đã hết thửa đất trong vùng nhìn thấy.');
        this.currentEditIdx = -1;
        this.resetPolygonStyle();
        this.updateParcelLabels();
    }

    getLayerByParcelId(id) {
        let found = null;
        this.parcelsLayer.eachLayer(layer => {
            if (layer.feature && layer.feature.properties.id === id) found = layer;
        });
        return found;
    }

    showFullEditForm(parcel, idx) {
        alert('Hiện form sửa đầy đủ cho thửa đất: ' + parcel.id);
    }

    showToast(msg, isError = false) {
        let toast = document.getElementById('quick-edit-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'quick-edit-toast';
            document.body.appendChild(toast);
            toast.style.position = 'fixed';
            toast.style.bottom = '30px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.background = '#333';
            toast.style.color = '#fff';
            toast.style.padding = '10px 24px';
            toast.style.borderRadius = '6px';
            toast.style.fontSize = '16px';
            toast.style.zIndex = 9999;
            toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            toast.style.opacity = 0;
            toast.style.transition = 'opacity 0.3s';
        }
        toast.textContent = msg;
        toast.style.background = isError ? '#c0392b' : '#333';
        toast.style.opacity = 1;
        setTimeout(() => {
            toast.style.opacity = 0;
        }, 1800);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const app = new QuickEditMap();
    await app.init();
});