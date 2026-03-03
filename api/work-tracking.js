const { getDb } = require('../utils/firebase');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { doc, getDoc, setDoc, collection, getDocs } = require('firebase/firestore');
        const db = getDb();

        console.log('📊 Work tracking request:', req.method, req.body);

        const { action, employeeId, employeeName, data } = req.body || {};

        if (!action || !employeeId) {
            return res.status(400).json({ error: 'يجب تحديد action و employeeId' });
        }

        const timestamp = new Date().toISOString();
        const date = new Date().toISOString().split('T')[0];
        const sessionKey = `${employeeId}_${date}`;
        const sessionRef = doc(db, 'work_sessions', sessionKey);

        switch (action) {
            case 'login': {
                let workSession = { employeeId, employeeName, date, loginTime: timestamp, logoutTime: null, totalMinutes: 0, calls: [], activities: [] };
                const existing = await getDoc(sessionRef);
                if (existing.exists()) {
                    workSession = existing.data();
                    workSession.activities = workSession.activities || [];
                    workSession.activities.push({ type: 'login', time: timestamp });
                } else {
                    workSession.loginTime = timestamp;
                }
                await setDoc(sessionRef, workSession);
                return res.status(200).json({ success: true, message: 'تم تسجيل الدخول بنجاح', session: workSession });
            }

            case 'logout': {
                const snap = await getDoc(sessionRef);
                if (!snap.exists()) return res.status(404).json({ error: 'لم يتم العثور على جلسة عمل' });
                const session = snap.data();
                session.logoutTime = timestamp;
                session.totalMinutes = Math.floor((new Date(timestamp) - new Date(session.loginTime)) / 1000 / 60);
                session.activities = session.activities || [];
                session.activities.push({ type: 'logout', time: timestamp });
                await setDoc(sessionRef, session);
                return res.status(200).json({ success: true, message: 'تم تسجيل الخروج بنجاح', session, hoursWorked: (session.totalMinutes / 60).toFixed(2) });
            }

            case 'activity': {
                const snap = await getDoc(sessionRef);
                if (!snap.exists()) return res.status(404).json({ error: 'لم يتم العثور على جلسة عمل' });
                const activitySession = snap.data();
                activitySession.activities = activitySession.activities || [];
                activitySession.activities.push({ type: data.type, time: timestamp, details: data.details || {} });
                if (data.type === 'call') {
                    activitySession.calls = activitySession.calls || [];
                    activitySession.calls.push({ time: timestamp, phoneNumber: data.details.phoneNumber, duration: data.details.duration, status: data.details.status });
                }
                await setDoc(sessionRef, activitySession);
                return res.status(200).json({ success: true, message: 'تم تسجيل النشاط بنجاح' });
            }

            case 'get-report': {
                const { startDate, endDate } = data || {};
                if (!startDate || !endDate) return res.status(400).json({ error: 'يجب تحديد startDate و endDate' });
                const report = [];
                for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
                    const dateKey = d.toISOString().split('T')[0];
                    const daySnap = await getDoc(doc(db, 'work_sessions', `${employeeId}_${dateKey}`));
                    if (daySnap.exists()) report.push(daySnap.data());
                }
                const totalMinutes = report.reduce((sum, day) => sum + (day.totalMinutes || 0), 0);
                const totalCalls = report.reduce((sum, day) => sum + (day.calls?.length || 0), 0);
                return res.status(200).json({ success: true, employeeId, employeeName, startDate, endDate, totalHours: (totalMinutes / 60).toFixed(2), totalMinutes, totalCalls, totalDays: report.length, dailyReport: report });
            }

            case 'get-all-reports': {
                const { reportStartDate, reportEndDate } = data || {};
                if (!reportStartDate || !reportEndDate) return res.status(400).json({ error: 'يجب تحديد reportStartDate و reportEndDate' });
                const snapshot = await getDocs(collection(db, 'work_sessions'));
                const employeeReports = {};
                snapshot.forEach(docSnap => {
                    const session = docSnap.data();
                    if (session.date >= reportStartDate && session.date <= reportEndDate) {
                        if (!employeeReports[session.employeeId]) {
                            employeeReports[session.employeeId] = { employeeId: session.employeeId, employeeName: session.employeeName, totalMinutes: 0, totalCalls: 0, days: [] };
                        }
                        employeeReports[session.employeeId].totalMinutes += session.totalMinutes || 0;
                        employeeReports[session.employeeId].totalCalls += session.calls?.length || 0;
                        employeeReports[session.employeeId].days.push(session);
                    }
                });
                const reports = Object.values(employeeReports).map(r => ({ ...r, totalHours: (r.totalMinutes / 60).toFixed(2) }));
                return res.status(200).json({ success: true, startDate: reportStartDate, endDate: reportEndDate, totalEmployees: reports.length, reports });
            }

            default:
                return res.status(400).json({ error: 'Action غير صحيح' });
        }

    } catch (error) {
        console.error('❌ خطأ في تتبع العمل:', error);
        return res.status(500).json({ error: 'فشل في تتبع العمل', details: error.message });
    }
};