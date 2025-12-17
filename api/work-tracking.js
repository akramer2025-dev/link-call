const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action, employeeId, employeeName, data } = req.body || {};

        if (!action || !employeeId) {
            return res.status(400).json({ 
                error: 'يجب تحديد action و employeeId' 
            });
        }

        const timestamp = new Date().toISOString();
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        switch (action) {
            case 'login':
                // تسجيل دخول الموظف
                const loginKey = `work:${employeeId}:${date}`;
                let workSession = await kv.get(loginKey) || {
                    employeeId,
                    employeeName,
                    date,
                    loginTime: timestamp,
                    logoutTime: null,
                    totalMinutes: 0,
                    calls: [],
                    activities: []
                };

                // إذا كان هناك جلسة مفتوحة، نضيف جلسة جديدة
                if (!workSession.logoutTime && workSession.loginTime !== timestamp) {
                    workSession.activities.push({
                        type: 'login',
                        time: timestamp
                    });
                } else {
                    workSession.loginTime = timestamp;
                }

                await kv.set(loginKey, workSession);
                
                return res.status(200).json({ 
                    success: true,
                    message: 'تم تسجيل الدخول بنجاح',
                    session: workSession
                });

            case 'logout':
                // تسجيل خروج الموظف
                const logoutKey = `work:${employeeId}:${date}`;
                let session = await kv.get(logoutKey);

                if (!session) {
                    return res.status(404).json({ 
                        error: 'لم يتم العثور على جلسة عمل' 
                    });
                }

                session.logoutTime = timestamp;
                
                // حساب إجمالي الوقت
                const loginDate = new Date(session.loginTime);
                const logoutDate = new Date(timestamp);
                const minutes = Math.floor((logoutDate - loginDate) / 1000 / 60);
                session.totalMinutes = minutes;

                session.activities.push({
                    type: 'logout',
                    time: timestamp
                });

                await kv.set(logoutKey, session);
                
                return res.status(200).json({ 
                    success: true,
                    message: 'تم تسجيل الخروج بنجاح',
                    session,
                    hoursWorked: (minutes / 60).toFixed(2)
                });

            case 'activity':
                // تسجيل نشاط (مكالمة، استراحة، إلخ)
                const activityKey = `work:${employeeId}:${date}`;
                let activitySession = await kv.get(activityKey);

                if (!activitySession) {
                    return res.status(404).json({ 
                        error: 'لم يتم العثور على جلسة عمل' 
                    });
                }

                const activity = {
                    type: data.type, // 'call', 'break', 'meeting', etc.
                    time: timestamp,
                    details: data.details || {}
                };

                activitySession.activities.push(activity);

                // إذا كان نشاط مكالمة، نضيفه لقائمة المكالمات
                if (data.type === 'call') {
                    activitySession.calls.push({
                        time: timestamp,
                        phoneNumber: data.details.phoneNumber,
                        duration: data.details.duration,
                        status: data.details.status
                    });
                }

                await kv.set(activityKey, activitySession);
                
                return res.status(200).json({ 
                    success: true,
                    message: 'تم تسجيل النشاط بنجاح',
                    activity
                });

            case 'get-report':
                // الحصول على تقرير موظف محدد
                const { startDate, endDate } = data || {};
                
                if (!startDate || !endDate) {
                    return res.status(400).json({ 
                        error: 'يجب تحديد startDate و endDate' 
                    });
                }

                const report = [];
                const start = new Date(startDate);
                const end = new Date(endDate);

                // جلب جميع أيام العمل في الفترة المحددة
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateKey = d.toISOString().split('T')[0];
                    const daySession = await kv.get(`work:${employeeId}:${dateKey}`);
                    
                    if (daySession) {
                        report.push(daySession);
                    }
                }

                // حساب الإجماليات
                const totalMinutes = report.reduce((sum, day) => sum + (day.totalMinutes || 0), 0);
                const totalCalls = report.reduce((sum, day) => sum + (day.calls?.length || 0), 0);

                return res.status(200).json({ 
                    success: true,
                    employeeId,
                    employeeName,
                    startDate,
                    endDate,
                    totalHours: (totalMinutes / 60).toFixed(2),
                    totalMinutes,
                    totalCalls,
                    totalDays: report.length,
                    dailyReport: report
                });

            case 'get-all-reports':
                // الحصول على تقرير جميع الموظفين
                const { reportStartDate, reportEndDate } = data || {};
                
                if (!reportStartDate || !reportEndDate) {
                    return res.status(400).json({ 
                        error: 'يجب تحديد reportStartDate و reportEndDate' 
                    });
                }

                // جلب جميع المفاتيح التي تبدأ بـ work:
                const allKeys = await kv.keys('work:*');
                const employeeReports = {};

                for (const key of allKeys) {
                    const session = await kv.get(key);
                    if (session && session.date >= reportStartDate && session.date <= reportEndDate) {
                        if (!employeeReports[session.employeeId]) {
                            employeeReports[session.employeeId] = {
                                employeeId: session.employeeId,
                                employeeName: session.employeeName,
                                totalMinutes: 0,
                                totalCalls: 0,
                                days: []
                            };
                        }
                        
                        employeeReports[session.employeeId].totalMinutes += session.totalMinutes || 0;
                        employeeReports[session.employeeId].totalCalls += session.calls?.length || 0;
                        employeeReports[session.employeeId].days.push(session);
                    }
                }

                // تحويل إلى array
                const reports = Object.values(employeeReports).map(report => ({
                    ...report,
                    totalHours: (report.totalMinutes / 60).toFixed(2)
                }));

                return res.status(200).json({ 
                    success: true,
                    startDate: reportStartDate,
                    endDate: reportEndDate,
                    totalEmployees: reports.length,
                    reports
                });

            default:
                return res.status(400).json({ 
                    error: 'Action غير صحيح' 
                });
        }

    } catch (error) {
        console.error('❌ خطأ في تتبع العمل:', error);
        return res.status(500).json({ 
            error: 'فشل في تتبع العمل',
            details: error.message 
        });
    }
};
