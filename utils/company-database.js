// utils/company-database.js
// هيكل Firestore:
//   companies/{companyId}                        ← بيانات الشركة + الموظفين
//   companies/{companyId}/contacts/{contactId}   ← جهات اتصال كل شركة منفصلة
//   companies/{companyId}/calls/{callId}          ← سجل مكالمات كل شركة منفصلة
//   companies/{companyId}/recordings/{id}         ← تسجيلات
//   companies/{companyId}/activity_log/{id}       ← سجل النشاطات
//   deleted_archive/{id}                          ← كل المحذوفات (لا تُمسح أبداً)

const { getDb } = require('./firebase');
const COMPANIES_DATA_DIR = '';

// ─────────────────────────────────────────────
//  قراءة جميع documents من subcollection شركة
// ─────────────────────────────────────────────
async function getCompanySubcollection(companyId, subcollection) {
    try {
        const { collection, getDocs } = require('firebase/firestore');
        const db = getDb();
        const snapshot = await getDocs(collection(db, 'companies', companyId, subcollection));
        const items = [];
        snapshot.forEach(d => items.push({ _id: d.id, ...d.data() }));
        return items;
    } catch (error) {
        console.error(`❌ getCompanySubcollection [${companyId}/${subcollection}]:`, error.message);
        return [];
    }
}

// ─────────────────────────────────────────────
//  حفظ document في subcollection شركة
// ─────────────────────────────────────────────
async function setCompanyDoc(companyId, subcollection, docId, data) {
    try {
        const { doc, setDoc } = require('firebase/firestore');
        const db = getDb();
        await setDoc(doc(db, 'companies', companyId, subcollection, docId), {
            ...data,
            companyId,
            _updatedAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error(`❌ setCompanyDoc [${companyId}/${subcollection}/${docId}]:`, error.message);
        return false;
    }
}

// ─────────────────────────────────────────────
//  حذف ناعم (soft delete) - يُحفظ في deleted_archive ولا يُمسح أبداً
// ─────────────────────────────────────────────
async function softDelete(companyId, subcollection, docId, originalData, deletedBy) {
    try {
        const { doc, setDoc, updateDoc } = require('firebase/firestore');
        const db = getDb();
        const archiveId = `${companyId}_${subcollection}_${docId}_${Date.now()}`;

        // 1) حفظ نسخة في deleted_archive (لا تُمسح أبداً)
        await setDoc(doc(db, 'deleted_archive', archiveId), {
            originalCollection: `companies/${companyId}/${subcollection}`,
            originalDocId: docId,
            companyId,
            subcollection,
            data: originalData,
            deletedBy: deletedBy || 'unknown',
            deletedAt: new Date().toISOString()
        });

        // 2) وضع علامة _deleted على الـ document الأصلي (لا نمسحه)
        await updateDoc(doc(db, 'companies', companyId, subcollection, docId), {
            _deleted: true,
            _deletedAt: new Date().toISOString(),
            _deletedBy: deletedBy || 'unknown',
            _archiveId: archiveId
        });

        console.log(`🗃️ Soft-deleted: ${companyId}/${subcollection}/${docId} → archive: ${archiveId}`);
        return true;
    } catch (error) {
        console.error(`❌ softDelete error:`, error.message);
        return false;
    }
}

// ─────────────────────────────────────────────
//  تسجيل نشاط لشركة
// ─────────────────────────────────────────────
async function logCompanyActivity(companyId, activity) {
    try {
        const { doc, setDoc } = require('firebase/firestore');
        const db = getDb();
        const activityId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await setDoc(doc(db, 'companies', companyId, 'activity_log', activityId), {
            ...activity,
            companyId,
            timestamp: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error(`❌ logCompanyActivity [${companyId}]:`, error.message);
        return false;
    }
}

// ─────────────────────────────────────────────
//  Compatibility stubs (الكود القديم كان يستخدم ملفات)
// ─────────────────────────────────────────────
async function readCompanyData(companyId, fileName) {
    const sub = fileName.replace('.json', '').replace('-', '_');
    if (fileName === 'contacts.json') {
        const contacts = await getCompanySubcollection(companyId, 'contacts');
        return { contacts: contacts.filter(c => !c._deleted) };
    }
    if (fileName === 'call-history.json') {
        const calls = await getCompanySubcollection(companyId, 'calls');
        return { calls: calls.filter(c => !c._deleted) };
    }
    if (fileName === 'recordings.json') {
        const recordings = await getCompanySubcollection(companyId, 'recordings');
        return { recordings: recordings.filter(r => !r._deleted) };
    }
    return {};
}

async function writeCompanyData(companyId, fileName, data) {
    // هذه الدالة قديمة - يُفضّل استخدام setCompanyDoc مباشرة
    return true;
}

function ensureCompanyDirectory(companyId) { return companyId; }
function initializeCompanyDatabase(companyId) { return true; }
function updateMetadata(companyId) { return true; }
async function deleteCompanyDatabase(companyId) { return true; }
function getAllCompanies() { return []; }
function backupCompanyDatabase(companyId) { return true; }
async function getCompanyDatabaseStats(companyId) {
    try {
        const [contacts, calls, recordings] = await Promise.all([
            getCompanySubcollection(companyId, 'contacts'),
            getCompanySubcollection(companyId, 'calls'),
            getCompanySubcollection(companyId, 'recordings')
        ]);
        return {
            companyId,
            contacts: contacts.filter(c => !c._deleted).length,
            calls: calls.filter(c => !c._deleted).length,
            recordings: recordings.filter(r => !r._deleted).length
        };
    } catch (e) { return null; }
}

module.exports = {
    getCompanySubcollection,
    setCompanyDoc,
    softDelete,
    logCompanyActivity,
    readCompanyData,
    writeCompanyData,
    ensureCompanyDirectory,
    initializeCompanyDatabase,
    deleteCompanyDatabase,
    getAllCompanies,
    backupCompanyDatabase,
    getCompanyDatabaseStats,
    updateMetadata,
    COMPANIES_DATA_DIR
};


// Default empty structures per file type
function getDefaultData(fileName) {
    const defaults = {
        'contacts.json':     { contacts: [] },
        'call-history.json': { calls: [] },
        'recordings.json':   { recordings: [] },
        'employees.json':    { employees: [] },
        'minutes-usage.json':{ usage: [] },
        'activity-log.json': { activities: [] },
        'metadata.json':     { version: '1.0', createdAt: new Date().toISOString() }
    };
    return defaults[fileName] || {};
}

// Firestore document ID = companyId_fileKey (e.g. "COMP-123_contacts")
function getDocId(companyId, fileName) {
    return `${companyId}_${fileName.replace('.json', '')}`;
}

// Stubs kept for backward compatibility (no-op on Firestore)
const COMPANIES_DATA_DIR = '';

// Read a data file for a company from Firestore
async function readCompanyData(companyId, fileName) {
    try {
        const { doc, getDoc } = require('firebase/firestore');
        const db = getDb();
        const docSnap = await getDoc(doc(db, 'company_data', getDocId(companyId, fileName)));
        if (docSnap.exists()) return docSnap.data();
        return getDefaultData(fileName);
    } catch (error) {
        console.error(`❌ Firestore read error ${fileName} for ${companyId}:`, error.message);
        return getDefaultData(fileName);
    }
}

// Write a data file for a company to Firestore
async function writeCompanyData(companyId, fileName, data) {
    try {
        const { doc, setDoc } = require('firebase/firestore');
        const db = getDb();
        await setDoc(doc(db, 'company_data', getDocId(companyId, fileName)), data);
        return true;
    } catch (error) {
        console.error(`❌ Firestore write error ${fileName} for ${companyId}:`, error.message);
        return false;
    }
}

// Log an activity for a company (fire-and-forget safe)
async function logCompanyActivity(companyId, activity) {
    try {
        const activityLog = await readCompanyData(companyId, 'activity-log.json') || { activities: [] };
        activityLog.activities.push({ timestamp: new Date().toISOString(), ...activity });
        if (activityLog.activities.length > 1000) {
            activityLog.activities = activityLog.activities.slice(-1000);
        }
        await writeCompanyData(companyId, 'activity-log.json', activityLog);
        return true;
    } catch (error) {
        console.error(`❌ logCompanyActivity error for ${companyId}:`, error.message);
        return false;
    }
}

// --- Compatibility stubs (filesystem ops replaced by Firestore) ---
function ensureCompanyDirectory(companyId) { return companyId; }
function initializeCompanyDatabase(companyId) { return true; }
function updateMetadata(companyId) { return true; }
async function deleteCompanyDatabase(companyId) { return true; }
function getAllCompanies() { return []; }
function backupCompanyDatabase(companyId) { return true; }

async function getCompanyDatabaseStats(companyId) {
    try {
        const [employees, contacts, callHistory, recordings] = await Promise.all([
            readCompanyData(companyId, 'employees.json'),
            readCompanyData(companyId, 'contacts.json'),
            readCompanyData(companyId, 'call-history.json'),
            readCompanyData(companyId, 'recordings.json')
        ]);
        return {
            companyId,
            employees:       employees?.employees?.length || 0,
            contacts:        contacts?.contacts?.length || 0,
            calls:           callHistory?.calls?.length || 0,
            recordings:      recordings?.recordings?.length || 0,
            activeEmployees: employees?.employees?.filter(e => e.active).length || 0
        };
    } catch (error) {
        return null;
    }
}

module.exports = {
    readCompanyData,
    writeCompanyData,
    logCompanyActivity,
    ensureCompanyDirectory,
    initializeCompanyDatabase,
    deleteCompanyDatabase,
    getAllCompanies,
    backupCompanyDatabase,
    getCompanyDatabaseStats,
    updateMetadata,
    COMPANIES_DATA_DIR
};
