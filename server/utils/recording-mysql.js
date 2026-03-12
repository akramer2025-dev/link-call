/**
 * Recording Database Functions - MySQL
 * وظائف التعامل مع تسجيلات المكالمات في MySQL
 */

const { query, queryOne, beginTransaction, commit, rollback } = require('./mysql');

/**
 * Get all recordings for a company
 */
async function getCompanyRecordings(companyId, options = {}) {
    try {
        const {
            limit = 100,
            includeDeleted = false,
            employeeId = null
        } = options;
        
        let sql = 'SELECT * FROM recordings WHERE company_id = ?';
        const params = [companyId];
        
        if (!includeDeleted) {
            sql += ' AND is_deleted = FALSE';
        }
        
        if (employeeId) {
            sql += ' AND employee_id = ?';
            params.push(employeeId);
        }
        
        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);
        
        const recordings = await query(sql, params);
        return recordings;
    } catch (error) {
        console.error('❌ getCompanyRecordings error:', error.message);
        throw error;
    }
}

/**
 * Get recording by SID
 */
async function getRecordingBySid(sid) {
    try {
        const sql = 'SELECT * FROM recordings WHERE sid = ?';
        const recording = await queryOne(sql, [sid]);
        return recording;
    } catch (error) {
        console.error('❌ getRecordingBySid error:', error.message);
        throw error;
    }
}

/**
 * Get recordings by call SID
 */
async function getRecordingsByCallSid(callSid) {
    try {
        const sql = 'SELECT * FROM recordings WHERE call_sid = ? AND is_deleted = FALSE';
        const recordings = await query(sql, [callSid]);
        return recordings;
    } catch (error) {
        console.error('❌ getRecordingsByCallSid error:', error.message);
        throw error;
    }
}

/**
 * Create new recording
 */
async function createRecording(recordingData) {
    try {
        const sql = `
            INSERT INTO recordings (
                sid, call_sid, company_id, employee_id, url, duration, duration_text,
                status, to_number, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                url = VALUES(url),
                duration = VALUES(duration),
                status = VALUES(status),
                updated_at = NOW()
        `;
        
        // Calculate duration text
        const durationText = recordingData.duration_text || 
            `${Math.floor((recordingData.duration || 0) / 60)}:${((recordingData.duration || 0) % 60).toString().padStart(2, '0')}`;
        
        await query(sql, [
            recordingData.sid,
            recordingData.call_sid,
            recordingData.company_id,
            recordingData.employee_id || null,
            recordingData.url,
            recordingData.duration || 0,
            durationText,
            recordingData.status || 'completed',
            recordingData.to_number || null
        ]);
        
        return await getRecordingBySid(recordingData.sid);
    } catch (error) {
        console.error('❌ createRecording error:', error.message);
        throw error;
    }
}

/**
 * Update recording
 */
async function updateRecording(sid, updates) {
    try {
        const fields = [];
        const values = [];
        
        // Build dynamic UPDATE query
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'sid' || key === 'call_sid' || key === 'company_id') continue;
            
            let dbField = key;
            // Convert camelCase to snake_case
            dbField = dbField.replace(/([A-Z])/g, '_$1').toLowerCase();
            
            fields.push(`${dbField} = ?`);
            values.push(value);
        }
        
        if (fields.length === 0) {
            throw new Error('No fields to update');
        }
        
        fields.push('updated_at = NOW()');
        values.push(sid);
        
        const sql = `UPDATE recordings SET ${fields.join(', ')} WHERE sid = ?`;
        await query(sql, values);
        
        return await getRecordingBySid(sid);
    } catch (error) {
        console.error('❌ updateRecording error:', error.message);
        throw error;
    }
}

/**
 * Delete recording (soft delete)
 */
async function deleteRecording(sid, deletedBy) {
    try {
        const sql = `
            UPDATE recordings 
            SET is_deleted = TRUE, 
                deleted_at = NOW(), 
                deleted_by = ?,
                updated_at = NOW()
            WHERE sid = ?
        `;
        await query(sql, [deletedBy, sid]);
        
        // Archive to deleted_archive table
        const recording = await queryOne('SELECT * FROM recordings WHERE sid = ?', [sid]);
        if (recording) {
            const archiveId = `ARCH_REC_${Date.now()}_${sid}`;
            await query(`
                INSERT INTO deleted_archive (
                    archive_id, company_id, original_collection, subcollection, original_doc_id, data, deleted_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [archiveId, recording.company_id, 'companies', 'recordings', sid, JSON.stringify(recording), deletedBy]);
        }
        
        return true;
    } catch (error) {
        console.error('❌ deleteRecording error:', error.message);
        throw error;
    }
}

/**
 * Get recording statistics for a company
 */
async function getRecordingStats(companyId, options = {}) {
    try {
        const { startDate = null, endDate = null } = options;
        
        let sql = `
            SELECT 
                COUNT(*) as total_recordings,
                SUM(duration) as total_duration,
                AVG(duration) as avg_duration,
                MAX(created_at) as last_recording_date
            FROM recordings 
            WHERE company_id = ? AND is_deleted = FALSE
        `;
        
        const params = [companyId];
        
        if (startDate) {
            sql += ' AND created_at >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            sql += ' AND created_at <= ?';
            params.push(endDate);
        }
        
        const stats = await queryOne(sql, params);
        return stats;
    } catch (error) {
        console.error('❌ getRecordingStats error:', error.message);
        throw error;
    }
}

/**
 * Search recordings
 */
async function searchRecordings(companyId, searchTerm, limit = 50) {
    try {
        const sql = `
            SELECT * FROM recordings 
            WHERE company_id = ? AND is_deleted = FALSE
            AND (to_number LIKE ? OR call_sid LIKE ?)
            ORDER BY created_at DESC
            LIMIT ?
        `;
        
        const term = `%${searchTerm}%`;
        const recordings = await query(sql, [companyId, term, term, limit]);
        return recordings;
    } catch (error) {
        console.error('❌ searchRecordings error:', error.message);
        throw error;
    }
}

/**
 * Bulk create recordings (from Twilio sync)
 */
async function bulkCreateRecordings(recordings) {
    const connection = await beginTransaction();
    
    try {
        let successCount = 0;
        let duplicateCount = 0;
        let failedCount = 0;
        
        for (const rec of recordings) {
            try {
                // Check if exists
                const [existing] = await connection.execute(
                    'SELECT sid FROM recordings WHERE sid = ?', 
                    [rec.sid]
                );
                
                if (existing.length > 0) {
                    duplicateCount++;
                    continue;
                }
                
                // Insert
                const durationText = rec.duration_text || 
                    `${Math.floor((rec.duration || 0) / 60)}:${((rec.duration || 0) % 60).toString().padStart(2, '0')}`;
                
                await connection.execute(`
                    INSERT INTO recordings (
                        sid, call_sid, company_id, employee_id, url, duration, duration_text,
                        status, to_number, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    rec.sid,
                    rec.call_sid,
                    rec.company_id,
                    rec.employee_id || null,
                    rec.url,
                    rec.duration || 0,
                    durationText,
                    rec.status || 'completed',
                    rec.to_number || null
                ]);
                
                successCount++;
            } catch (error) {
                failedCount++;
                console.error(`Failed to insert recording ${rec.sid}:`, error.message);
            }
        }
        
        await commit(connection);
        
        return {
            success: successCount,
            duplicates: duplicateCount,
            failed: failedCount,
            total: recordings.length
        };
    } catch (error) {
        await rollback(connection);
        console.error('❌ bulkCreateRecordings error:', error.message);
        throw error;
    }
}

module.exports = {
    getCompanyRecordings,
    getRecordingBySid,
    getRecordingsByCallSid,
    createRecording,
    updateRecording,
    deleteRecording,
    getRecordingStats,
    searchRecordings,
    bulkCreateRecordings
};
