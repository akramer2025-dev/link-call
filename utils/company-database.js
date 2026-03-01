// utils/company-database.js - Firestore backend
const { getDb } = require('./firebase');

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
