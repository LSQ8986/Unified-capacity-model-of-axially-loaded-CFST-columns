// 访问量统计
function updateVisitCount() {
    let visitCount = localStorage.getItem('visitCount');
    if (!visitCount) {
        visitCount = 1;
    } else {
        visitCount = parseInt(visitCount) + 1;
    }
    localStorage.setItem('visitCount', visitCount);
    document.getElementById('visitCount').innerHTML = `当前访问量(visitCount): ${visitCount}`;
}

window.onload = function () {
    updateVisitCount();
};

function downloadExcel() {
    const workbook = window.calculationResultWorkbook;
    if (!workbook) {
        console.error('工作簿未正确生成，请先进行批量计算。');
        return;
    }
    try {
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
        const buf = new ArrayBuffer(wbout.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;
        const blob = new Blob([buf], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'Results.xlsx';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('文件下载成功(File downloaded successfully)');
    } catch (error) {
        console.error('下载文件时出现错误:', error);
    }
} 