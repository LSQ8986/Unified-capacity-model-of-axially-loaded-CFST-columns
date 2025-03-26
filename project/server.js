const fs = require('fs');
const path = require('path');

function updateVisitCount() {
    const dataPath = path.join(__dirname, 'data.json');
    let data = JSON.parse(fs.readFileSync(dataPath));
    data.visitCount += 1;
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return data.visitCount;
}

// 在你的服务器路由中使用这个函数
app.get('/', (req, res) => {
    updateVisitCount();
    // 其他处理逻辑...
}); 