package ai.biassense.app.data

import ai.biassense.app.domain.AnalysisRecord
import ai.biassense.app.domain.LabMetric
import ai.biassense.app.domain.UserProfile
import com.google.android.gms.tasks.Tasks
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions

data class SyncState(
    val profile: UserProfile = UserProfile(),
    val analyses: List<AnalysisRecord> = emptyList(),
    val loading: Boolean = true,
    val error: String = ""
)

class FirebaseSyncRepository(private val uid: String) {
    private val db = FirebaseFirestore.getInstance()
    private val registrations = mutableListOf<ListenerRegistration>()
    private var profile = UserProfile()
    private var analyses = emptyList<AnalysisRecord>()
    private var legacyReports = emptyList<AnalysisRecord>()
    private var loaded = 0
    private var onChange: ((SyncState) -> Unit)? = null

    fun listen(callback: (SyncState) -> Unit) {
        stop()
        onChange = callback
        loaded = 0
        registrations += db.collection("users").document(uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) return@addSnapshotListener fail(error.localizedMessage)
                if (snapshot?.exists() == true) profile = snapshot.toProfile(profile)
                loaded += 1
                emit()
            }
        registrations += db.collection("users").document(uid)
            .collection("settings").document("preferences")
            .addSnapshotListener { snapshot, error ->
                if (error != null) return@addSnapshotListener fail(error.localizedMessage)
                if (snapshot?.exists() == true) profile = snapshot.toProfile(profile)
                loaded += 1
                emit()
            }
        registrations += listenRecords("analyses") { analyses = it }
        registrations += listenRecords("reports") { legacyReports = it }
    }

    private fun listenRecords(collection: String, update: (List<AnalysisRecord>) -> Unit) =
        db.collection("users").document(uid).collection(collection)
            .addSnapshotListener { snapshot, error ->
                if (error != null) return@addSnapshotListener fail(error.localizedMessage)
                update(snapshot?.documents?.mapNotNull(::analysis) ?: emptyList())
                loaded += 1
                emit()
            }

    private fun emit() {
        val unique = (analyses + legacyReports).associateBy { it.id }.values
            .sortedByDescending { maxOf(it.createdAt, it.analysisDate) }
        onChange?.invoke(SyncState(profile, unique, loaded < 4))
    }

    private fun fail(message: String?) {
        onChange?.invoke(SyncState(profile, analyses, false, message ?: "Firebase data could not be loaded."))
    }

    fun saveProfile(value: UserProfile, done: (Result<Unit>) -> Unit) {
        val data = mapOf(
            "fullName" to value.fullName.trim(),
            "role" to value.role.trim(),
            "organization" to value.organization.trim(),
            "country" to value.country.trim(),
            "email" to value.email,
            "emailAlerts" to value.emailAlerts,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        val user = db.collection("users").document(uid)
        Tasks.whenAll(
            user.set(data, SetOptions.merge()),
            user.collection("settings").document("preferences").set(data, SetOptions.merge())
        ).addOnSuccessListener { done(Result.success(Unit)) }
            .addOnFailureListener { done(Result.failure(it)) }
    }

    fun saveAnalysis(value: AnalysisRecord, done: (Result<Unit>) -> Unit) {
        // Android-originated records use the reports channel. The web client
        // listens to both reports and analyses and deduplicates them by ID.
        // This also keeps older Android releases compatible with current data.
        val reports = db.collection("users").document(uid).collection("reports")
        val id = value.id.ifBlank { reports.document().id }
        val data = hashMapOf<String, Any?>(
            "userId" to uid,
            "sourcePlatform" to "android",
            "fileName" to value.fileName.take(180).ifBlank { "Scanned document" },
            "reportType" to value.reportType.ifBlank { "Laboratory Analysis" },
            "analysisDate" to System.currentTimeMillis(),
            "metrics" to value.metrics.map {
                mapOf(
                    "attribute" to it.attribute, "value" to it.value, "unit" to it.unit,
                    "referenceRange" to it.referenceRange, "sourceStatus" to it.sourceStatus,
                    "finalStatus" to it.finalStatus, "classification" to it.classification
                )
            },
            "findings" to value.findings,
            "recommendations" to value.recommendations,
            "summary" to value.summary,
            "status" to "Completed",
            "createdAt" to FieldValue.serverTimestamp()
        )
        reports.document(id).set(data)
            .addOnSuccessListener { done(Result.success(Unit)) }
            .addOnFailureListener { done(Result.failure(it)) }
    }

    fun stop() {
        registrations.forEach { it.remove() }
        registrations.clear()
    }

    private fun DocumentSnapshot.toProfile(previous: UserProfile) = UserProfile(
        fullName = getString("fullName") ?: previous.fullName,
        role = getString("role") ?: previous.role,
        organization = getString("organization") ?: previous.organization,
        country = getString("country") ?: previous.country,
        email = getString("email") ?: previous.email,
        emailAlerts = getBoolean("emailAlerts") ?: previous.emailAlerts
    )

    private fun analysis(document: DocumentSnapshot): AnalysisRecord? {
        val data = document.data ?: return null
        val metrics = (data["metrics"] as? List<*>)?.mapNotNull { raw ->
            val item = raw as? Map<*, *> ?: return@mapNotNull null
            val value = (item["value"] as? Number)?.toDouble() ?: return@mapNotNull null
            LabMetric(
                attribute = (item["attribute"] ?: item["name"] ?: "").toString(),
                value = value,
                unit = (item["unit"] ?: "").toString(),
                referenceRange = (item["referenceRange"] ?: "").toString(),
                sourceStatus = (item["sourceStatus"] ?: item["extractionStatus"] ?: "").toString(),
                finalStatus = (item["finalStatus"] ?: item["classification"] ?: "").toString(),
                classification = (item["classification"] ?: item["finalStatus"] ?: "Normal").toString()
            )
        } ?: emptyList()
        fun strings(key: String) = (data[key] as? List<*>)?.map { it.toString() } ?: emptyList()
        fun millis(key: String) = document.getTimestamp(key)?.toDate()?.time
            ?: (data[key] as? Number)?.toLong() ?: 0L
        return AnalysisRecord(
            id = document.id,
            userId = (data["userId"] ?: uid).toString(),
            fileName = (data["fileName"] ?: data["filename"] ?: "").toString(),
            reportType = (data["reportType"] ?: data["type"] ?: "Laboratory Analysis").toString(),
            analysisDate = millis("analysisDate"),
            createdAt = millis("createdAt"),
            metrics = metrics,
            findings = strings("findings"),
            recommendations = strings("recommendations"),
            summary = (data["summary"] ?: "Analysis completed.").toString(),
            status = (data["status"] ?: "Completed").toString()
        )
    }
}
