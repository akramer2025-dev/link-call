const twilio = require('twilio');
const { readCompanyData, writeCompanyData, logCompanyActivity } = require('../utils/company-database');

/**
 * إدارة تسجيلات المكالمات - نظام قواعد بيانات منفصلة لكل شركة
 * 
 * كل شركة لها ملف recordings.json خاص بها في:
 * companies-data/{companyId}/recordings.json
 * 
 * يتم حفظ معلومات التسجيلات محلياً (URLs، مدة، إلخ)
 * التسجيلات الفعلية مخزنة في Twilio
 */

/**
 * حفظ تسجيل في قاعدة بيانات الشركة
 */
function saveRecordingToCompanyDatabase(companyId, recordingData) {
    try {
        const recordings = readCompanyData(companyId, 'recordings.json');
        
        // التحقق من عدم تكرار التسجيل
        const existingRecording = recordings.recordings.find(r => r.sid === recordingData.sid);
        if (existingRecording) {
            // تحديث التسجيل إذا كان موجوداً
            const index = recordings.recordings.findIndex(r => r.sid === recordingData.sid);
            recordings.recordings[index] = { ...recordings.recordings[index], ...recordingData };
        } else {
            // إضافة تسجيل جديد
            recordings.recordings.push(recordingData);
        }
        
        // حفظ البيانات
        const success = writeCompanyData(companyId, 'recordings.json', recordings);
        
        if (success) {
            console.log(`🎙️ [${companyId}] تم حفظ تسجيل: ${recordingData.sid}`);
        }
        
        return success;
    } catch (error) {
        console.error(`❌ [${companyId}] خطأ في حفظ التسجيل:`, error);
        return false;
    }
}

/**
 * جلب التسجيلات
 */
async function getRecordings(companyId, options = {}) {
    try {
        const {
            source = 'local', // local أو twilio
            fromDate = null,
            toDate = null,
            employeeId = null,
            callSid = null,
            limit = 50
        } = options;
        
        let recordings = [];
        
        // جلب من قاعدة البيانات المحلية
        if (source === 'local') {
            const recordingsData = readCompanyData(companyId, 'recordings.json');
            recordings = recordingsData.recordings;
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
            
            if (fromDate) twilioOptions.dateCreated = new Date(fromDate);
            
            const twilioRecordings = await twilioClient.recordings.list(twilioOptions);
            
            // جلب معلومات المكالمات المرتبطة
            const callHistory = readCompanyData(companyId, 'call-history.json');
            
            recordings = twilioRecordings.map(recording => {
                // البحث عن المكالمة المرتبطة
                const relatedCall = callHistory.calls.find(c => c.sid === recording.callSid);
                
                return {
                    sid: recording.sid,
                    companyId,
                    callSid: recording.callSid,
                    duration: recording.duration,
                    dateCreated: recording.dateCreated,
                    uri: recording.uri,
                    url: `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`,
                    status: recording.status,
                    channels: recording.channels,
                    source: recording.source,
                    employeeId: relatedCall ? relatedCall.employeeId : null,
                    contactId: relatedCall ? relatedCall.contactId : null,
                    to: relatedCall ? relatedCall.to : null,
                    from: relatedCall ? relatedCall.from : null,
                    notes: '',
                    tags: [],
                    transcription: null,
                    quality: null
                };
            });
            
            // حفظ التسجيلات من Twilio في قاعدة البيانات المحلية
            recordings.forEach(recording => saveRecordingToCompanyDatabase(companyId, recording));
        }
        
        // تطبيق الفلاتر
        if (fromDate) {
            recordings = recordings.filter(r => new Date(r.dateCreated) >= new Date(fromDate));
        }
        
        if (toDate) {
            recordings = recordings.filter(r => new Date(r.dateCreated) <= new Date(toDate));
        }
        
        if (employeeId) {
            recordings = recordings.filter(r => r.employeeId === employeeId);
        }
        
        if (callSid) {
            recordings = recordings.filter(r => r.callSid === callSid);
        }
        
        // ترتيب حسب التاريخ (الأحدث أولاً)
        recordings.sort((a, b) => {
            const dateA = new Date(a.dateCreated);
            const dateB = new Date(b.dateCreated);
            return dateB - dateA;
        });
        
        // تطبيق الحد الأقصى
        if (limit) {
            recordings = recordings.slice(0, limit);
        }
        
        return recordings;
    } catch (error) {
        console.error(`❌ [${companyId}] خطأ في جلب التسجيلات:`, error);
        throw error;
    }
}

/**
 * الحصول على إحصائيات التسجيلات
 */
function getRecordingStatistics(companyId, options = {}) {
    try {
        const {
            fromDate = null,
            toDate = null,
            employeeId = null
        } = options;
        
        const recordingsData = readCompanyData(companyId, 'recordings.json');
        let recordings = recordingsData.recordings;
        
        // تطبيق الفلاتر
        if (fromDate) {
            recordings = recordings.filter(r => new Date(r.dateCreated) >= new Date(fromDate));
        }
        
        if (toDate) {
            recordings = recordings.filter(r => new Date(r.dateCreated) <= new Date(toDate));
        }
        
        if (employeeId) {
            recordings = recordings.filter(r => r.employeeId === employeeId);
        }
        
        // حساب الإحصائيات
        const totalRecordings = recordings.length;
        const totalDuration = recordings.reduce((sum, rec) => sum + (rec.duration || 0), 0);
        const avgDuration = totalRecordings > 0 ? Math.round(totalDuration / totalRecordings) : 0;
        const totalMinutes = Math.round(totalDuration / 60);
        
        return {
            totalRecordings,
            totalDuration, // بالثواني
            totalMinutes,
            avgDuration, // بالثواني
            oldestRecording: recordings.length > 0 ? recordings[recordings.length - 1].dateCreated : null,
            newestRecording: recordings.length > 0 ? recordings[0].dateCreated : null
        };
    } catch (error) {
        console.error(`❌ [${companyId}] خطأ في حساب إحصائيات التسجيلات:`, error);
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
        // GET - جلب التسجيلات
        if (req.method === 'GET') {
            const { companyId, action, ...filters } = req.query;
            
            // التحقق من وجود companyId
            if (!companyId) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID is required' 
                });
            }
            
            // إحصائيات التسجيلات
            if (action === 'statistics') {
                const stats = getRecordingStatistics(companyId, filters);
                
                console.log(`📊 [${companyId}] جلب إحصائيات التسجيلات`);
                
                return res.status(200).json({
                    success: true,
                    statistics: stats
                });
            }
            
            // التسجيلات
            const recordings = await getRecordings(companyId, filters);
            
            console.log(`📋 [${companyId}] جلب ${recordings.length} تسجيل`);
            
            return res.status(200).json({ 
                success: true,
                recordings,
                count: recordings.length
            });
        }

        // POST - إضافة/تحديث تسجيل
        if (req.method === 'POST') {
            const { companyId, recordingData } = req.body;
            
            // التحقق من البيانات المطلوبة
            if (!companyId || !recordingData) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID and recording data are required' 
                });
            }
            
            // حفظ التسجيل
            const success = saveRecordingToCompanyDatabase(companyId, recordingData);
            
            if (success) {
                // تسجيل النشاط
                logCompanyActivity(companyId, {
                    action: 'recording_saved',
                    recordingSid: recordingData.sid,
                    callSid: recordingData.callSid,
                    duration: recordingData.duration,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✅ [${companyId}] تم حفظ تسجيل: ${recordingData.sid}`);
                
                return res.status(200).json({ 
                    success: true,
                    message: 'Recording saved successfully'
                });
            } else {
                throw new Error('Failed to save recording');
            }
        }

        // PUT - تحديث معلومات تسجيل (ملاحظات، علامات، تقييم)
        if (req.method === 'PUT') {
            const { companyId, recordingSid, notes, tags, quality, transcription } = req.body;
            
            // التحقق من البيانات المطلوبة
            if (!companyId || !recordingSid) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID and Recording SID are required' 
                });
            }
            
            // قراءة التسجيلات
            const recordingsData = readCompanyData(companyId, 'recordings.json');
            
            // البحث عن التسجيل
            const recordingIndex = recordingsData.recordings.findIndex(r => r.sid === recordingSid);
            
            if (recordingIndex === -1) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Recording not found' 
                });
            }
            
            // تحديث البيانات
            if (notes !== undefined) recordingsData.recordings[recordingIndex].notes = notes;
            if (tags !== undefined) recordingsData.recordings[recordingIndex].tags = tags;
            if (quality !== undefined) recordingsData.recordings[recordingIndex].quality = quality;
            if (transcription !== undefined) recordingsData.recordings[recordingIndex].transcription = transcription;
            
            recordingsData.recordings[recordingIndex].lastModified = new Date().toISOString();
            
            // حفظ البيانات
            const success = writeCompanyData(companyId, 'recordings.json', recordingsData);
            
            if (success) {
                // تسجيل النشاط
                logCompanyActivity(companyId, {
                    action: 'recording_updated',
                    recordingSid,
                    updates: { 
                        notes: notes ? 'updated' : 'unchanged',
                        tags: tags ? 'updated' : 'unchanged',
                        quality: quality ? 'updated' : 'unchanged'
                    },
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✏️ [${companyId}] تم تحديث تسجيل: ${recordingSid}`);
                
                return res.status(200).json({ 
                    success: true,
                    recording: recordingsData.recordings[recordingIndex],
                    message: 'Recording updated successfully'
                });
            } else {
                throw new Error('Failed to update recording');
            }
        }

        // DELETE - حذف تسجيل (من قاعدة البيانات المحلية فقط)
        if (req.method === 'DELETE') {
            const { companyId, recordingSid, permanent } = req.query;
            
            // التحقق من البيانات المطلوبة
            if (!companyId || !recordingSid) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Company ID and Recording SID are required' 
                });
            }
            
            // قراءة التسجيلات
            const recordingsData = readCompanyData(companyId, 'recordings.json');
            
            // البحث عن التسجيل
            const recordingIndex = recordingsData.recordings.findIndex(r => r.sid === recordingSid);
            
            if (recordingIndex === -1) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Recording not found' 
                });
            }
            
            // حفظ بيانات التسجيل المحذوف
            const deletedRecording = recordingsData.recordings[recordingIndex];
            
            // حذف من قاعدة البيانات المحلية
            recordingsData.recordings.splice(recordingIndex, 1);
            
            // حفظ البيانات
            const success = writeCompanyData(companyId, 'recordings.json', recordingsData);
            
            if (success) {
                // حذف دائم من Twilio (اختياري)
                if (permanent === 'true') {
                    try {
                        const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
                        const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
                        
                        if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
                            const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
                            await twilioClient.recordings(recordingSid).remove();
                            console.log(`🗑️ [${companyId}] تم حذف التسجيل من Twilio: ${recordingSid}`);
                        }
                    } catch (twilioError) {
                        console.error(`⚠️ [${companyId}] فشل حذف التسجيل من Twilio:`, twilioError);
                        // لكن نستمر لأنه تم الحذف من قاعدة البيانات المحلية
                    }
                }
                
                // تسجيل النشاط
                logCompanyActivity(companyId, {
                    action: 'recording_deleted',
                    recordingSid,
                    callSid: deletedRecording.callSid,
                    permanent: permanent === 'true',
                    timestamp: new Date().toISOString()
                });
                
                console.log(`🗑️ [${companyId}] تم حذف تسجيل: ${recordingSid} (${permanent === 'true' ? 'نهائي' : 'محلي فقط'})`);
                
                return res.status(200).json({ 
                    success: true,
                    message: permanent === 'true' ? 'Recording deleted permanently' : 'Recording deleted from local database'
                });
            } else {
                throw new Error('Failed to delete recording');
            }
        }

        // طريقة غير مدعومة
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });

    } catch (error) {
        console.error('❌ خطأ في recordings API:', error);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// تصدير الوظائف للاستخدام في أماكن أخرى
module.exports.saveRecordingToCompanyDatabase = saveRecordingToCompanyDatabase;
module.exports.getRecordings = getRecordings;
module.exports.getRecordingStatistics = getRecordingStatistics;
