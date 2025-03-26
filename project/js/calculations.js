function calculateSingle() {
    const fy = parseFloat(document.getElementById('fy').value);
    const fc = parseFloat(document.getElementById('fc').value);
    const b = parseFloat(document.getElementById('b').value);
    const h = parseFloat(document.getElementById('h').value);
    const t = parseFloat(document.getElementById('t').value);
    const r0 = parseFloat(document.getElementById('r0').value);
    const L = parseFloat(document.getElementById('L').value);

    if (isNaN(fy) || isNaN(fc) || isNaN(b) || isNaN(h) || isNaN(t) || isNaN(r0) || isNaN(L) || b < h) {
        document.getElementById('singleResult').innerHTML = '请输入有效的数值，且 <i>b</i> ≥ <i>h</i>。';
        return;
    }

    const Nu = performCalculation(fy, fc, b, h, t, r0, L);
    document.getElementById('singleResult').innerHTML = `Axial load-bearing capacity <i>N</i><sub>u</sub> = ${Nu.toFixed(2)} kN`;
}

function calculateBatch() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        document.getElementById('batchResult').innerHTML = '请选择一个文件(Please choose a file)';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        let jsonData;
        if (file.name.endsWith('.txt')) {
            const text = e.target.result;
            const lines = text.split('\n');
            jsonData = lines.map(line => {
                line = line.trim();
                if (line) {
                    return line.split(/[,\s]+/).map(item => {
                        item = item.trim();
                        return parseFloat(item);
                    });
                }
                return null;
            }).filter(line => line !== null);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        }

        const results = [];
        results.push(['fy (MPa)', 'fc (MPa)', 'b (mm)', 'h (mm)', 't (mm)', 'r0 (mm)', 'L (mm)', 'Nu (kN)']);

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.length < 7) {
                results.push([...row, '数据项不足']);
                continue;
            }
            const fy = parseFloat(row[0]);
            const fc = parseFloat(row[1]);
            const b = parseFloat(row[2]);
            const h = parseFloat(row[3]);
            const t = parseFloat(row[4]);
            const r0 = parseFloat(row[5]);
            const L = parseFloat(row[6]);

            if (isNaN(fy) || isNaN(fc) || isNaN(b) || isNaN(h) || isNaN(t) || isNaN(r0) || isNaN(L) || b < h) {
                results.push([fy, fc, b, h, t, r0, L, '无效数据，需满足 <i>b</i> ≥ <i>h</i>']);
            } else {
                const Nu = performCalculation(fy, fc, b, h, t, r0, L);
                results.push([fy, fc, b, h, t, r0, L, Nu.toFixed(2)]);
            }
        }

        const newWorkbook = XLSX.utils.book_new();
        const newWorksheet = XLSX.utils.aoa_to_sheet(results);
        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, '计算结果(Results)');
        window.calculationResultWorkbook = newWorkbook;

        document.getElementById('batchResult').innerHTML = 'Calculation completed! Click the following button to download results';
        document.getElementById('downloadButton').style.display = 'block';
    };

    if (file.name.endsWith('.txt')) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

// 核心计算逻辑函数
function performCalculation(fy, fc, b, h, t, r0, L) {
    const D = h;
    const ita = 2 * t / (D - 2 * t) * fy / fc;
    const Rd_cc = Math.pow(1.67, Math.pow(1 + ita, -8)) * Math.pow((D - 2 * t), -(0.112 * Math.pow(0.0005, ita)));
    const fcm = fc * Rd_cc * (1 + 52 * Math.pow(fy, 0.1) * Math.pow(fc, -0.85) * Math.pow((D / t), -0.6));
    const fsm = 1.53 * Math.pow(fy, -0.05) * (1 - 0.002 * D / t) * fy;
    const Acc = Math.PI * Math.pow((D / 2 - t), 2);
    const Asc = Math.PI * Math.pow((D / 2), 2) - Acc;
    const Nuc = fcm * Acc + fsm * Asc;
    const fr = 1 + 0.003 * fc * (1 - Math.exp(r0 / h - 0.5));
    const fa = 1 + (0.002 * fc + 0.62) * (b / h - 1);

    const Es = 200000;
    const Is = Math.PI * (Math.pow(D, 4) - Math.pow(D - 2 * t, 4)) / 64;
    const Ec = 22000 * Math.pow((fc + 8) / 10, 0.3);
    const Ic = Math.PI * Math.pow(D - 2 * t, 4) / 64;
    const Ncr = Math.pow(Math.PI, 2) * (Es * Is + 0.6 * Ec * Ic) / Math.pow(L, 2);
    const N0 = fy * Asc + fc * Acc;
    const naga = Math.pow(N0 / Ncr, 0.5);
    const Rd_s = Math.min(1.2 * Math.exp(-0.7 * naga), 1);

    return Rd_s * fr * fa * Nuc / 1000;
} 