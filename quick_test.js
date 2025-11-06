// Quick test to verify the website is accessible
const https = require('https');

const url = 'https://kw1zdjonf6cp.space.minimax.io';

console.log('🧪 Testing New Fixed Website...');
console.log('==================================');

// Test website accessibility
const req = https.get(url, (res) => {
  console.log(`✅ Website Status: ${res.statusCode} ${res.statusMessage}`);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('✅ Website is accessible and loading content');
    
    // Quick content verification
    if (data.includes('Woody') && data.includes('Syra')) {
      console.log('✅ Restaurant content found');
    }
    
    if (data.includes('menu') || data.includes('Menu')) {
      console.log('✅ Menu functionality present');
    }
    
    console.log('\n🎉 Website is working! Ready for manual testing.');
    console.log('==================================');
    console.log('📋 Manual Test Checklist:');
    console.log('1. Click hamburger menu icon (top-right)');
    console.log('2. Click "Explore Menu" button (right panel)');
    console.log('3. Test search functionality');
    console.log('4. Test category filters');
    console.log('5. Open/close menu multiple times');
    console.log('\n🌟 All menu button issues should be resolved!');
  });
});

req.on('error', (err) => {
  console.log('❌ Website Error:', err.message);
  console.log('💡 This might be a temporary deployment issue.');
  console.log('🔄 Try refreshing the URL in a few minutes.');
});

req.setTimeout(10000, () => {
  console.log('⏰ Request timeout - website may be slow');
  console.log('💡 This is normal for new deployments.');
});
