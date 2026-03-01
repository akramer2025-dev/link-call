const COST_PER_MINUTE = 0.014;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const recordingSid    = req.body.RecordingSid;
        const callSid         = req.body.CallSid;
        const parentCallSid   = req.body.ParentCallSid || callSid; // fallback for dial recordings
        const duration        = parseInt(req.body.RecordingDuration || '0', 10); // ثوانٍ
        const recordingUrl    = req.body.RecordingUrl
            || `https://api.twilio.com/2010-04-01/Accounts/${req.body.AccountSid}/Recordings/${recordingSid}`;
        const recordingStatus = req.body.RecordingStatus || 'completed';
        const toNumber        = req.body.To || req.body.Called || '';

        console.log('📼 recording-status:', { recordingSid, callSid, parentCallSid, duration, toNumber });

        if (recordingSid) {
            try {
                const { getDb } = require('../utils/firebase');
                const { doc, getDoc, setDoc, updateDoc, deleteDoc } = require('firebase/firestore');
                const db = getDb();

                // ─── جلب بيانات المكالمة: نجرب callSid ثم parentCallSid ───
                let callData = null;
                let usedSid  = callSid;

                const snap1 = await getDoc(doc(db, 'active_calls', callSid));
                if (snap1.exists()) {
                    callData = snap1.data();
                } else if (parentCallSid && parentCallSid !== callSid) {
                    const snap2 = await getDoc(doc(db, 'active_calls', parentCallSid));
                    if (snap2.exists()) { callData = snap2.data(); usedSid = parentCallSid; }
                }

                const companyId  = callData ? callData.companyId  : null;
                const employeeId = callData ? callData.employeeId : 'unknown';

                // ──────────────────────────────────────────────────────────
                // 1) حفظ التسجيل في companies/{companyId}/recordings/{sid}
                // ──────────────────────────────────────────────────────────
                if (companyId && recordingSid) {
                    const mm = Math.floor(duration / 60).toString().padStart(2, '0');
                    const ss = (duration % 60).toString().padStart(2, '0');

                    await setDoc(doc(db, 'companies', companyId, 'recordings', recordingSid), {
                        sid:          recordingSid,
                        callSid,
                        companyId,
                        employeeId,
                        to:           toNumber,
                        url:          recordingUrl + '.mp3',
                        duration,
                        durationText: `${mm}:${ss}`,
                        status:       recordingStatus,
                        createdAt:    new Date().toISOString()
                    });
                    console.log(`📦 [حفظ تسجيل] ${recordingSid} → companies/${companyId}/recordings`);
                } else {
                    console.warn(`⚠️ لم يُحفظ التسجيل — companyId: ${companyId}, sid: ${recordingSid}`);
                }

                // ──────────────────────────────────────────────────────────
                // 2) خصم الرصيد إذا كانت المدة > 0
                // ──────────────────────────────────────────────────────────
                if (duration > 0 && companyId) {
                    const minutes = duration / 60;
                    const cost    = minutes * COST_PER_MINUTE;

                    const compSnap = await getDoc(doc(db, 'companies', companyId));
                    if (compSnap.exists()) {
                        const comp       = compSnap.data();
                        const oldBalance = comp.balance !== undefined ? comp.balance : 61.0;
                        const newBalance = Math.max(0, oldBalance - cost);

                        await updateDoc(doc(db, 'companies', companyId), {
                            balance:           Number(newBalance.toFixed(4)),
                            totalMinutesUsed:  Number(((comp.totalMinutesUsed  || 0) + minutes).toFixed(4)),
                            totalCostDeducted: Number(((comp.totalCostDeducted || 0) + cost  ).toFixed(4))
                        });
                        console.log(`💳 خصم ${cost.toFixed(4)}$ (${minutes.toFixed(2)} دق) من ${companyId} → رصيد: ${newBalance.toFixed(4)}$`);
                    }
                }

                // ──────────────────────────────────────────────────────────
                // 3) حذف active_calls document (cleanup)
                // ──────────────────────────────────────────────────────────
                if (callData) {
                    await deleteDoc(doc(db, 'active_calls', usedSid));
                }

            } catch (e) {
                console.error('⚠️ recording-status Firestore error:', e.message);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('خطأ في recording-status:', error);
        res.status(500).json({ error: error.message });
    }
};
