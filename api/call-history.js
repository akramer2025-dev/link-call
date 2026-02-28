const twilio = require('twilio');
const { readCompanyData, writeCompanyData, logCompanyActivity } = require('../utils/company-database');

/**
 * إدارة سجل المكالمات - نظام قواعد بيانات منفصلة لكل شركة
 * 
 * كل شركة لها ملف call-history.json خاص بها في:
 * companies-data/{companyId}/call-history.json
 * 
 * يتم حفظ جميع المكالمات محلياً بالإضافة إلى Twilio
 * هذا يوفر:
 * - سرعة في الوصول للبيانات
 * - تقليل استدعاءات Twilio API
 * - إمكانية البحث والتحليل المتقدم
 * - نسخ احتياطية محلية
 */

/**
 * حفظ مكالمة في قاعدة بيانات الشركة
 */
function saveCallToCompanyDatabase(companyId, callData) {
    try {
        const callHistory = readCompanyData(companyId, 'call-history.json');
        
        // التحقق من عدم تكرار المكالمة
        const existingCall = callHistory.calls.find(c => c.sid === callData.sid);
        if (existingCall) {
            // تحديث المكالمة إذا كانت موجودة
            const index = callHistory.calls.findIndex(c => c.sid === callData.sid);
            callHistory.calls[index] = { ...callHistory.calls[index], ...callData };
        } else {
            // إضافة مكالمة جديدة
            callHistory.calls.push(callData);
        }
        
        // حفظ البيانات
        const success = writeCompanyData(companyId, 'call-history.json', callHistory);
        
        if (success) {
            console.log(`📞 [${companyId}] تم حفظ مكالمة: ${callData.sid}`);
        }
        
        return success;
    } catch (error) {
        console.error(`❌ [${companyId}] خطأ في حفظ المكالمة:`, error);
        return false;
    }
}

/**
 * جلب سجل المكالمات
 */
async function getCallHistory(companyId, options = {}) {
    try {
        const {
            source = 'local', // local أو twilio
            fromDate = null,
            toDate = null,
            employeeId = null,
            contactId = null,
            direction = null, // inbound أو outbound
            status = null,
            limit = 100
        } = options;
        
        let calls = [];
        
        // جلب من قاعدة البيانات المحلية
        if (source === 'local') {
            const callHistory = readCompanyData(companyId, 'call-history.json');
            calls = callHistory.calls;
        }
        // جلب من Twilio
        else if (source === 'twilio') {
            const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
            const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
            
            if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
                throw new Error('Twilio credentials not configured');
            }
            
            const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
            const twilioOptions = { limit };
            
            if (fromDate) twilioOptions.startTime = new Date(fromDate);
            if (toDate) twilioOptions.endTime = new Date(toDate);
            
            const twilioCalls = await twilioClient.calls.list(twilioOptions);
            
            calls = twilioCalls.map(call => ({
                sid: call.sid,
                companyId,
                from: call.from,
                to: call.to,
                status: call.status,
                duration: call.duration || 0,
                startTime: call.startTime,
                endTime: call.endTime,
                direction: call.direction,
                price: call.price,
                priceUnit: call.priceUnit,
                answeredBy: call.answeredBy,
                recordingUrl: null,
                employeeId: null,
                contactId: null,
                notes: '',
                createdAt: call.dateCreated
            }));
            
            // حفظ المكالمات من Twilio في قاعدة البيانات المحلية
            calls.forEach(call => saveCallToCompanyDatabase(companyId, call));
        }
        
        // تطبيق الفلاتر
        if (fromDate) {
            calls = calls.filter(c => new Date(c.startTime || c.createdAt) >= new Date(fromDate));
        }
        
        if (toDate) {
            calls = calls.filter(c => new Date(c.startTime || c.createdAt) <= new Date(toDate));
        }
        
        if (employeeId) {
            calls = calls.filter(c => c.employeeId === employeeId);
        }
        
        if (contactId) {
            calls = calls.filter(c => c.contactId === contactId);
        }
        
        if (direction) {
            calls = calls.filter(c => c.direction === direction);
        }
        
        if (status) {
            calls = calls.filter(c => c.status === status);
        }
        
        // ترتيب حسب التاريخ (الأحدث أولاً)
        calls.sort((a, b) => {
            const dateA = new Date(a.startTime || a.createdAt);
            const dateB = new Date(b.startTime || b.createdAt);
            return dateB - dateA;
        });
        
        // تطبيق الحد الأقصى
        if (limit) {
            calls = calls.slice(0, limit);
        }
        
        return calls;
    } catch (error) {
        console.error(`❌ [${companyId}] خطأ في جلب سجل المكالمات:`, error);
        throw error;
    }
}

/**
 * الحصول على إحصائيات المكالمات
 */
function getCallStatistics(companyId, options = {}) {
    try {
        const {
            fromDate = null,
            toDate = null,
            employeeId = null
        } = options;
        
        const callHistory = readCompanyData(companyId, 'call-history.json');
        let calls = callHistory.calls;
        
        // تطبيق الفلاتر
        if (fromDate) {
            calls = calls.filter(c => new Date(c.startTime || c.createdAt) >= new Date(fromDate));
        }
        
        if (toDate) {
            calls = calls.filter(c => new Date(c.startTime || c.createdAt) <= new Date(toDate));
        }
        
        if (employeeId) {
            calls = calls.filter(c => c.employeeId === employeeId);
        }
        
        // حساب الإحصائيات
        const totalCalls = calls.length;
        const completedCalls = calls.filter(c => c.status === 'completed').length;
        const missedCalls = calls.filter(c => c.status === 'no-answer' || c.status === 'busy').length;
        const failedCalls = calls.filter(c => c.status === 'failed').length;
        const inboundCalls = calls.filter(c => c.direction === 'inbound').length;
        const outboundCalls = calls.filter(c => c.direction === 'outbound').length;
        
        const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
        const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
        
        const totalMinutes = Math.round(totalDuration / 60);
        
        return {
            totalCalls,
            completedCalls,
            missedCalls,
            failedCalls,
            inboundCalls,
            outboundCalls,
            totalDuration, // بالثواني
            totalMinutes,
            avgDuration, // بالثواني
            completionRate: totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0
        };
    } catch (error) {
        console.error(`❌ [${companyId}] خطأ في حساب الإحصائيات:`, error);
        throw error;
    }
}

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // التعامل مع OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - جلب سجل المكالمات
        if (req.method === 'GET') {
            const { companyId, action, ...filters } = req.query;
            
            // التحقق من وجود companyId
            if (!companyId) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID is required' 
                });
            }
            
            // إحصائيات المكالمات
            if (action === 'statistics') {
                const stats = getCallStatistics(companyId, filters);
                
                console.log(`📊 [${companyId}] جلب إحصائيات المكالمات`);
                
                return res.status(200).json({
                    success: true,
                    statistics: stats
                });
            }
            
            // سجل المكالمات
            const calls = await getCallHistory(companyId, filters);
            
            console.log(`📋 [${companyId}] جلب ${calls.length} مكالمة`);
            
            return res.status(200).json({ 
                success: true,
                calls,
                count: calls.length
            });
        }

        // POST - إضافة/تحديث مكالمة
        if (req.method === 'POST') {
            const { companyId, callData } = req.body;
            
            // التحقق من البيانات المطلوبة
            if (!companyId || !callData) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID and call data are required' 
                });
            }
            
            // حفظ المكالمة
            const success = saveCallToCompanyDatabase(companyId, callData);
            
            if (success) {
                // تسجيل النشاط
                logCompanyActivity(companyId, {
                    action: 'call_saved',
                    callSid: callData.sid,
                    direction: callData.direction,
                    duration: callData.duration,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✅ [${companyId}] تم حفظ مكالمة: ${callData.sid}`);
                
                return res.status(200).json({ 
                    success: true,
                    message: 'Call saved successfully'
                });
            } else {
                throw new Error('Failed to save call');
            }
        }

        // PUT - تحديث معلومات مكالمة (ملاحظات، موظف، جهة اتصال)
        if (req.method === 'PUT') {
            const { companyId, callSid, employeeId, contactId, notes } = req.body;
            
            // التحقق من البيانات المطلوبة
            if (!companyId || !callSid) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID and Call SID are required' 
                });
            }
            
            // قراءة سجل المكالمات
            const callHistory = readCompanyData(companyId, 'call-history.json');
            
            // البحث عن المكالمة
            const callIndex = callHistory.calls.findIndex(c => c.sid === callSid);
            
            if (callIndex === -1) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Call not found' 
                });
            }
            
            // تحديث البيانات
            if (employeeId !== undefined) callHistory.calls[callIndex].employeeId = employeeId;
            if (contactId !== undefined) callHistory.calls[callIndex].contactId = contactId;
            if (notes !== undefined) callHistory.calls[callIndex].notes = notes;
            
            callHistory.calls[callIndex].lastModified = new Date().toISOString();
            
            // حفظ البيانات
            const success = writeCompanyData(companyId, 'call-history.json', callHistory);
            
            if (success) {
                // تسجيل النشاط
                logCompanyActivity(companyId, {
                    action: 'call_updated',
                    callSid,
                    updates: { employeeId, contactId, notes: notes ? 'updated' : 'unchanged' },
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✏️ [${companyId}] تم تحديث مكالمة: ${callSid}`);
                
                return res.status(200).json({ 
                    success: true,
                    call: callHistory.calls[callIndex],
                    message: 'Call updated successfully'
                });
            } else {
                throw new Error('Failed to update call');
            }
        }

        // DELETE - حذف مكالمة
        if (req.method === 'DELETE') {
            const { companyId, callSid } = req.query;
            
            // التحقق من البيانات المطلوبة
            if (!companyId || !callSid) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID and Call SID are required' 
                });
            }
            
            // قراءة سجل المكالمات
            const callHistory = readCompanyData(companyId, 'call-history.json');
            
            // البحث عن المكالمة
            const callIndex = callHistory.calls.findIndex(c => c.sid === callSid);
            
            if (callIndex === -1) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Call not found' 
                });
            }
            
            // حفظ بيانات المكالمة المحذوفة
            const deletedCall = callHistory.calls[callIndex];
            
            // حذف المكالمة
            callHistory.calls.splice(callIndex, 1);
            
            // حفظ البيانات
            const success = writeCompanyData(companyId, 'call-history.json', callHistory);
            
            if (success) {
                // تسجيل النشاط
                logCompanyActivity(companyId, {
                    action: 'call_deleted',
                    callSid,
                    direction: deletedCall.direction,
                    duration: deletedCall.duration,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`🗑️ [${companyId}] تم حذف مكالمة: ${callSid}`);
                
                return res.status(200).json({ 
                    success: true,
                    message: 'Call deleted successfully'
                });
            } else {
                throw new Error('Failed to delete call');
            }
        }

        // طريقة غير مدعومة
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });

    } catch (error) {
        console.error('❌ خطأ في call-history API:', error);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// تصدير الوظائف للاستخدام في أماكن أخرى
module.exports.saveCallToCompanyDatabase = saveCallToCompanyDatabase;
module.exports.getCallHistory = getCallHistory;
module.exports.getCallStatistics = getCallStatistics;
