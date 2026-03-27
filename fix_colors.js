const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/LandingPage.jsx',
  'frontend/src/pages/AdvertiserDashboard.jsx',
  'frontend/src/pages/DriverDashboard.jsx',
  'frontend/src/pages/AdminDashboard.jsx'
];

const colorMap = [
  { from: /#FBFEFD/g, to: '#ffffff' },
  { from: /#182210/g, to: '#111111' },
  { from: /#2F2420/g, to: '#222222' },
  { from: /#849753/g, to: '#FFBF00' },
  { from: /#AEAA43/g, to: '#D49800' },
  { from: /#2B4230/g, to: '#333333' },
  { from: /#5C6150/g, to: '#666666' },
  { from: /rgba\(43,66,48,/g, to: 'rgba(0,0,0,' },
  { from: /rgba\(132,151,83,/g, to: 'rgba(255,191,0,' },
  { from: /rgba\(174,170,67,/g, to: 'rgba(212,152,0,' },
  { from: /rgba\(47,36,32,/g, to: 'rgba(34,34,34,' },
  { from: /#F8F9F5/g, to: '#F5F5F5' },
  { from: /#F3F6EC/g, to: '#FFF8E6' },
  { from: /#9BA08F/g, to: '#999999' }
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  colorMap.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Colors fixed!');
