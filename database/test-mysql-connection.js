/**
 * Test MySQL Connection
 * اختبار الاتصال بقاعدة بيانات MySQL
 */

require('dotenv').config();
const { testConnection, query } = require('./utils/mysql');

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 اختبار الاتصال بقاعدة بيانات MySQL');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Host: ${process.env.MYSQL_HOST || 'localhost'}`);
    console.log(`Database: ${process.env.MYSQL_DATABASE || 'link_call_system'}`);
    console.log(`User: ${process.env.MYSQL_USER || 'root'}`);
    console.log('═══════════════════════════════════════════════════\n');

    try {
        // اختبار الاتصال
        const connected = await testConnection();
        
        if (!connected) {
            console.log('❌ فشل الاتصال بقاعدة البيانات');
            console.log('\n💡 تأكد من:');
            console.log('   1. تشغيل MySQL Server');
            console.log('   2. صحة بيانات الاتصال في ملف .env');
            console.log('   3. وجود قاعدة البيانات link_call_system');
            process.exit(1);
        }

        console.log('\n📊 اختبار الجداول...\n');

        // اختبار الجداول
        const tables = await query('SHOW TABLES');
        console.log(`✅ وجدنا ${tables.length} جدول:`);
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
        });

        // إحصائيات البيانات
        console.log('\n📈 إحصائيات البيانات:\n');

        const companiesCount = await query('SELECT COUNT(*) as count FROM companies');
        console.log(`   الشركات:        ${companiesCount[0].count}`);

        const employeesCount = await query('SELECT COUNT(*) as count FROM employees');
        console.log(`   الموظفون:       ${employeesCount[0].count}`);

        const contactsCount = await query('SELECT COUNT(*) as count FROM contacts');
        console.log(`   جهات الاتصال:   ${contactsCount[0].count}`);

        const recordingsCount = await query('SELECT COUNT(*) as count FROM recordings');
        console.log(`   التسجيلات:      ${recordingsCount[0].count}`);

        console.log('\n═══════════════════════════════════════════════════');
        console.log('✅ جميع الاختبارات نجحت!');
        console.log('═══════════════════════════════════════════════════');

    } catch (error) {
        console.error('\n❌ حدث خطأ:', error.message);
        console.log('\nتفاصيل الخطأ:');
        console.error(error);
        process.exit(1);
    }

    process.exit(0);
}

// تشغيل الاختبار
main();
