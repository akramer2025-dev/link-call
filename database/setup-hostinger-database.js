/**
 * Setup MySQL Database for Hostinger
 * تجهيز قاعدة بيانات MySQL على Hostinger
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔧 تجهيز قاعدة بيانات MySQL على Hostinger');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Host: ${process.env.MYSQL_HOST}`);
    console.log(`Database: ${process.env.MYSQL_DATABASE}`);
    console.log(`User: ${process.env.MYSQL_USER}`);
    console.log('═══════════════════════════════════════════════════\n');

    let connection;
    
    try {
        // الاتصال بقاعدة البيانات
        console.log('🔌 جاري الاتصال بقاعدة البيانات...');
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            charset: 'utf8mb4'
        });
        
        console.log('✅ تم الاتصال بنجاح!\n');

        // قراءة ملف SQL
        console.log('📖 قراءة ملف database_schema.sql...');
        const schemaPath = path.join(__dirname, 'database_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // تقسيم الملف إلى عبارات SQL منفصلة
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('CREATE DATABASE') && !s.startsWith('USE'));

        console.log(`📝 وجدنا ${statements.length} عبارة SQL\n`);

        // تنفيذ العبارات
        let successCount = 0;
        let skipCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            
            try {
                // تخطي التعليقات والعبارات الفارغة
                if (stmt.startsWith('--') || stmt.length < 10) {
                    skipCount++;
                    continue;
                }
                
                await connection.execute(stmt);
                successCount++;
                
                // طباعة اسم الجدول إن وجد
                if (stmt.includes('CREATE TABLE')) {
                    const match = stmt.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
                    if (match) {
                        console.log(`✅ تم إنشاء جدول: ${match[1]}`);
                    }
                } else if (stmt.includes('INSERT INTO')) {
                    const match = stmt.match(/INSERT INTO\s+(\w+)/i);
                    if (match) {
                        console.log(`✅ تم إدراج بيانات في: ${match[1]}`);
                    }
                } else if (stmt.includes('CREATE OR REPLACE VIEW')) {
                    const match = stmt.match(/CREATE OR REPLACE VIEW\s+(\w+)/i);
                    if (match) {
                        console.log(`✅ تم إنشاء عرض: ${match[1]}`);
                    }
                }
            } catch (error) {
                // تجاهل أخطاء "already exists"
                if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
                    skipCount++;
                } else {
                    console.error(`⚠️ خطأ في تنفيذ العبارة: ${error.message}`);
                }
            }
        }

        console.log('\n═══════════════════════════════════════════════════');
        console.log('📊 النتائج:');
        console.log(`✅ نجح: ${successCount} عبارة`);
        console.log(`⏭️ تم تخطي: ${skipCount} عبارة`);
        console.log('═══════════════════════════════════════════════════\n');

        // عرض الجداول المنشأة
        console.log('📋 الجداول المتاحة:');
        const [tables] = await connection.execute('SHOW TABLES');
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
        });

        console.log('\n✅ تم تجهيز قاعدة البيانات بنجاح!');
        console.log('═══════════════════════════════════════════════════');

    } catch (error) {
        console.error('\n❌ حدث خطأ:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 نصيحة: تأكد من:');
            console.log('   1. أن عنوان الـ host صحيح (قد يكون مختلفاً عن localhost)');
            console.log('   2. أن قاعدة البيانات تسمح بالاتصال من عنوان IP الخاص بك');
            console.log('   3. راجع إعدادات Hostinger للحصول على عنوان الـ host الصحيح');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 نصيحة: تأكد من صحة اسم المستخدم وكلمة المرور');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }

    process.exit(0);
}

// تشغيل السكريبت
setupDatabase();
