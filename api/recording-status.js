const COST_PER_MINUTE = 0.014;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const recordingSid = req.body.RecordingSid;
        const callSid      = req.body.CallSid;
        const duration     = parseInt(req.body.RecordingDuration || '0', 10); // ثوانٍ

        console.log('📼 تم إكمال التسجيل:', recordingSid, '— المدة:', duration, 'ثانية');

        // خصم الرصيد تلقائياً إذا كانت المدة > 0
        if (duration > 0 && callSid) {
            try {
                const { getDb } = require('../utils/firebase');
                const { doc, getDoc, updateDoc, deleteDoc } = require('firebase/firestore');
                const db = getDb();

                const callSnap = await getDoc(doc(db, 'active_calls', callSid));
                if (callSnap.exists()) {
                    const { companyId } = callSnap.data();
                    const minutes = duration / 60;
                    const cost    = minutes * COST_PER_MINUTE;

                    const compSnap = await getDoc(doc(db, 'companies', companyId));
                    if (compSnap.exists()) {
                        const comp = compSnap.data();
                        const newBalance = Math.max(0, (comp.balance !== undefined ? comp.balance : 61.0) - cost);
                        await updateDoc(doc(db, 'companies', companyId), {
                            balance:           Number(newBalance.toFixed(4)),
                            totalMinutesUsed:  Number(((comp.totalMinutesUsed  || 0) + minutes).toFixed(4)),
                            totalCostDeducted: Number(((comp.totalCostDeducted || 0) + cost  ).toFixed(4))
                        });
                        console.log(`💳 خصم ${cost.toFixed(4)}$ (${minutes.toFixed(2)} دق) من ${companyId} → رصيد: ${newBalance.toFixed(4)}$`);
                    }
                    await deleteDoc(doc(db, 'active_calls', callSid));
                }
            } catch (e) { console.error('⚠️ خصم الرصيد فشل:', e.message); }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('خطأ في recording-status:', error);
        res.status(500).json({ error: error.message });
    }
};
