const stage = document.getElementById('stage');
const snapToggle = document.getElementById('snapToggle');
const colorPicker = document.getElementById('colorPicker');
const counterDisplay = document.getElementById('counter-display');

let selectedElements = []; 
let clipboard = [];

const SNAP_SIZE = 5;

// 楽器のマスターデータ
const INSTRUMENTS = {
    conductor:  { icon: '指', color: '#333', textColor: '#fff', label: ' ', btnLabel: '指揮者', shape: 'square', hasBorder: true },
    chair:      { icon: 'O', color: '#ffadad', label: ' ',       btnLabel: '椅子',   shape: 'circle', hasBorder: true },
    cello:      { icon: 'ﾋﾟｱﾉ', color: '#ffd6a5', label: ' ',     btnLabel: 'ピアノ椅子', shape: 'circle', hasBorder: true },
    cb:         { icon: 'ﾊﾞｽ', color: '#fdffb6', label: ' ',     btnLabel: 'バス椅子', shape: 'circle', hasBorder: true },
    harp:       { icon: 'Hp',  color: '#caffbf', label: ' ',     btnLabel: 'ハープ', shape: 'square', hasBorder: true },
    harp_chair: { icon: 'H席', color: '#caffbf', label: ' ',       btnLabel: 'ハープ椅子', shape: 'circle', hasBorder: true },
    percussion: { icon: '打', color: '#ffc6ff', label: '打楽器',  btnLabel: '打楽器', shape: 'square', hasBorder: true },
    stand:      { icon: 'X',   color: '#dddddd', label: ' ',       btnLabel: '譜面台', shape: 'square', hasBorder: false }
};

// --- 基本機能 ---

function changeHallBackground() {
    const hall = document.getElementById('hallSelect').value;
    stage.className = ''; 
    if (hall !== 'none') stage.classList.add(hall);
}

function updateCount() {
    const counts = {};
    stage.querySelectorAll('.item').forEach(item => {
        const iconText = item.querySelector('.icon').innerText;
        counts[iconText] = (counts[iconText] || 0) + 1;
    });
    const textParts = [];
    for (let key in INSTRUMENTS) {
        const info = INSTRUMENTS[key];
        const num = counts[info.icon] || 0;
        if (num > 0) textParts.push(`${info.btnLabel}:${num}個`);
    }
    counterDisplay.innerText = textParts.length > 0 ? `【現在の楽器数】 ${textParts.join(' / ')}` : "舞台には何もありません";
}

function addItem(type) {
    const data = INSTRUMENTS[type];
    const size = document.getElementById('sizeSelect').value;
    const div = document.createElement('div');
    div.className = 'item';
    div.style.width = size + 'px';
    div.style.height = size + 'px';
    div.style.backgroundColor = data.color;
    div.style.color = data.textColor || '#000';
    if (data.shape === 'circle') div.style.borderRadius = '50%';
    div.style.border = data.hasBorder ? "2px solid #333" : "none";
    const fontSize = Math.floor(size / 2.5);
    div.style.fontSize = fontSize + 'px';
    div.style.left = '40px'; 
    div.style.top = '40px';
    div.innerHTML = `<span class="icon">${data.icon}</span><span class="label" style="display:none;"> </span>`;
    
    setupItemEvents(div);
    stage.appendChild(div);
    updateCount();
}

// --- イベント設定（移動・選択・編集） ---

function setupItemEvents(div) {
    // クリックで選択
    div.onclick = (e) => {
        e.stopPropagation();
        if (e.shiftKey) {
            if (selectedElements.includes(div)) {
                div.classList.remove('selected');
                selectedElements = selectedElements.filter(el => el !== div);
            } else {
                div.classList.add('selected');
                selectedElements.push(div);
            }
        } else {
            clearSelection();
            selectedElements = [div];
            div.classList.add('selected');
            colorPicker.value = rgbToHex(div.style.backgroundColor);
        }
    };

    // ダブルクリックで名前
    div.ondblclick = (e) => {
        const labelEl = div.querySelector('.label');
        const newName = prompt("名前（パート・奏者）を入力してください:", labelEl.innerText);
        if (newName !== null) {
            labelEl.innerText = newName;
            labelEl.style.display = newName.trim() === "" ? "none" : "block";
        }
    };

    // ドラッグ移動
    div.onmousedown = function(event) {
        if (event.button !== 0) return;
        const rect = div.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        let shiftX = event.clientX - rect.left;
        let shiftY = event.clientY - rect.top;

        function moveAt(clientX, clientY) {
            let newX = clientX - stageRect.left - shiftX;
            let newY = clientY - stageRect.top - shiftY;
            if (snapToggle.checked) {
                newX = Math.round(newX / SNAP_SIZE) * SNAP_SIZE;
                newY = Math.round(newY / SNAP_SIZE) * SNAP_SIZE;
            }
            div.style.left = newX + 'px'; 
            div.style.top = newY + 'px';
        }

        const onMouseMove = (e) => moveAt(e.clientX, e.clientY);
        document.addEventListener('mousemove', onMouseMove);
        document.onmouseup = () => document.removeEventListener('mousemove', onMouseMove);
    };
    div.ondragstart = () => false;
}

// --- 操作機能 ---

function deleteSelected() {
    if (selectedElements.length > 0 && confirm(`${selectedElements.length}個を削除しますか？`)) {
        selectedElements.forEach(el => el.remove());
        selectedElements = [];
        updateCount();
    }
}

function clearAll() {
    if (confirm('舞台を空にしますか？')) {
        stage.innerHTML = '';
        selectedElements = [];
        updateCount();
    }
}

function changeColor() {
    selectedElements.forEach(el => el.style.backgroundColor = colorPicker.value);
}

// --- 保存・読み込み ---

function saveLayout() {
    const items = [];
    const hall = document.getElementById('hallSelect').value;
    stage.querySelectorAll('.item').forEach(div => {
        items.push({
            icon: div.querySelector('.icon').innerText,
            label: div.querySelector('.label').innerText,
            isLabelVisible: div.querySelector('.label').style.display !== 'none',
            left: div.style.left,
            top: div.style.top,
            backgroundColor: div.style.backgroundColor,
            textColor: div.style.color,
            borderRadius: div.style.borderRadius,
            border: div.style.border,
            width: div.style.width,
            height: div.style.height,
            fontSize: div.style.fontSize
        });
    });
    const data = JSON.stringify({ hall: hall, items: items });
    localStorage.setItem('stageLayout_quick', data);
    alert('現在の配置を保存しました！');
}

function loadLayout() {
    const data = localStorage.getItem('stageLayout_quick');
    if (!data) return;
    const parsed = JSON.parse(data);
    const items = parsed.items || [];
    if (parsed.hall) {
        document.getElementById('hallSelect').value = parsed.hall;
        changeHallBackground();
    }
    stage.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.style.left = item.left; div.style.top = item.top;
        div.style.backgroundColor = item.backgroundColor;
        div.style.color = item.textColor;
        div.style.borderRadius = item.borderRadius;
        div.style.border = item.border;
        div.style.width = item.width; div.style.height = item.height;
        div.style.fontSize = item.fontSize;
        div.innerHTML = `<span class="icon">${item.icon}</span><span class="label" style="display:${item.isLabelVisible?'block':'none'}">${item.label}</span>`;
        setupItemEvents(div);
        stage.appendChild(div);
    });
    updateCount();
}


// --- PNG書き出し ---
async function exportImage() {
    clearSelection();

    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const scale = 2; // 高解像度で保存

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        alert('画像を作成できませんでした。');
        return;
    }

    ctx.scale(scale, scale);

    // 背景を描画
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const hall = document.getElementById('hallSelect').value;

    if (hall === 'hhf') {
        try {
            const bg = new Image();
            bg.src = 'hhf_pult.jpg';
            await bg.decode();

            // CSSの background-size: contain と同じ配置
            const ratio = Math.min(
                width / bg.naturalWidth,
                height / bg.naturalHeight
            );
            const w = bg.naturalWidth * ratio;
            const h = bg.naturalHeight * ratio;

            ctx.drawImage(
                bg,
                (width - w) / 2,
                (height - h) / 2,
                w,
                h
            );
        } catch (error) {
            console.error(error);
            alert('ホールの背景画像を読み込めませんでした。');
            return;
        }
    } else {
        // 白紙のグリッド
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;

        for (let x = 0; x <= width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, height);
            ctx.stroke();
        }

        for (let y = 0; y <= height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(width, y + 0.5);
            ctx.stroke();
        }
    }

    // センターライン
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(width / 2, 0, 1, height);

    // アイテムを描画
    stage.querySelectorAll('.item').forEach(item => {
        const style = getComputedStyle(item);
        const x = item.offsetLeft;
        const y = item.offsetTop;
        const w = item.offsetWidth;
        const h = item.offsetHeight;
        const circular = parseFloat(style.borderTopLeftRadius) >= w / 2;
        const borderWidth = parseFloat(style.borderTopWidth) || 0;

        ctx.save();
        ctx.beginPath();

        if (circular) {
            ctx.ellipse(
                x + w / 2, y + h / 2,
                w / 2, h / 2, 0, 0, Math.PI * 2
            );
        } else {
            ctx.rect(x, y, w, h);
        }

        ctx.fillStyle = style.backgroundColor;
        ctx.fill();

        if (borderWidth > 0 && style.borderTopStyle !== 'none') {
            ctx.strokeStyle = style.borderTopColor;
            ctx.lineWidth = borderWidth;
            ctx.stroke();
        }

        // アイコン
        const icon = item.querySelector('.icon');
        ctx.fillStyle = style.color;
        ctx.font = `bold ${style.fontSize} sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon.textContent, x + w / 2, y + h / 2);

        // 名前ラベル
        const label = item.querySelector('.label');
        if (label && getComputedStyle(label).display !== 'none') {
            const labelStyle = getComputedStyle(label);
            const text = label.textContent.trim();

            if (text) {
                const fontSize = parseFloat(labelStyle.fontSize);
                ctx.font = `${fontSize}px sans-serif`;

                const textWidth = ctx.measureText(text).width;
                const padding = 4;
                const labelWidth = textWidth + padding * 2;
                const labelHeight = fontSize + 4;
                const labelX = x + w / 2 - labelWidth / 2;
                const labelY = y + h * 1.05;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillRect(
                    labelX, labelY, labelWidth, labelHeight
                );

                ctx.fillStyle = labelStyle.color;
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    text,
                    x + w / 2,
                    labelY + labelHeight / 2
                );
            }
        }

        ctx.restore();
    });

    // PNGファイルとして保存
    canvas.toBlob(blob => {
        if (!blob) {
            alert('PNG画像の生成に失敗しました。');
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'orchestra_layout.png';
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
}


// --- ヘルパー ---

function clearSelection() {
    selectedElements.forEach(el => el.classList.remove('selected'));
    selectedElements = [];
}

function rgbToHex(rgb) {
    if (!rgb || !rgb.startsWith('rgb')) return rgb || '#ffffff';
    const vals = rgb.match(/\d+/g);
    return "#" + vals.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

// --- 初期化 ---

Object.keys(INSTRUMENTS).forEach(key => {
    const btn = document.createElement('button');
    btn.innerText = `${INSTRUMENTS[key].icon} ${INSTRUMENTS[key].btnLabel}`; 
    btn.onclick = () => addItem(key);
    document.getElementById('button-container').appendChild(btn);
});

stage.onclick = () => clearSelection();
window.onload = loadLayout;

// コピー＆ペースト
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'c' && selectedElements.length > 0) {
        clipboard = selectedElements.map(el => ({
            icon: el.querySelector('.icon').innerText,
            label: el.querySelector('.label').innerText,
            isLabelVisible: el.querySelector('.label').style.display !== 'none',
            backgroundColor: el.style.backgroundColor,
            textColor: el.style.color,
            borderRadius: el.style.borderRadius,
            border: el.style.border,
            width: el.style.width, height: el.style.height, fontSize: el.style.fontSize
        }));
    }
    if (e.ctrlKey && e.key === 'v' && clipboard.length > 0) {
        clearSelection();
        clipboard.forEach(data => {
            const div = document.createElement('div');
            div.className = 'item';
            Object.assign(div.style, {
                backgroundColor: data.backgroundColor, color: data.textColor,
                borderRadius: data.borderRadius, border: data.border,
                width: data.width, height: data.height, fontSize: data.fontSize,
                left: '60px', top: '60px', position: 'absolute'
            });
            div.innerHTML = `<span class="icon">${data.icon}</span><span class="label" style="display:${data.isLabelVisible?'block':'none'}">${data.label}</span>`;
            setupItemEvents(div);
            stage.appendChild(div);
            div.classList.add('selected');
            selectedElements.push(div);
        });
        updateCount();
    }
});
